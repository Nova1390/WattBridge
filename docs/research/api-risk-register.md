# API Risk Register

## Enphase Local API Availability

Risk: Local API access may vary by firmware, account configuration, or gateway model.

Impact: Could block local-only energy collection.

Mitigation:

- Validate during Phase 0.
- Document firmware and gateway details.
- Keep cloud API fallback under consideration.

## Vendor Historical Data Availability

Risk: Enphase or SmartThings may not expose the historical windows needed for charts, rules, or auditability.

Impact: WattBridge may need to store more local samples than desired.

Mitigation:

- Validate live, recent, and historical reads during Phase 0.
- Store only the minimum local samples or aggregates needed for reliability and decision traceability.
- Make retention explicit before long-running use.

## Enphase Authentication Changes

Risk: Authentication requirements may change or require token handling tied to vendor accounts.

Impact: Integration may become brittle or harder to deploy.

Mitigation:

- Avoid hardcoding auth assumptions.
- Keep auth flow isolated in the adapter.
- Add mocked tests for auth failure behavior.

## Enphase Cloud Rate Limits And Plan Gating

Risk: The free Watt plan has limited monthly calls and does not include every API capability. Paid plans add higher limits and device-level/streaming capabilities.

Impact: Polling frequency, live status usage, and future device-level views may be constrained.

Mitigation:

- Design polling budgets before implementation.
- Prefer cached/source-refreshed historical windows over frequent polling.
- Keep local Envoy discovery as a fallback for live surplus detection.

## Enphase Cloud Telemetry Granularity

Risk: Official cloud telemetry is interval-based, with 15-minute meter telemetry as the baseline and 5-minute intervals only where supported.

Impact: Cloud-only readings may be too coarse for responsive appliance recommendations.

Mitigation:

- Use cloud telemetry for history and dashboard context.
- Validate local gateway readings for near-real-time surplus detection.
- Treat cloud live status as an optional capability until plan, gateway version, cost, and behavior are verified.

## SmartThings Capability Variability

Risk: Appliance capabilities differ by model, region, and firmware.

Impact: Device-level energy data or control may be unavailable for some devices.

Mitigation:

- Treat capabilities as discovered data.
- Separate observable devices from controllable devices.
- Avoid UI promises before capability validation.
- Validate the dryer first as the appliance pilot.

## SmartThings PAT Expiration

Risk: Personal Access Tokens are short-lived and intended for testing, not durable integrations.

Impact: A PAT-only implementation would break repeatedly and encourage unsafe manual token handling.

Mitigation:

- Use PAT only for Phase 0 discovery.
- Implement OAuth Authorization Code flow before long-running MVP usage.
- Store refresh tokens securely and test refresh behavior.

## SmartThings Cloud Dependency

Risk: SmartThings data and control may depend on cloud availability and API limits.

Impact: Automation latency or outages may occur.

Mitigation:

- Surface integration health.
- Design retry and degraded modes.
- Avoid time-critical control assumptions.
- Monitor SmartThings public status page as an operational signal.

## SmartThings Command Confirmation

Risk: SmartThings command success can indicate that a command was valid and accepted, not that the appliance physically executed it.

Impact: WattBridge could incorrectly believe the dryer started, paused, or changed state.

Mitigation:

- Treat command results as pending.
- Require follow-up state/event confirmation.
- Record command accepted, confirmed, failed, or timed out as separate audit states.

## SmartThings Energy History Availability

Risk: The public consumer API may expose current `powerMeter`/`energyMeter` values without exposing the same historical views shown in SmartThings Energy.

Impact: WattBridge may need to build its own appliance history from events or polling.

Mitigation:

- Validate real dryer capabilities and SmartThings Energy visibility separately.
- Store local appliance samples needed for charts and audit.
- Do not promise appliance history until fixtures prove availability.

## SmartThings Subscription Delivery

Risk: Device subscriptions require a SmartApp webhook reachable by SmartThings over HTTPS.

Impact: A purely local edge connector cannot receive SmartThings event webhooks directly unless exposed through a tunnel or cloud function.

Mitigation:

- Prefer Supabase Edge Function or a minimal webhook relay if ADR-0005 is accepted.
- Keep targeted polling as fallback.
- Validate subscription limits and event payloads with sanitized fixtures.

## Command Safety

Risk: A device command may start, stop, or alter an appliance unexpectedly.

Impact: User trust and physical safety risk.

Mitigation:

- Manual approval mode first.
- Explicit allowlist of safe commands.
- Cooldowns and repeated-toggle prevention.
- Audit every recommendation and command.

## Local Network Exposure

Risk: Dashboard/API exposed on LAN may be accessed by unintended local clients.

Impact: Data leakage or unauthorized control.

Mitigation:

- Start localhost-only during development.
- Document when LAN binding is enabled.
- Add authentication before broader exposure.

## Remote Access Exposure

Risk: Using WattBridge away from home may expose energy data or manual approval controls beyond the trusted LAN.

Impact: Data leakage or unauthorized device-control approval.

Mitigation:

- Do not directly port-forward the local backend.
- Choose a secure remote access mechanism by ADR.
- Require authentication and audit logging for remote approval actions.

## Data Retention And Privacy

Risk: Fine-grained energy data can reveal household routines.

Impact: Privacy risk if logs, backups, or exports are mishandled.

Mitigation:

- Define retention policy.
- Redact logs.
- Keep data local unless explicitly changed by ADR.

## Vercel GitHub Connection

Risk: Vercel may not be authorized to access the GitHub repository even when local GitHub CLI access works.

Impact: Preview deployments and Preview environment variables may not be automated from pull requests.

Mitigation:

- Authorize or refresh the Vercel GitHub integration for `Nova1390/WattBridge` from the Vercel dashboard.
- Keep production deploys available through the Vercel CLI while the GitHub connection is blocked.
- Document Preview environment variable setup after the GitHub connection is repaired.

## Dependency Advisory Handling

Risk: `npm audit --omit=dev` currently reports a moderate PostCSS advisory through Next.js and suggests a forced fix that would downgrade Next.

Impact: Applying the forced fix blindly could break the app or regress the framework version.

Mitigation:

- Do not run `npm audit fix --force` for this advisory.
- Track upstream Next.js/PostCSS updates.
- Re-run audit after dependency updates and document the result.
