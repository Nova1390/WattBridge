# ADR-0002: Integration Architecture

## Status

Proposed

## Context

WattBridge starts with Enphase/SunPower photovoltaic data and SmartThings appliances, but the product goal includes future support for batteries, EV chargers, smart plugs, thermostats, Home Assistant, Matter, Shelly, Tesla, and other systems.

Hardcoding vendor concepts into the core would make future integrations harder and increase automation risk.

Enphase discovery showed that adapter contracts also need to expose operational constraints, not only data shape. The Watt plan has a low API call budget, so cloud adapters must surface budget and staleness constraints before real polling is enabled.

## Options Considered

1. Build Enphase and SmartThings directly into the core.
2. Use adapter modules behind shared contracts.
3. Build a plugin system immediately.

## Decision

Use adapter modules behind shared contracts. Do not build a full plugin system in the first implementation.

## Consequences

Positive:

- Keeps vendor-specific API details isolated.
- Makes mocked contract tests possible.
- Supports future integrations without redesigning the core.
- Avoids premature plugin infrastructure.

Negative:

- Requires careful capability modeling early.
- Some vendor-specific behavior may not map cleanly at first.
- Adapter contracts will evolve during discovery.
- Cloud adapters must expose budget and staleness constraints instead of hiding them behind read methods.

## Follow-Up Tasks

- Define the initial adapter contract during Phase 1.
- Define normalized capabilities for energy readings, device state, and safe commands.
- Add contract tests before implementing real adapters.
- Keep Enphase network reads behind scheduled or explicit refresh paths, not dashboard rendering.
- Revisit plugin loading only after at least three integrations exist.
