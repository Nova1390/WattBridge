"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, ClipboardCheck, Gauge, LogIn, LogOut, PlugZap, Zap } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/integrations", label: "Integrazioni", icon: PlugZap },
  { href: "/approvals", label: "Approval", icon: ClipboardCheck }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const client = useMemo(() => createBrowserSupabaseClient(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!client) return;

    let isMounted = true;
    const supabase = client;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setIsLoggedIn(Boolean(data.session));
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });

    void loadSession();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setIsLoggedIn(false);
    router.push("/login");
  }

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
          {isLoggedIn ? (
            <button type="button" onClick={signOut}>
              <LogOut size={18} aria-hidden="true" />
              <span>Logout</span>
            </button>
          ) : (
            <Link href="/login">
              <LogIn size={18} aria-hidden="true" />
              <span>Login</span>
            </Link>
          )}
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
