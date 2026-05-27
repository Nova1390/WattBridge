"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { normalizeInternalRedirect } from "@/lib/supabase/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Sto completando il login..." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Sto completando il login...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function completeLogin() {
      const client = createBrowserSupabaseClient();
      if (!client) {
        setIsError(true);
        setMessage("Supabase non e configurato per completare il login.");
        return;
      }

      const next = normalizeInternalRedirect(searchParams.get("next"));
      const code = searchParams.get("code");

      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          setIsError(true);
          setMessage(error.message);
          return;
        }

        router.replace(next);
        return;
      }

      const { data } = await client.auth.getSession();
      if (data.session) {
        router.replace(next);
        return;
      }

      setIsError(true);
      setMessage("Link di accesso non valido o scaduto. Richiedi un nuovo magic link.");
    }

    void completeLogin();
  }, [router, searchParams]);

  return <CallbackShell isError={isError} message={message} />;
}

function CallbackShell({ isError = false, message }: Readonly<{ isError?: boolean; message: string }>) {
  return (
    <AppShell>
      <div className="page-card">
        <div className="eyebrow">Accesso</div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          {isError ? "Login non completato" : "Login in corso"}
        </h1>
        <p className="notice" style={{ marginTop: 18 }}>
          {isError ? <ShieldAlert size={15} /> : <LoaderCircle size={15} />}
          {message}
        </p>
      </div>
    </AppShell>
  );
}
