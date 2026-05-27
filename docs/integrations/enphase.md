# Enphase Integration Notes

## Target System

Initial target: Enphase SunPower photovoltaic system with an Envoy S Metered EU gateway.

## Discovery Goals

- Identify available local API endpoints.
- Identify cloud API availability and terms.
- Determine authentication requirements.
- Confirm production, consumption, import, and export readings.
- Confirm whether recent and historical readings are available through supported APIs.
- Confirm sample frequency and timestamp behavior.
- Identify failure behavior when the gateway or internet is unavailable.

## Expected Data

- Current production power.
- Current consumption power.
- Grid import power.
- Grid export power.
- Recent and historical readings if available.
- Optional lifetime or interval energy counters.
- Gateway health.

## Verified Cloud API Capabilities

Verified on 2026-05-27 from official Enphase Developer Portal documentation.

Enphase API v4 is a cloud REST/JSON API over HTTPS. The Monitoring API can provide:

- System list, system summary, and device inventory.
- Site-level production monitoring.
- Site-level consumption monitoring.
- Battery data where available.
- Grid import and export telemetry.
- Live status for supported systems.
- Device-level production monitoring on paid plans.

Relevant documented endpoints:

- `/api/v4/systems`
- `/api/v4/systems/{system_id}/summary`
- `/api/v4/systems/{system_id}/devices`
- `/api/v4/systems/{system_id}/latest_telemetry`
- `/api/v4/systems/{system_id}/telemetry/production_meter`
- `/api/v4/systems/{system_id}/telemetry/production_micro`
- `/api/v4/systems/{system_id}/telemetry/consumption_meter`
- `/api/v4/systems/{system_id}/energy_import_telemetry`
- `/api/v4/systems/{system_id}/energy_export_telemetry`
- `/api/v4/systems/{system_id}/energy_lifetime`
- `/api/v4/systems/{system_id}/consumption_lifetime`
- `/api/v4/systems/{system_id}/energy_import_lifetime`
- `/api/v4/systems/{system_id}/energy_export_lifetime`

Telemetry limits:

- Production meter, consumption meter, battery, import, and export telemetry are documented as interval data.
- A single telemetry request is limited to a maximum 7-day range.
- Telemetry start dates must be within 2 years of the current time.
- Daily lifetime endpoints have no documented date-range restriction.
- Some systems support 5-minute interval telemetry through `interval_duration`; otherwise 15-minute intervals are the documented baseline for meter telemetry.

Plan implications:

- The free Watt plan includes system details, site-level production monitoring, site-level consumption monitoring, and EV charger monitoring with 10 calls/minute and 1,000 calls/month.
- Kilowatt and Megawatt plans increase limits and add device-level monitoring/streaming, but are paid.
- Live Status is documented as supported for IQ Gateway version 6.0.0 or newer and may have separate per-hit pricing on paid plans.

API budget policy:

- Treat the Watt plan call budget as a product constraint, not an implementation detail.
- Do not poll Enphase Cloud on dashboard refresh.
- Do not refresh all historical windows on every sync.
- Prefer current-state cache plus explicit stale/degraded indicators.
- Use source-refreshed history for user-requested chart windows and scheduled low-frequency refreshes.
- Batch endpoint reads where the API allows it; otherwise space calls to stay under the 10 calls/minute limit.
- Keep local Envoy discovery open as the likely path for fast surplus detection if cloud polling would exceed the monthly budget.

Authentication requirements:

- Monitoring APIs use OAuth 2.0 authorization-code flow for developer applications.
- Each API call must include both `Authorization: Bearer <access_token>` and the application API key.
- The official quickstart shows the API key passed as the `key` request parameter; the documentation page also describes it as a key named `key`.
- Access tokens are documented as valid for 1 day and refresh tokens for 1 month on Watt, Kilowatt, and Megawatt plans.
- WattBridge discovery scripts require `ENPHASE_ACCESS_TOKEN` and `ENPHASE_API_KEY` locally; these values must never be committed, added to Vercel client env, or stored in Brain.

Current discovery status:

- Enphase developer application exists for WattBridge and is Live on the Watt plan.
- Current application access controls include System Details, Site Level Production Monitoring, Site Level Consumption Monitoring, and EV Charger Monitoring.
- OAuth authorization-code exchange succeeded locally and `.env.local` now holds Enphase access/refresh tokens outside Git.
- Read-only cloud discovery ran successfully against the target account.
- Sanitized fixture: `fixtures/discovery/enphase-cloud.json`.
- Discovered one Enphase system. The repo fixture redacts system identifiers, names, address data, serial numbers, tokens, keys, and authorization values.
- Successful endpoint checks: `/systems`, `/systems/{system_id}/summary`, `/systems/{system_id}/devices`, and `/systems/{system_id}/latest_telemetry`.
- Device inventory shows 12 microinverters, 2 meters, 1 gateway, and 1 Q Relay.
- Latest telemetry currently exposes meter readings with `channel`, `last_report_at`, and `power` fields.
- System summary exposes `current_power`, `energy_lifetime`, `energy_today`, `last_interval_end_at`, `last_report_at`, `size_w`, and battery fields with zero battery capacity for this installation.
- Historical telemetry discovery succeeded for production meter, consumption meter, energy import, and energy export over a recent 24-hour window.
- Production and consumption telemetry returned 96 intervals for 24 hours, matching 15-minute interval data.
- Import and export telemetry returned interval arrays with `wh_imported` and `wh_exported` fields. The response shape differs from production/consumption and must be normalized separately.
- The committed fixture redacts household energy values as well as identifiers and secrets, so it preserves payload shape but not real consumption/export profiles.

