import { AppShell } from "@/components/app-shell";
import { mockRecommendation } from "@/lib/core/mock-data";

export default function ApprovalsPage() {
  return (
    <AppShell>
      <div className="topbar">
        <div>
          <div className="eyebrow">Manual approval</div>
          <h1>Approval e audit</h1>
        </div>
        <span className="status-pill">Comandi reali disabilitati</span>
      </div>
      <section className="section grid two">
        <div className="panel">
          <h2>Richiesta corrente</h2>
          {mockRecommendation ? (
            <div className="list" style={{ marginTop: 16 }}>
              <div className="list-item">
                <strong>{mockRecommendation.title}</strong>
                <p className="muted">{mockRecommendation.reason}</p>
              </div>
              <div className="list-item">
                <span className="metric-label">Azione</span>
                <strong>{mockRecommendation.recommended_action}</strong>
              </div>
              <p className="notice">Questa pagina documenta il flusso. L'azione reale sara abilitata solo dopo safety model e conferma stato.</p>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>Nessuna richiesta attiva.</p>
          )}
        </div>
        <div className="panel">
          <h2>Stati comando previsti</h2>
          <div className="tag-row" style={{ marginTop: 16 }}>
            {["approval_required", "approved", "accepted", "confirmed", "failed", "timed_out"].map((state) => (
              <span className="tag" key={state}>{state}</span>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
