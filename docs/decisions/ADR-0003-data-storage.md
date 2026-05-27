# ADR-0003: Data Storage

## Status

Proposed

## Context

WattBridge needs local storage for configuration, integration health, current cached state, recommendations, action audit logs, and any time-series samples that cannot be reliably refreshed from source APIs.

The first implementation should be simple, local, and easy to back up.

The project should avoid storing full local history if Enphase or SmartThings can reliably provide the historical windows needed for dashboarding and rule evaluation.

## Options Considered

1. SQLite local database.
2. PostgreSQL local or network database.
3. Time-series database such as InfluxDB.
4. Flat files only.

## Decision

Prefer SQLite for the first implementation, unless discovery reveals a strong reason to use a dedicated time-series database.

Use SQLite for durable local state, auditability, and fallback caches. Do not treat it as a mandatory mirror of all vendor data.

## Consequences

Positive:

- Simple local deployment.
- Easy backup and restore.
- Good fit for MVP scale.
- Supports relational audit data and time-series samples in one file.
- Works well in tests.
- Supports a cache-first approach while API history capabilities are validated.

Negative:

- Requires careful indexing and retention for long-running high-frequency samples.
- Advanced time-series downsampling may need custom jobs or later migration.
- Concurrent writes must be designed conservatively.
- If source APIs do not provide reliable history, more local persistence may be needed.

## Follow-Up Tasks

- Define retention and aggregation strategy.
- Decide sample frequency after Enphase discovery.
- Decide which values are source-refreshed, cached, aggregated, or stored durably.
- Create migration tests.
- Revisit storage after sustained real-home data collection.
