# Roadmap

## Phase 0: Discovery And Validation

Objectives:

- Identify available Enphase local and cloud APIs.
- Identify whether Enphase provides the needed live, recent, and historical readings so WattBridge can avoid unnecessary local duplication.
- Identify SmartThings device capabilities and command support.
- Confirm which appliances expose power/energy data and which can be remotely controlled.
- Confirm dryer capabilities as the first appliance pilot.
- Verify local network requirements and authentication constraints.
- Compare secure remote access options for use away from home.
- Validate SmartThings OAuth flow requirements versus short-lived PAT testing.
- Validate whether SmartThings device subscriptions are needed for event-driven dryer state updates.
- Confirm Vercel as the first frontend hosting target and defer custom domain purchase.

Test gates:

- Document real API endpoints, auth requirements, rate limits, and failure modes.
- Document which values must be stored locally versus refreshed from Enphase or SmartThings.
- Produce a SmartThings dryer capability matrix from the real device.
- Capture representative mocked response fixtures with secrets removed.
- Produce a manual validation checklist for the real home environment.

## Phase 1: Technical Foundation

Objectives:

- Backend service skeleton.
- Frontend/PWA skeleton deployable to Vercel.
- Integration adapter interfaces.
- Local configuration model.
- Supabase control-plane schema for user auth, current state, approvals, and audit events if ADR-0005 is approved.
- Database schema for configuration, audit events, cached current state, and any time-series samples that cannot be safely retrieved from source APIs.
- Basic logging and health checks.
- Initial runtime target: Mac.

Test gates:

- Unit tests for core energy calculations and configuration validation.
- Health check test for degraded and unavailable integrations.
- Database migration test against an empty local database.
- Vercel preview deployment smoke test for the frontend.

## Phase 2: Enphase Integration

Objectives:

- Read live production, consumption, import, and export.
- Read recent or historical production, consumption, import, and export if the supported API exposes them reliably.
- Normalize readings into the internal energy model.
- Store only the local samples or aggregates needed for reliability, rule evaluation, and unavailable-source fallback.
- Add integration tests with mocked Enphase responses.

Test gates:

- Contract tests for the Enphase adapter.
- Regression tests for sample normalization and timestamp handling.
- Offline mock test suite passes without real gateway access.

## Phase 3: SmartThings Integration

Objectives:

- Discover devices.
- Read device status and capabilities.
- Read energy/power data where available.
- Subscribe to dryer events if using a SmartApp webhook/OAuth architecture.
- Treat the dryer as the first appliance pilot.
- Prepare safe command support only for explicitly supported dryer capabilities.
- Confirm asynchronous command outcomes by reading later state/events.
- Add integration tests with mocked SmartThings API responses.

Test gates:

- Contract tests for SmartThings capability mapping.
- OAuth/token-refresh tests.
- Rate-limit and retry tests for SmartThings 429 responses.
- Safety tests confirm unsupported or unsafe commands are rejected.
- Mocked command tests verify dry-run/manual approval behavior.

## Phase 4: Dashboard MVP

Objectives:

- Live energy flow view.
- Production vs consumption chart.
- Import/export indicators.
- Device list with status, power, and recent activity.
- Basic historical views.
- Secure access path for using the dashboard away from home.
- Vercel production deployment with temporary Vercel domain first, custom domain later.

Test gates:

- End-to-end tests for main dashboard flows.
- Visual sanity checks across desktop and mobile widths.
- Regression tests for historical aggregation.
- Smoke test installed PWA from the deployed Vercel URL.

## Phase 5: Automation Engine

Objectives:

- Rule model based on surplus thresholds, duration, time windows, device priority, and safety constraints.
- Manual approval mode only for the MVP.
- Automatic mode later.
- Audit log of every recommendation and action.

Test gates:

- Unit tests for rule evaluation and surplus windows.
- Safety tests prevent repeated toggling or unexpected commands.
- Audit log tests prove every recommendation, skip, and command is traceable.

## Phase 6: Notifications And Alerts

Objectives:

- Surplus available.
- High consumption detected.
- Device started or stopped.
- Automation skipped due to safety rule or insufficient surplus.

Test gates:

- Notification preference tests.
- Duplicate suppression tests.
- Delivery fallback documented.

## Phase 7: Expansion Architecture

Objectives:

- Add adapter registry.
- Define capabilities model for future systems.
- Document how to add new integrations.

Test gates:

- Add one mock future integration using only adapter contracts.
- Capability compatibility tests.
- Integration author checklist documented.