Local OAuth workflow:

1. Put Enphase credentials in ignored `.env.local`, never in Git, Brain, Vercel public env, or frontend code.
2. Open the Enphase Authorization URL and approve access as the system owner.
3. Copy the temporary authorization code into `ENPHASE_AUTH_CODE` locally.
4. Run `npm run enphase:token` once to validate the code.
5. Run `ENPHASE_WRITE_ENV=true npm run enphase:token` only when ready to update `.env.local` with returned access and refresh tokens.
6. Run `npm run discover:enphase` for read-only fixture capture.

Security note: because the client secret was shared in chat during setup, rotate/regenerate it in the Enphase developer portal after discovery if the portal supports rotation.

Official references checked:

- Enphase API v4 documentation: `https://developer-v4.enphase.com/docs.html`
- Enphase API v4 quickstart: `https://developer-v4.enphase.com/docs/quickstart.html`
- Enphase developer plans: `https://developer-v4.enphase.com/developer-plans`
- Enphase API release notes: `https://developer-v4.enphase.com/docs/release_notes`

## WattBridge Implications

- Enphase Cloud API is likely enough for historical dashboard views and source-refreshed history, within range and rate limits.
- The first real discovery confirms cloud summary and latest meter telemetry are accessible on the Watt plan for this system.
- Recent 24-hour historical production, consumption, import, and export telemetry are accessible on the Watt plan for this system.
- The Watt plan monthly call limit is too low for frequent polling. MVP design must be parsimonious: cache current state, show staleness, refresh historical windows deliberately, and avoid background loops that silently consume quota.
- It may not be enough by itself for fast surplus detection because interval telemetry is typically 15 minutes, sometimes 5 minutes, and cloud live status has plan/cost/support constraints.
- The safest initial architecture is hybrid: use Cloud API for account-authorized historical/site data, and validate local Envoy access for live surplus decisions.
- WattBridge should not store full Enphase history locally for dashboard history if Enphase can refresh the needed windows within rate limits.
- WattBridge should still store current state, stale/degraded state, recommendation inputs, approval traces, audit events, and any short rolling windows required for safety decisions.
- WattBridge should avoid relying on deprecated endpoints and track Enphase API release notes during implementation.

## Adapter Responsibilities

- Read photovoltaic and meter values.
- Normalize power values into watts.
- Normalize timestamps to UTC.
- Enforce an explicit API budget before adding polling behavior.
- Prefer source-provided history over unnecessary local duplication when reliability and rate limits allow it.
- Mark sample quality when data is stale, partial, estimated, or unavailable.
- Avoid leaking Enphase-specific fields into the core model.

## Fixture-Based Adapter Tests

- `lib/adapters/enphase.ts` contains offline helpers for summarizing sanitized Enphase discovery fixtures and a read-only Enphase Cloud adapter.
- The adapter exposes `refreshCurrentState(trigger)` for `manual` and `scheduled` refreshes, rejects `dashboard` refreshes, caches the latest normalized state, and returns stale/degraded health when the cache is old or partial.
- `tests/enphase-adapter.test.ts` verifies device counts, telemetry interval shape, 15-minute cadence, import/export nested interval normalization, dashboard-trigger rejection, stale state behavior, and the Watt plan API budget policy.
- These tests intentionally use redacted fixture values; they validate payload shape and adapter assumptions without storing household energy profiles.
- The adapter is not wired to the dashboard. A scheduler, edge connector, or explicit operator action must call refresh and then persist state to Supabase.

## Risks

- Local API authentication may vary by firmware or account state.
- Cloud API limits or access terms may change.
- Cloud API plans may constrain polling frequency, live status use, device-level data, or monthly usage.
- Cloud interval telemetry may be too coarse for appliance orchestration without local live readings.
- Meter direction conventions must be verified to avoid import/export inversion.
- Gateway availability may depend on local network topology.

## Phase 0 Checklist

- Capture sanitized sample responses.
- Completed for `/systems`, `/summary`, `/devices`, and `/latest_telemetry`.
- Capture sanitized historical/recent-data responses if available.
- Completed for production meter, consumption meter, energy import, and energy export telemetry over a recent 24-hour window.
- Verify readings against the vendor app.
- Document authentication flow.
- Document local network requirements.
- Document rate limits and retry behavior.
- Validate whether Cloud API live status is available for the target system and plan.
