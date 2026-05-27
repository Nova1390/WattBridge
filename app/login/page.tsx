"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createAuthCallbackUrl } from "@/lib/supabase/auth";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = createBrowserSupabaseClient();
    if (!client) return;

    async function redirectIfLoggedIn() {
      const supabase = client;
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
      }
    }

    void redirectIfLoggedIn();
  }, [router]);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createBrowserSupabaseClient();
    if (!client) {
      setMessage("Supabase non e configurato. Compila .env.local prima del login reale.");
      return;
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: createAuthCallbackUrl(window.location.origin, "/dashboard")
      }
    });

    setMessage(error ? error.message : "Controlla la tua email per il link di accesso.");
  }

  return (
    <AppShell>
      <div className="page-card">
        <div className="eyebrow">Accesso</div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>Entra in WattBridge</h1>
        <p className="muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
          Login via magic link Supabase. La foundation funziona anche in mock mode senza credenziali.
        </p>
        <form className="form" onSubmit={sendMagicLink} style={{ marginTop: 24 }}>
          <label>
            <span className="metric-label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@example.com"
              required
            />
          </label>
          <button className="button" type="submit" disabled={!isSupabaseConfigured()}>
            <Mail size={17} />
            Invia magic link
          </button>
        </form>
        <p className="notice" style={{ marginTop: 18 }}>
          <ShieldCheck size={15} /> Supabase configurato: {isSupabaseConfigured() ? "si" : "no"}
        </p>
        {message ? <p className="notice" style={{ marginTop: 12 }}>{message}</p> : null}
      </div>
    </AppShell>
  );
}
