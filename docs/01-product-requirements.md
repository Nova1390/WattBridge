# Product Requirements

## Goals

1. Show current home energy state: production, consumption, import, export, and device-level readings when available.
2. Make the dashboard usable both at home and away from home.
3. Detect photovoltaic surplus using transparent thresholds and time windows.
4. Recommend appliance actions before enabling automatic execution.
5. Keep integrations isolated behind adapter contracts.
6. Record every recommendation, skipped action, and executed command in an audit log.

## MVP Capabilities

### Energy Dashboard

- Live production and consumption.
- Grid import/export indicator.
- Recent historical chart.
- Device list with current state, power/energy data when available, and recent activity.

### Integrations

- Enphase adapter for live photovoltaic and metering readings.
- SmartThings adapter for device discovery, status, capabilities, energy/power readings where available, and safe command metadata.

### Automation

- Rule model based on surplus threshold, duration, time window, device priority, and safety constraints.
- Manual approval mode only for the first MVP.
- Automatic mode only after safety tests and operational confidence.
- Dryer is the first appliance pilot.

### Observability

- Structured logs.
- Health checks per integration.
- Sync status and last successful sample timestamp.
- Audit log for recommendations, skipped actions, and commands.

## Constraints

- Keep the first implementation simple.
- Do not overbuild multi-user, cloud sync, billing, or public SaaS features.
- Do not hardcode Enphase or Samsung concepts into the core domain model.
- Keep major decisions in ADR files.
- Do not implement real device control before safety and manual approval are documented.
- Do not directly expose the local backend to the public internet.
- Do not duplicate vendor history locally if Enphase or SmartThings can reliably provide the needed historical windows through supported APIs.

## Acceptance Criteria For First MVP

- User can see live energy readings from a mocked or real Enphase source.
- User can see SmartThings devices and capabilities from mocked or real SmartThings data.
- User can view normalized device and energy state without vendor-specific UI leakage.
- User can inspect the dryer as the first appliance pilot, including status and power/energy data if exposed by SmartThings.
- User can see surplus recommendations, but no real command is sent without explicit approval.
- User can reach the dashboard away from home through the chosen secure access path.
- Tests cover normalization, surplus detection, rule evaluation, mocked integrations, and dashboard flows.

## Open Questions

- Which Enphase API path is available and reliable in the target installation: local, cloud, or both?
- Do Enphase APIs provide enough recent/historical data to avoid storing full local time-series history?
- Which SmartThings appliances expose power or energy data?
- Does the SmartThings dryer expose current power, cumulative energy, operating state, and safe remote commands?
- Which SmartThings commands are safe and useful for the first appliance workflow?
- Which secure remote access path should be used for the private MVP?
