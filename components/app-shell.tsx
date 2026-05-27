import Link from "next/link";
import { Activity, ClipboardCheck, Gauge, LogIn, PlugZap, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/integrations", label: "Integrazioni", icon: PlugZap },
  { href: "/approvals", label: "Approval", icon: ClipboardCheck },
  { href: "/login", label: "Login", icon: LogIn }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Zap size={18} />
          </span>
          <span>WattBridge</span>
        </div>
        <nav className="nav" aria-label="Navigazione principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link href={item.href} key={item.href}>
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <Activity size={16} aria-hidden="true" />
          <p style={{ marginTop: 10 }}>
            Foundation MVP: dati mock, approval manuale e nessun comando reale verso dispositivi.
          </p>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
