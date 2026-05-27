# Security And Privacy

## Security Posture

WattBridge should be local-first and conservative. The system may have access to energy behavior, appliance state, local network devices, and API tokens.

## Data Sensitivity

Sensitive data includes:

- API tokens and refresh tokens.
- Gateway credentials.
- Local device identifiers.
- Household occupancy patterns inferred from energy use.
- Device activity history.

## Initial Requirements

- Store secrets outside source control.
- Redact tokens, credentials, and raw authorization headers from logs.
- Keep local API exposure limited to the trusted network by default.
- Support use away from home only through an explicitly chosen secure access path.
- Use least-privilege API scopes where supported.
- Avoid storing raw vendor responses unless needed for debugging, sanitized, and retention-limited.
- Require manual approval before any real device-control command.
- Do not directly port-forward the backend to the public internet.
- Use SmartThings OAuth for durable integrations; use Personal Access Tokens only for short discovery/testing.
- Treat remote approval actions as high-risk and require authenticated identity plus audit logging.
- Treat Vercel as public frontend hosting only; do not put vendor secrets in frontend environment variables.

## Local Network Risk

If the dashboard or API is reachable on the LAN, it must be treated as exposed to other local devices. Early development can start with localhost-only binding, then explicitly document when LAN access is enabled.

## Remote Access Risk

Remote access is valuable, but it changes the threat model. The first private MVP should prefer a secure tunnel, VPN, or authenticated access layer over public exposure of the local backend. Any remote approval action must be authenticated, logged, and visible in the audit trail.

If ADR-0005 is accepted, Supabase becomes the remote access layer for dashboard state and approvals, while optional edge connectors talk to local network devices only when an integration requires local access.

If ADR-0006 is accepted, Vercel hosts the webapp/PWA. Public Supabase client configuration can be exposed to the browser only when protected by Row Level Security and server-side/edge boundaries for privileged operations.

## Privacy Principles

- Collect only data needed for dashboarding and automation.
- Prefer aggregated history where fine-grained data is unnecessary.
- Make retention configurable before long-running deployment.
- Do not send household energy data to third-party services unless explicitly added and documented.

## Open Questions

- Which secrets manager or local encrypted storage should be used?
- Should the dashboard require authentication on localhost?
- Which remote access option should be used for private MVP usage away from home?
- What is the minimum retention needed for useful historical views?
- How should backups handle secret material?
