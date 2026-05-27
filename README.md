# WattBridge

WattBridge is a home energy orchestration platform for collecting, normalizing, visualizing, and eventually acting on residential energy data.

The first use case is bridging:

- Solar production, consumption, import, and export readings from an Enphase SunPower photovoltaic system with an Envoy S Metered EU gateway.
- Observable and controllable Samsung appliances through SmartThings.

The long-term goal is to support additional solar inverters, batteries, EV chargers, smart plugs, thermostats, Home Assistant, Matter, Shelly, Tesla, and other local or cloud-connected systems through integration adapters.

## Current Status

This repository is moving from documentation-first initialization into the deployable foundation phase.

The initial platform, remote access, backend topology, and frontend hosting decisions have been accepted for the MVP foundation.

## Product Goals

- Provide a unified dashboard for home energy production, consumption, import/export, and device-level usage where available.
- Make the dashboard usable away from home, without directly exposing unsafe local services to the public internet.
- Detect photovoltaic surplus and recommend or trigger appliance actions based on configurable thresholds.
- Keep the core domain model independent from specific vendors.
- Prefer reliability, observability, explicit decisions, and safe automation over broad feature count.

## Initial Recommendation

Start with a Vercel-hosted responsive web app/PWA, Supabase-backed remote control plane, and optional local edge connector.

This fits the first product problem: reliable orchestration, safe manual approval, remote access, dashboarding, and local data collection only where integrations require it. Native mobile apps can come later as companion layers for notifications, quick controls, and polished mobile UX.

See [ADR-0001](docs/decisions/ADR-0001-app-platform.md).

Remote access is a product requirement, but the access mechanism is a separate security decision. See [ADR-0004](docs/decisions/ADR-0004-remote-access.md).

The current backend topology recommendation is hybrid: Supabase control plane plus optional edge connector for local-only integrations. See [ADR-0005](docs/decisions/ADR-0005-backend-topology.md).

The initial frontend hosting choice is Vercel, used only as webapp/PWA hosting. See [ADR-0006](docs/decisions/ADR-0006-frontend-hosting.md).

## Current Implementation Direction

- Frontend/PWA: Next.js, TypeScript, deployable on Vercel.
- Control plane: Supabase Auth, Postgres, Realtime, and Edge Functions where needed.
- Core model: vendor-neutral energy, device, recommendation, approval, and audit concepts.
- First device pilot: SmartThings dryer, manual approval only.
- Local/LAN access: optional edge connector, initially Mac if Enphase Envoy or future local integrations require it.
- Safety rule: no real device command before safety model, manual approval flow, and command confirmation are implemented and tested.

## Deployed Foundation

- Vercel production URL: https://wattbridge.vercel.app
- Current mode: mock-safe dashboard, no real device commands.
- Supabase project: `gckonxhwhrgfufkbceuc`
- Supabase URL: `https://gckonxhwhrgfufkbceuc.supabase.co`
- Supabase status: initial control-plane migration applied; Auth redirect URLs configured for local dev and Vercel.
- Operational workplan: [docs/08-operational-workplan.md](docs/08-operational-workplan.md)

## Current External Setup Notes

- Vercel production dashboard responds successfully at `/dashboard`.
- Supabase linked project query confirms the expected public tables exist remotely.
- Vercel GitHub connection is now active for `Nova1390/WattBridge`.
- Preview environment variables are configured for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- A manual Preview deployment builds successfully; direct anonymous HTTP smoke returns Vercel SSO `401` because Preview deployment protection is enabled.
- Production login and demo seeding need manual browser validation with a real user session.
- `npm audit --omit=dev` currently reports a moderate PostCSS advisory through Next.js; the suggested forced fix downgrades Next and should not be applied blindly.

## Local Development

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

Create `.env.local` from `.env.example` when the Supabase project is ready.

## Documentation Map

- [Project brief](docs/00-project-brief.md)
- [Product requirements](docs/01-product-requirements.md)
- [Roadmap](docs/02-roadmap.md)
- [System architecture](docs/03-system-architecture.md)
- [Data model](docs/04-data-model.md)
- [Testing strategy](docs/05-testing-strategy.md)
- [Security and privacy](docs/06-security-and-privacy.md)
- [Operations](docs/07-operations.md)
- [Operational workplan](docs/08-operational-workplan.md)
- [Glossary](docs/glossary.md)
- [Decisions](docs/decisions/)
- [Integrations](docs/integrations/)
- [Research](docs/research/)

## Non-Goals For The First Implementation

- Public SaaS platform.
- Dedicated traditional hosting for the first frontend deployment.
- Billing, subscriptions, or multi-tenant cloud sync.
- Multi-user permission model.
- Real device control before the safety model and manual approval flow are documented and tested.
- Automatic control in the first MVP.
- Hardcoded Enphase or Samsung assumptions in the core domain model.

## Recommended Next Step

Complete Foundation Alignment from the operational workplan: repair Vercel GitHub connection, configure Preview environment variables, validate production login/demo seeding, then move into Supabase readiness and read-only API discovery.
