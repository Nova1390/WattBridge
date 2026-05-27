# ADR-0006: Frontend Hosting

## Status

Accepted

## Context

WattBridge needs a webapp/PWA that is usable from home and away from home. The frontend should be easy to deploy, easy to preview during development, and independent from the backend data/control-plane choice.

Supabase is the proposed backend/control plane, not the frontend host. The project may later use a custom domain or dedicated hosting, but the first deployment should minimize operational friction.

## Options Considered

1. Vercel.
2. Cloudflare Pages.
3. Netlify.
4. Traditional domain plus dedicated hosting.
5. Hosting from the home Mac.

## Decision

Use Vercel as the initial frontend hosting provider for the WattBridge webapp/PWA.

Use the Vercel-provided URL during the early MVP. Add a custom domain later when the app shape is stable.

Do not make WattBridge architecturally dependent on Vercel-specific backend features unless a later ADR explicitly accepts that tradeoff.

## Consequences

Positive:

- Fast setup for a modern webapp.
- Good preview deployments from Git branches.
- Simple HTTPS deployment for testing from phone and desktop.
- Keeps the public webapp separate from the home network.

Negative:

- Adds another hosted service alongside Supabase.
- Vercel-specific server features could create lock-in if overused.
- Custom domain and production hardening remain later tasks.

## Boundaries

Vercel should host:

- Static frontend assets.
- PWA shell.
- Optional framework rendering if chosen.

Vercel should not hold:

- Vendor API secrets.
- SmartThings refresh tokens.
- Enphase credentials.
- Safety-critical command execution state.

Privileged operations should use Supabase Edge Functions, core services, or the edge connector depending on the final backend topology.

## Follow-Up Tasks

- Choose frontend framework.
- Configure Vercel project after repository initialization.
- Configure Supabase public client environment variables.
- Verify Row Level Security before exposing real data.
- Add custom domain later.
