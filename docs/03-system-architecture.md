# System Architecture

## Recommended Starting Shape

WattBridge should start as a Vercel-hosted responsive web dashboard/PWA, Supabase-backed remote control plane, and optional local edge connector/Mac agent, pending review of ADR-0001, ADR-0004, ADR-0005, and ADR-0006.

```text
 User browser / installed PWA
          |
          v
 Vercel-hosted WattBridge webapp
          |
          v
 Supabase: Auth, Postgres, Realtime, audit, approval queue
          |
          v
 WattBridge Core services and adapter registry
          |
          +----------------------+----------------------+
          |                      |                      |
          v                      v                      v
 Enphase Cloud adapter   SmartThings adapter     Edge connector
                                                 Mac/Raspberry/NAS
                                                        |
                                                        v
                                            Local APIs: Envoy, Shelly, HA, Matter
```

## Core Components

### Webapp/PWA Hosting

The first webapp deployment should run on Vercel. Vercel is treated as frontend hosting and deployment infrastructure, not as the core backend.

Responsibilities:

- Serve the dashboard/PWA.
- Provide preview deployments during development.
- Connect the client to Supabase Auth, Realtime, and API boundaries.

### WattBridge Core Services

Responsibilities:

- Keep the vendor-neutral energy and device model.
- Evaluate rules and produce recommendations.
- Own safety and command approval lifecycle.
- Coordinate adapters and edge connectors.

Depending on implementation detail, core services may run as Supabase Edge Functions, a separate service, or a local connector process for local-only capabilities. This should be decided in a later implementation ADR.

### Edge Connector / Mac Agent

Responsibilities:

- Poll or receive integration data from local-only systems and any adapters that must run near the home network.
- Normalize readings into vendor-neutral models.
- Persist local cache, safety-relevant windows, and outbound sync state.
- Execute approved local commands only when the core has authorized them.
- Record recommendations, skipped actions, commands, and command confirmation status.
- Continue safe local operation when the remote control plane is unavailable.

### Supabase Control Plane

Responsibilities:

- Authenticate dashboard access.
- Store current remote-readable state, selected history, recommendations, approvals, and audit events.
- Provide realtime dashboard updates.
- Queue manual approvals for WattBridge Core and the relevant adapter or edge connector to process.
- Avoid storing raw vendor tokens unless explicitly decided.

### Integration Adapters

Adapters isolate vendor-specific APIs from the core domain.

Each adapter should expose:

- Identity and health status.
- Supported capabilities.
- Read operations.
- Event/subscription handling where supported.
- Optional command operations.
- Mockable contract tests.

### Core Domain

The core should model generic energy concepts:

- Site.
- Energy flow.
- Meter reading.
- Device.
- Device capability.
- Rule.
- Recommendation.
- Action.
- Audit event.

It should not expose Enphase, SunPower, Samsung, or SmartThings terminology except inside adapter-specific modules.

### Dashboard/PWA

Responsibilities:

- Display live and historical energy state.
- Show integration health.
- Show recommendations and audit trail.
- Support manual approval before real control.
- Support access away from home through Supabase Auth and the selected remote architecture.
- Remain portable enough to move from Vercel to another static frontend host if needed.

### Automation Engine

Responsibilities:

- Evaluate surplus thresholds and time windows.
- Respect safety constraints.
- Rank candidate device actions by priority.
- Produce recommendations.
- Execute commands only when the configured mode allows it and an approval has been recorded.
- Confirm asynchronous command outcomes by observing later device state/events.

## Deployment Assumption

The frontend first runs on Vercel. Local edge connector deployment first targets a trusted Mac inside the home network. Later edge connector candidates include a Raspberry Pi, NAS, or small home server.

Remote access must be provided through the selected control plane, not direct public exposure of an edge connector.

## Observability

Minimum observability:

- Structured application logs.
- Integration health checks.
- Last successful sync timestamps.
- Rule evaluation traces.
- Audit log for recommendation and action decisions.
