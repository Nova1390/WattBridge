# Future Integrations

WattBridge should support future systems through adapter contracts and normalized capabilities.

## Candidate Integration Families

- Solar inverters.
- Batteries.
- EV chargers.
- Smart plugs.
- Thermostats.
- Home Assistant.
- Matter.
- Shelly.
- Tesla.
- Utility tariffs or grid signals.

## Capability Categories

- Energy production.
- Energy consumption.
- Grid import/export.
- Battery charge/discharge and state of charge.
- Device telemetry.
- Device command.
- Climate control.
- Vehicle charging.
- Availability and health.

## Integration Acceptance Checklist

- Adapter contract implemented.
- Mocked fixtures added.
- Contract tests pass.
- Capability mapping documented.
- Security and token handling documented.
- Operational failure modes documented.
- No vendor-specific concepts added to core domain without an ADR.

## Expansion Rule

Add the second and third integrations using simple in-process adapters. Consider a plugin registry only after repeated adapter registration patterns become clear.
