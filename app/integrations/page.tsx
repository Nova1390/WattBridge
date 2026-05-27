import { AppShell } from "@/components/app-shell";
import { mockSmartThingsAdapter, mockEnergyAdapter } from "@/lib/adapters/mock";

const integrations = [
  {
    name: "Enphase Cloud / Local",
    status: "Discovery pending",
    scope: "Produzione, consumo, import/export",
    adapter: mockEnergyAdapter.displayName
  },
  {
    name: "SmartThings",
    status: "Mock ready",
    scope: "Asciugatrice, capability snapshot, approval manuale",
    adapter: mockSmartThingsAdapter.displayName
  },
  {
    name: "Edge connector",
    status: "Opzionale",
    scope: "Envoy locale, Shelly, Home Assistant, Matter",
    adapter: "Non avviato"
  }
];

export default function IntegrationsPage() {
  return (
    <AppShell>
      <div className="topbar">
        <div>
          <div className="eyebrow">Adapter registry</div>
          <h1>Integrazioni</h1>
        </div>
        <span className="status-pill">Vendor-neutral</span>
      </div>
      <section className="section panel">
        <div className="list">
          {integrations.map((integration) => (
            <div className="integration-row list-item" key={integration.name}>
              <div>
                <strong>{integration.name}</strong>
                <p className="muted">{integration.scope}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="tag">{integration.status}</span>
                <p className="muted" style={{ marginTop: 6 }}>{integration.adapter}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
