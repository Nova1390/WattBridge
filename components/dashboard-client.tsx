"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Database, RefreshCw, ShieldCheck, Sparkles, SunMedium } from "lucide-react";
import { formatWatts } from "@/lib/core/energy";
import { mockAuditEvents, mockDryer, mockEnergyState, mockRecommendation } from "@/lib/core/mock-data";
import { createApprovalRequest } from "@/lib/core/rules";
import type { AuditEvent, DeviceState, EnergyState, Recommendation } from "@/lib/core/types";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { seedDemoState } from "@/lib/supabase/demo-repository";

type LoadState = "mock" | "loading" | "remote" | "error";

export function DashboardClient() {
  const [mode, setMode] = useState<LoadState>(isSupabaseConfigured() ? "loading" : "mock");
  const [energy, setEnergy] = useState<EnergyState>(mockEnergyState);
  const [device, setDevice] = useState<DeviceState>(mockDryer);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(mockRecommendation);
  const [audit, setAudit] = useState<AuditEvent[]>(mockAuditEvents);
  const [message, setMessage] = useState("");

  const client = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    if (!client) return;

    async function load() {
      const supabase = client;
      if (!supabase) return;
      const { data: userResult } = await supabase.auth.getUser();
      if (!userResult.user) {
        setMode("mock");
        setMessage("Login non effettuato: sto mostrando dati mock locali.");
        return;
      }

      const { data: energyRows, error: energyError } = await supabase
        .from("energy_current_state")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (energyError) {
        setMode("error");
        setMessage(energyError.message);
        return;
      }

      const { data: deviceRows } = await supabase.from("devices").select("*, device_current_state(*)").limit(1);
      const { data: recommendationRows } = await supabase
        .from("recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      const { data: auditRows } = await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(6);

      if (energyRows?.[0]) {
        setEnergy({
          timestamp: energyRows[0].timestamp,
          production_w: energyRows[0].production_w,
          consumption_w: energyRows[0].consumption_w,
          grid_import_w: energyRows[0].grid_import_w,
          grid_export_w: energyRows[0].grid_export_w,
          surplus_w: energyRows[0].surplus_w,
          self_consumption_w: energyRows[0].self_consumption_w,
          quality: energyRows[0].quality
        });
      }

      if (deviceRows?.[0]) {
        const currentState = Array.isArray(deviceRows[0].device_current_state)
          ? deviceRows[0].device_current_state[0]
          : deviceRows[0].device_current_state;
        setDevice({
          id: deviceRows[0].id,
          display_name: deviceRows[0].display_name,
          device_type: deviceRows[0].device_type,
          integration_id: deviceRows[0].integration_id,
          status: deviceRows[0].status,
          operating_state: currentState?.operating_state ?? "unknown",
          power_w: currentState?.power_w ?? undefined,
          energy_wh: currentState?.energy_wh ?? undefined,
          capabilities: deviceRows[0].capabilities ?? [],
          updated_at: currentState?.updated_at ?? deviceRows[0].last_seen_at
        });
      }

      if (recommendationRows?.[0]) {
        setRecommendation({
          id: recommendationRows[0].id,
          device_id: recommendationRows[0].device_id,
          created_at: recommendationRows[0].created_at,
          expires_at: recommendationRows[0].expires_at,
          title: recommendationRows[0].title,
          reason: recommendationRows[0].reason,
          recommended_action: recommendationRows[0].recommended_action,
          surplus_w: recommendationRows[0].surplus_w,
          status: recommendationRows[0].status
        });
      }

      if (auditRows) {
        setAudit(auditRows as AuditEvent[]);
      }

      setMode("remote");
      setMessage("Dati caricati da Supabase.");
    }

    void load();
  }, [client]);

  async function seedRemoteDemo() {
    if (!client) return;
    const { data } = await client.auth.getUser();
    if (!data.user) {
      setMessage("Effettua il login prima di caricare i dati demo su Supabase.");
      return;
    }
    setMode("loading");
    await seedDemoState(client, data.user.id);
    window.location.reload();
  }

  async function approveMock() {
    if (!recommendation) return;
    const approval = createApprovalRequest(recommendation);
    setAudit((events) => [
      {
        id: `audit_${Date.now()}`,
        created_at: new Date().toISOString(),
        event_type: "approval_approved",
        actor: "user",
        summary: `Approval mock registrata per ${device.display_name}.`,
        metadata: { approval_id: approval.id }
      },
      ...events
    ]);
    setRecommendation({ ...recommendation, status: "approved" });
    setMessage("Approval mock registrata. Nessun comando reale e stato inviato.");
  }

  const exportRatio = Math.min(Math.max((energy.surplus_w / Math.max(energy.production_w, 1)) * 100, 0), 100);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="eyebrow">Dashboard operativa</div>
          <h1>Energia casa</h1>
        </div>
        <span className="status-pill">
          <ShieldCheck size={16} />
          {mode === "remote" ? "Supabase live" : mode === "loading" ? "Caricamento" : "Mock sicuro"}
        </span>
      </div>

      <section className="hero-plane">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow" style={{ color: "rgba(255,255,255,.68)" }}>
              Surplus fotovoltaico
            </span>
            <h1>{formatWatts(energy.surplus_w)}</h1>
            <p>
              WattBridge mostra una raccomandazione manuale quando il surplus e sufficiente. La foundation non invia
              comandi reali.
            </p>
          </div>
          <div className="flow-meter">
            <div className="flow-row">
              <span>Produzione</span>
              <strong className="flow-value">{formatWatts(energy.production_w)}</strong>
            </div>
            <div className="flow-row">
              <span>Consumo</span>
              <strong>{formatWatts(energy.consumption_w)}</strong>
            </div>
            <div className="bar" aria-label="Quota surplus">
              <span style={{ "--value": `${exportRatio}%` } as React.CSSProperties} />
            </div>
          </div>
        </div>
      </section>

      {message ? <p className="notice section">{message}</p> : null}

      <section className="section grid three">
        <Metric label="Import rete" value={formatWatts(energy.grid_import_w)} />
        <Metric label="Export rete" value={formatWatts(energy.grid_export_w)} />
        <Metric label="Qualita dato" value={energy.quality} />
      </section>

      <section className="section grid two">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>{device.display_name}</h2>
              <p className="muted">Pilota SmartThings, solo lettura/mock.</p>
            </div>
            <span className="status-pill">
              <CheckCircle2 size={16} />
              {device.status}
            </span>
          </div>
          <div className="grid three">
            <Metric label="Stato" value={device.operating_state} />
            <Metric label="Potenza" value={formatWatts(device.power_w ?? 0)} />
            <Metric label="Energia" value={`${((device.energy_wh ?? 0) / 1000).toFixed(1)} kWh`} />
          </div>
          <div className="tag-row" style={{ marginTop: 18 }}>
            {device.capabilities.map((capability) => (
              <span className="tag" key={capability.id}>
                {capability.label}
              </span>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Approval manuale</h2>
              <p className="muted">Il comando reale resta disabilitato.</p>
            </div>
            <Sparkles size={20} />
          </div>
          {recommendation ? (
            <div className="list">
              <div className="list-item">
                <strong>{recommendation.title}</strong>
                <p className="muted">{recommendation.reason}</p>
              </div>
              <button className="button" type="button" onClick={approveMock} disabled={recommendation.status === "approved"}>
                <CheckCircle2 size={17} />
                {recommendation.status === "approved" ? "Approvata" : "Approva mock"}
              </button>
            </div>
          ) : (
            <p className="muted">Nessuna raccomandazione attiva.</p>
          )}
          <button className="button secondary" type="button" onClick={seedRemoteDemo} style={{ marginTop: 10 }}>
            <Database size={17} />
            Carica demo su Supabase
          </button>
        </div>
      </section>

      <section className="section panel">
        <div className="panel-header">
          <div>
            <h2>Audit recente</h2>
            <p className="muted">Ogni decisione importante deve lasciare traccia.</p>
          </div>
          <RefreshCw size={18} />
        </div>
        <div className="list">
          {audit.map((event) => (
            <div className="audit-row list-item" key={event.id}>
              <div>
                <strong>{event.summary}</strong>
                <p className="muted">{event.event_type}</p>
              </div>
              <span className="tag">
                <Clock size={13} />
                {new Date(event.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </div>
  );
}
