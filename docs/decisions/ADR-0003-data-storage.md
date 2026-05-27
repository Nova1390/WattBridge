# ADR-0003: Data Storage

## Status

Proposed

## Context

WattBridge needs local storage for configuration, integration health, current cached state, recommendations, action audit logs, and any time-series samples that cannot be reliably refreshed from source APIs.

The first implementation should be simple, private, and easy to back up.

The project should avoid storing full local history if Enphase or SmartThings can reliably provide the historical windows needed for dashboarding and rule evaluation.

Update from Enphase discovery on 2026-05-27: the Watt plan can read current summary/latest telemetry and recent historical production, consumption, import, and export telemetry for the target system. Production and consumption returned 96 intervals over a 24-hour window, consistent with 15-minute data. Import/export telemetry is available but has a different payload shape that needs adapter-specific normalization.

The free Watt plan also has a low monthly API budget, so storage decisions must minimize cloud calls. The product should not trade away quota simply to avoid storing a small current-state cache, stale markers, or safety decision traces.

## Options Considered

1. SQLite local database.
2. PostgreSQL local or network database.
3. Time-series database such as InfluxDB.
4. Flat files only.

## Decision

Prefer Supabase Postgres for the MVP control plane and current-state/audit data, as accepted in ADR-0005. Do not introduce a dedicated time-series database yet.

Use source-refreshed Enphase history for dashboard history where rate limits and reliability are sufficient. Store only current state, integration health, recommendation inputs, approval traces, audit events, and short rolling windows needed for safety decisions or source-unavailable fallback. Do not treat local storage as a mandatory mirror of all vendor data.

Do not couple Enphase refreshes to dashboard views. Use scheduled or explicit refreshes that fit an API budget, then serve the dashboard from WattBridge/Supabase state with visible freshness metadata.

## Consequences

Positive:

- Simple MVP deployment through the existing Supabase control plane.
- Easy backup and restore.
- Good fit for MVP scale.
- Supports relational audit data and limited time-series/cache samples in the existing MVP database.
- Works well in tests.
- Supports a cache-first approach while API history capabilities are validated.

Negative:

- Requires careful indexing and retention if WattBridge later stores high-frequency samples.
- Advanced time-series downsampling may need custom jobs or later migration.
- Supabase rate/egress and Postgres growth must be monitored if local sample storage expands.
- If source APIs do not provide reliable history, more local persistence may be needed.

## Follow-Up Tasks

- Define retention and aggregation strategy.
- Validate Enphase historical reads over several days and failure conditions before marking this ADR `Accepted`.
- Decide short rolling-window duration needed for safety evaluation.
- Decide which Enphase values are source-refreshed, cached, aggregated, or stored durably.
- Create migration tests.
- Revisit storage after sustained real-home data collection.
