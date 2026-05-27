# ADR-0005: Backend Topology

## Status

Accepted

## Context

WattBridge must read local or cloud energy data, integrate with SmartThings, support use away from home, keep manual approval explicit, and avoid exposing the local Mac service directly to the public internet.

Enphase Cloud API can help with history but local Envoy access may still be needed for responsive surplus detection. SmartThings is a cloud API, long-running access should use OAuth, and event subscriptions require a public HTTPS webhook endpoint.

## Options Considered

1. Local Mac backend only, exposed by VPN/tunnel.
2. Supabase-only backend.
3. Hybrid Supabase control plane plus optional edge connector.
4. Home Assistant-first backend.

## Decision

Recommend option 3: hybrid Supabase control plane plus optional edge connector.

Supabase owns remote dashboard authentication, current remote-readable state, manual approval queue, realtime updates, and audit records. WattBridge Core owns the vendor-neutral model, rules, safety decisions, and approval lifecycle. Edge connectors such as a Mac agent are used only for integrations that require local-network access or local execution.

## Consequences

Positive:

- Supports use away from home without direct public exposure of any home connector.
- Gives the dashboard a clean remote auth and realtime path.
- Keeps local-only integrations behind replaceable edge connectors.
- Provides a natural HTTPS ingress point for SmartThings subscriptions through Edge Functions or a small webhook relay.
- Keeps native mobile apps optional for later.

Negative:

- Adds a cloud dependency.
- Requires careful data minimization because energy/device state can reveal household behavior.
- Requires Supabase RLS, token handling, and sync conflict tests.
- Requires offline/degraded behavior when Supabase, the internet, or an edge connector is unavailable.

## Data Placement

Edge connector:

- Vendor tokens where possible.
- Local configuration.
- Local-network integration adapters.
- Local cache and command executor.

Supabase:

- User authentication.
- Current normalized state for remote dashboard.
- Recommendations.
- Manual approval requests.
- Audit log.
- Selected aggregates needed for dashboard history.

WattBridge Core:

- Vendor-neutral model.
- Rule evaluation.
- Safety decision records.
- Approval lifecycle.
- Adapter registry contracts.

Avoid storing:

- Raw vendor responses by default.
- Long high-frequency telemetry unless needed.
- Secrets in dashboard-readable tables.

## Follow-Up Tasks

- Define Supabase schema and RLS policies.
- Decide whether SmartThings webhooks enter through Supabase Edge Functions.
- Define edge-connector outbound sync protocol.
- Define offline behavior when Supabase is unavailable.
- Define command approval lifecycle from dashboard to core to adapter/edge connector to confirmation.
