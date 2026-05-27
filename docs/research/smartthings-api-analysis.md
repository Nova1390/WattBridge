# SmartThings API Analysis

Verified on 2026-05-27 from official SmartThings developer documentation.

## Executive Summary

SmartThings is a good fit as a cloud integration adapter for WattBridge, especially for discovering devices, reading current device state, receiving device events, and sending supported commands.

It is not a local appliance API and should not be treated as the primary source for fast, deterministic automation. Commands are asynchronous, capabilities vary by device/model/region, and long-running integrations require OAuth rather than Personal Access Tokens.

For WattBridge, the recommended architecture is:

- WattBridge Core: owns vendor-neutral safety logic, approval lifecycle, and adapter contracts.
- Supabase/control plane: owns remote dashboard auth, current state, approval queue, audit log, and optional webhook ingress.
- Edge connector: used only when a capability requires local-network access or local execution.
- SmartThings: cloud API for device state, events, health, and commands.

## API Areas Relevant To WattBridge

### Devices API

Useful for:

- Listing devices.
- Reading device metadata.
- Reading full device status.
- Reading component or capability status.
- Executing device commands.
- Reading device health.

WattBridge should use this for initial discovery, targeted refresh, command confirmation, and fallback polling.

### Capabilities

SmartThings devices expose capabilities, and capabilities define:

- Attributes: observable state.
- Commands: controllable actions.

Not every attribute has a command. Monitoring-only capabilities are normal. WattBridge must map capabilities into its own vendor-neutral model and never infer controllability from observability.

### Subscriptions

SmartApps can subscribe to authorized device events and receive webhook `POST` events. Subscriptions can target:

- A specific device/component/capability/attribute.
- A capability across a location, if authorized.

For WattBridge, subscriptions are useful for dryer state changes, completion events, and power/energy updates if exposed.

Constraint: SmartThings must be able to reach the webhook over HTTPS. A local-only Mac process is not enough unless a tunnel or cloud relay is used.

### Commands

Commands should be treated as asynchronous.

HTTP success means SmartThings accepted the command and permission checks passed. WattBridge must confirm the physical outcome through later state reads or events.

### Rules And Scenes

Rules are SmartThings-native automatic routines. Scenes are manual routines.

WattBridge should not put its first surplus/safety logic inside SmartThings Rules because:

- WattBridge needs explicit decision tracking.
- The logic depends on Enphase surplus, which is outside SmartThings.
- The user wants manual approval first.
- Complex automation logic is easier to test in WattBridge.

Rules and Scenes may become useful later as optional integration targets.

## Authentication

Personal Access Tokens are useful for Phase 0 discovery only. Current PATs are short-lived and intended for testing/evaluation.

Long-running access should use OAuth 2.0 Authorization Code flow:

- Register OAuth-In SmartApp.
- Request least-privilege scopes.
- Store refresh token securely.
- Refresh access tokens automatically.
- Validate OAuth `state` for CSRF protection.

## Rate Limits And Guardrails

Key documented consumer limits:

- Device state read: 12 requests/minute per device.
- Device commands: 12 requests/minute per device.
- Device APIs default to 12 requests/minute unless otherwise stated.
- Maximum 10 commands to a device in one request.
- Maximum 40 subscriptions per installed app.
- Rate limits return HTTP 429.
- Guardrail violations return HTTP 422.

Architecture impact:

- Avoid broad high-frequency polling.
- Prefer event subscriptions for low-latency state changes.
- Use targeted polling for initial load and command confirmation.
- Implement backoff using rate-limit headers.

## Dryer Pilot

The real dryer must be inspected before any command support is designed.

Capabilities to look for:

- `dryerOperatingState`
- `dryerMode`
- `powerMeter`
- `energyMeter`
- `switch`
- `samsungce.*`
- `custom.*`

Discovery output should include:

- Device metadata.
- Components.
- Capabilities.
- Attributes and current values.
- Commands and argument schemas.
- Device health.
- Whether power/energy is exposed through public capabilities or only visible in SmartThings Energy UI.

## Energy Data

SmartThings public consumer APIs should be treated as current-state/event APIs, not as guaranteed historical energy APIs.

If the dryer exposes `powerMeter` or `energyMeter`, WattBridge can read current values and build local history from polling/events. If those capabilities are absent, dryer energy usage may need to be inferred from operating state, Enphase whole-home changes, or a future smart plug/circuit monitor.

## Recommended WattBridge Adapter Behavior

The SmartThings adapter should expose:

- `discoverDevices()`
- `getDeviceCapabilitySnapshot(deviceId)`
- `getDeviceState(deviceId)`
- `getDeviceHealth(deviceId)`
- `subscribeToDeviceEvents(deviceId, capabilities)`
- `proposeSupportedCommands(deviceId)`
- `executeCommand(deviceId, command)` returning pending/accepted state
- `confirmCommandOutcome(deviceId, expectedState, timeout)`

The adapter should persist:

- OAuth token metadata, securely.
- Device capability snapshots.
- Current state cache.
- Event cursor or last seen event timestamp.
- Command acceptance and confirmation audit events.

## Recommended Architecture Decision

SmartThings strengthens the case for a hybrid backend:

- Supabase is useful for auth, remote dashboard state, approval queue, audit log, and webhook ingress.
- An edge connector is still required for local Enphase access or other LAN-only integrations.
- SmartThings subscriptions need a public HTTPS endpoint, which Supabase Edge Functions could provide if accepted.

## Phase 0 Validation Checklist

- Generate a short-lived PAT only for initial discovery.
- List devices and identify the dryer device ID.
- Capture sanitized dryer device description.
- Capture sanitized dryer full status.
- Capture sanitized dryer health response.
- Capture command list/schema if available.
- Confirm whether `powerMeter` and `energyMeter` are exposed.
- Confirm whether `dryerOperatingState` and `dryerMode` are exposed.
- Confirm whether remote start/control requires enabling a setting on the appliance.
- Test OAuth app creation and token refresh separately from PAT discovery.
- Decide whether SmartThings subscriptions are necessary for MVP or can be Phase 3.5.
