# Supabase Boundary

The browser may use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Do not expose:

- Enphase credentials.
- SmartThings refresh tokens.
- Supabase service role key.
- Any future edge connector secret.

Privileged operations belong in Supabase Edge Functions, WattBridge Core services, or a local edge connector.
