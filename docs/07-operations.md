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

Secrets backup must be decided separately before real deployment.

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

- Vercel GitHub connection is not yet confirmed. A CLI attempt to connect `Nova1390/WattBridge` failed with a repository access error even though GitHub CLI can read the repository. The likely fix is to authorize or refresh the Vercel GitHub integration for the repository from the Vercel dashboard.
- Preview environment variables are not configured yet. Configure them after the Vercel GitHub connection works.
- Production login requires a real user session and must be manually validated in the browser.
- `npm audit --omit=dev` reports a moderate PostCSS advisory through the current Next.js dependency. The proposed forced fix would downgrade Next to an old breaking version, so this should be tracked and revisited through a safe Next.js update rather than force-applied.
