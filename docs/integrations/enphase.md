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

Authentication requirements:

- Monitoring APIs use OAuth 2.0 authorization-code flow for developer applications.
- Each API call must include both `Authorization: Bearer <access_token>` and the application API key.
- The official quickstart shows the API key passed as the `key` request parameter; the documentation page also describes it as a key named `key`.
- Access tokens are documented as valid for 1 day and refresh tokens for 1 month on Watt, Kilowatt, and Megawatt plans.
- WattBridge discovery scripts require `ENPHASE_ACCESS_TOKEN` and `ENPHASE_API_KEY` locally; these values must never be committed, added to Vercel client env, or stored in Brain.

Current discovery status:

- Cloud script is prepared for read-only calls but has not been run against a real account in this repo session.
- Enphase developer application exists for WattBridge and is Live on the Watt plan.
- Current application access controls include System Details, Site Level Production Monitoring, Site Level Consumption Monitoring, and EV Charger Monitoring.
- Local environment still needs the application credentials and an OAuth authorization code in `.env.local` before token exchange can run.
- First real cloud run should start with `/systems`, then use the returned or configured `system_id` for summary, devices, latest telemetry, and import/export capability checks.

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
- It may not be enough by itself for fast surplus detection because interval telemetry is typically 15 minutes, sometimes 5 minutes, and cloud live status has plan/cost/support constraints.
- The safest initial architecture is hybrid: use Cloud API for account-authorized historical/site data, and validate local Envoy access for live surplus decisions.
- WattBridge should not store full Enphase history locally until Phase 0 proves which windows can be reliably refreshed from Enphase.
- WattBridge should avoid relying on deprecated endpoints and track Enphase API release notes during implementation.

## Adapter Responsibilities

- Read photovoltaic and meter values.
- Normalize power values into watts.
- Normalize timestamps to UTC.
- Prefer source-provided history over unnecessary local duplication when reliability and rate limits allow it.
- Mark sample quality when data is stale, partial, estimated, or unavailable.
- Avoid leaking Enphase-specific fields into the core model.

## Risks

- Local API authentication may vary by firmware or account state.
- Cloud API limits or access terms may change.
- Cloud API plans may constrain polling frequency, live status use, device-level data, or monthly usage.
- Cloud interval telemetry may be too coarse for appliance orchestration without local live readings.
- Meter direction conventions must be verified to avoid import/export inversion.
- Gateway availability may depend on local network topology.

## Phase 0 Checklist

- Capture sanitized sample responses.
- Capture sanitized historical/recent-data responses if available.
- Verify readings against the vendor app.
- Document authentication flow.
- Document local network requirements.
- Document rate limits and retry behavior.
- Validate whether Cloud API live status is available for the target system and plan.
