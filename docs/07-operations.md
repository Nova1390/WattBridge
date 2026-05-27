# Operations

## Current Deployment Shape

The current deployable foundation runs as:

- Frontend/PWA: Vercel, production URL `https://wattbridge.vercel.app`.
- Control plane: Supabase project `gckonxhwhrgfufkbceuc`.
- Local runtime: none required for the mock-safe foundation.
- Edge connector: optional future component, initially Mac only if local Envoy/LAN access proves necessary.

The Mac is no longer the primary application host. It is a candidate edge connector host for local integrations that cannot be reached reliably through vendor cloud APIs.

## Runtime Expectations

- Service can restart without losing configuration.
- Integrations report degraded status instead of crashing the service.
- Dashboard shows stale data clearly.
- Dashboard can be reached away from home through Vercel plus Supabase Auth.
- Logs are readable during local troubleshooting.
- Vendor secrets are never stored in Vercel client-visible environment variables.
- Real device commands stay disabled until manual approval, safety rules, and command confirmation tests are in place.

## Health Checks

Minimum health signals:

- Vercel deployment status and latest production URL.
- Supabase connectivity and migration status.
- Last energy sample timestamp.
- Last SmartThings sync timestamp.
- Adapter-specific last error.
- Dashboard stale/degraded state.
- Audit event insertion health.

## Logging

Logs should include:

- Startup configuration summary without secrets.
- Integration sync start, success, and failure.
- Rule evaluation decisions.
- Recommendation lifecycle.
- Command lifecycle when commands are eventually enabled.

Logs must not include:

- Tokens.
- Passwords.
- Full authorization headers.
- Unredacted raw responses containing credentials or private identifiers.

## Backup And Recovery

Initial backup scope:

- Supabase schema migrations.
- Supabase project configuration notes.
- ADRs and documentation.
- Sanitized API fixtures.
- Edge connector configuration if one is introduced later.

Current restore posture:

- Recreate application schema from versioned files in `supabase/migrations/`.
- Reapply Supabase project auth/config from `supabase/config.toml`.
- Redeploy the frontend from GitHub/Vercel using the `main` branch.
- Recreate demo state through the authenticated dashboard seed action.

Secrets backup must be decided separately before real vendor integrations. Vendor credentials, OAuth refresh tokens, and gateway credentials must not be stored in Git, Vercel client-visible variables, or Brain.

## Supabase Readiness

Repeatable checks:

- `npm run check:supabase-readiness` verifies anonymous RLS behavior and anonymous audit update/delete blocking with the public anon key.
- `supabase db query --linked -f scripts/supabase-authenticated-rls.sql` verifies authenticated own-data visibility, cross-user hiding, authenticated audit insert, and authenticated audit update/delete blocking.
- `supabase db query --linked` can verify that RLS is enabled on all public control-plane tables.
- `supabase db query --linked -f scripts/supabase-clean-demo-state.sql` cleans pre-stable demo recommendation, approval, and audit duplicates while preserving stable demo rows.

Current findings:

- RLS is enabled on all 9 public control-plane tables.
- Anonymous reads return no protected rows.
- Anonymous attempts to update/delete `audit_events` update/delete no rows.
- Authenticated RLS harness passes for simulated users.
- Demo duplicates from pre-stable seed clicks have been cleaned.
- Clean local migration reset is blocked until Docker/Supabase local is available on this machine.

## Operational Runbook Draft

1. Check Vercel production deployment and dashboard HTTP status.
2. Check Supabase project availability and migrations.
3. Check authentication redirect behavior on local and production URLs.
4. Check integration health once real adapters are enabled.
5. Confirm last successful sample time and stale-data indicators.
6. Inspect recent errors with redaction.
7. Keep real commands disabled before troubleshooting device-control behavior.
8. If remote access fails, verify Vercel/Supabase/Auth configuration before considering any local exposure.

## External Setup Blockers

- Production login requires a real user session and must be manually validated in the browser.
- `npm audit --omit=dev` reports a moderate PostCSS advisory through the current Next.js dependency. The proposed forced fix would downgrade Next to an old breaking version, so this should be tracked and revisited through a safe Next.js update rather than force-applied.

## Vercel Git And Preview Status

- GitHub repository `Nova1390/WattBridge` is connected to the Vercel project.
- Pushes to `main` trigger Production deployments.
- Preview environment variables are configured for the public Supabase URL and anon key.
- Manual Preview deployment builds successfully.
- Direct anonymous HTTP smoke checks against Preview return Vercel SSO `401` while Preview deployment protection is enabled.

## Auth Flow

- Magic-link requests redirect to `/auth/callback?next=/dashboard`.
- The callback exchanges the Supabase `code` for a browser session and then redirects to the internal `next` path.
- The sidebar navigation shows `Login` for anonymous visitors and `Logout` for authenticated sessions.
- Production login and demo seeding have been manually validated; dashboard reaches `Supabase live`.
- Supabase Auth redirect allowlist includes local and production callback URLs.
- If login appears to stay on the login page, verify that the clicked email link points at `/auth/callback`, not directly at `/dashboard`.
