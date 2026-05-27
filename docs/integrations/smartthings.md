# SmartThings Integration Notes

## Target System

Initial target: Samsung appliances visible through SmartThings.

The first appliance pilot is the dryer.

## Discovery Goals

- Identify available devices.
- Inspect capabilities exposed per device.
- Confirm which devices expose current power or cumulative energy.
- Confirm which devices can be remotely controlled.
- Confirm the dryer's operating state, energy/power data, command support, and command safety.
- Identify required API scopes.
- Confirm command response behavior and delays.

## Expected Data

- Device identity and display name.
- Device type or category.
- Online/offline status.
- Current operating state.
- Current power where available.
- Cumulative energy where available.
- Supported commands.
- Dryer cycle/operating state if exposed.

## Verified API Capabilities

Verified on 2026-05-27 from official SmartThings developer documentation.

SmartThings exposes a cloud API for consumer integrations. For WattBridge, the relevant areas are:

- Devices API: list devices, read device descriptions, read full/component/capability status, and execute commands.
- Capabilities model: each device component exposes capabilities; capabilities define attributes and commands.
- Device health API: read whether a device is `ONLINE`, `UNHEALTHY`, or `OFFLINE`.
- Subscriptions API: SmartApps can receive webhook events for authorized device/capability/attribute changes.
- OAuth integrations: durable integrations should use OAuth 2.0 Authorization Code flow.
- Rules and Scenes APIs: useful for SmartThings-native automations, but not the primary place for WattBridge's surplus/safety logic.
- SmartThings status API: public status endpoints can be monitored for cloud incidents.

## Authentication

- All SmartThings API resources use OAuth 2.0 Bearer tokens with scopes.
- Personal Access Tokens are intended for testing and evaluation; current PATs are valid for 24 hours unless otherwise stated.
- Long-running WattBridge access should use OAuth, not a manually generated PAT.
- Useful scopes to validate include read devices and execute device commands, scoped as narrowly as the integration allows.

## Device And Capability Model

WattBridge should discover the real dryer instead of assuming a fixed Samsung appliance model.

For each SmartThings device:

- Read device metadata.
- Read components.
- Read exposed capabilities.
- Read capability attributes.
- Read available commands.
- Record a capability snapshot for debugging and safety review.

Important capabilities to look for:

- `dryerOperatingState` for dryer machine/job/completion state if exposed.
- `dryerMode` for selected dryer mode if exposed.
- `powerMeter` for current power if exposed.
- `energyMeter` for cumulative energy if exposed.
- `switch` only if the appliance exposes safe on/off semantics.
- Samsung custom capabilities under `samsungce.*` or `custom.*` if present on the real appliance.

## Energy And History

The public consumer API should be treated as a current-state and event API, not as a guaranteed historical energy database.

WattBridge should:

- Use `powerMeter` and `energyMeter` current values when exposed.
- Subscribe to or poll capability changes to build the local history needed for charts and audit.
- Not assume SmartThings Energy app history is available through the public API.
- Store local dryer/device samples if historical appliance usage is needed.

## Commands

SmartThings commands are asynchronous from WattBridge's point of view.

An API success response should be treated as "accepted by SmartThings", not as proof that the appliance physically changed state. WattBridge must confirm command outcome by reading later state or receiving a later event.

Before enabling any dryer command:

- Verify the exact command exists on the real dryer's exposed capability list.
- Verify required arguments and allowed values.
- Verify whether SmartThings or the appliance requires "remote start" or an appliance-side enablement state.
- Verify safety constraints and cooldowns.
- Keep MVP behavior manual-approval only.

## Rate Limits And Guardrails

Relevant documented limits:

- Device state reads: 12 requests/minute per device.
- Device commands: 12 requests/minute per device.
- Up to 10 commands to a device per request.
- Subscriptions: 40 maximum subscriptions per installed app.
- Subscription API creation and management are rate-limited.
- Rate-limit responses use HTTP 429; guardrail violations use HTTP 422.

Implications:

- Avoid polling all status frequently.
- Prefer event subscriptions for dryer state changes when feasible.
- Use targeted polling as fallback or confirmation after commands.
- Record rate-limit headers and back off on 429.

## Architecture Implications

SmartThings should be a cloud adapter behind the WattBridge integration contract.

Recommended shape:

- Supabase handles remote dashboard auth, state, approvals, and audit.
- WattBridge Core owns safety decisions and the approval lifecycle.
- SmartThings cloud adapter owns OAuth token refresh, capability mapping, and command execution against SmartThings.
- SmartThings subscriptions, if used, need a public HTTPS webhook endpoint. This likely belongs in Supabase Edge Functions or another small cloud webhook that forwards sanitized events to the Mac/Supabase state model.
- Targeted polling should remain available when webhooks are unavailable.

## Adapter Responsibilities

- Discover devices.
- Read capability state.
- Map vendor capabilities into normalized WattBridge capabilities.
- Reject unsupported or unsafe commands.
- Support dry-run/manual approval behavior before real commands.
- Treat dryer control as unavailable until capabilities, safety rules, and manual approval are validated.

## Command Safety

SmartThings command support does not automatically mean WattBridge should execute commands.

Before real commands:

- The target capability must be explicitly supported.
- The safety model must allow the action.
- Manual approval mode must be implemented.
- Audit logging must capture the decision and result.

## Risks

- Device capabilities differ by appliance model and region.
- Energy reporting may not be available for all appliances.
- SmartThings Energy app history may not be available through the public API.
- Cloud API latency may affect automation timing.
- API success for a command does not prove physical completion.
- PAT-based experiments do not represent production auth because PATs are short-lived.
- Webhook subscriptions require public HTTPS delivery.
- Polling too often can hit per-device rate limits.
- Tokens and scopes must be stored carefully.

## Phase 0 Checklist

- Capture sanitized device and capability fixtures.
- Capture a real dryer capability snapshot.
- Verify OAuth flow and token refresh.
- List controllable devices separately from observable-only devices.
- Identify the safest first dryer command candidate, if any exists.
- Confirm whether dryer power/energy is exposed as `powerMeter`/`energyMeter` or only inside SmartThings Energy UI.
- Decide whether to implement SmartThings subscriptions in Phase 3 or start with targeted polling.
- Document rate limits and retry behavior.
- Confirm no command is sent during discovery.
