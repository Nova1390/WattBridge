# Data Model

This is an initial conceptual model. Concrete schema details should be decided after ADR-0003 is reviewed.

WattBridge should not store data simply because it can. If Enphase or SmartThings can reliably provide the needed live and historical windows through supported APIs, the local model should favor cached current state, normalized aggregates needed for the UI, rule-evaluation windows, and audit records.

## Core Entities

### Site

Represents one home energy installation.

Fields:

- `id`
- `name`
- `timezone`
- `location_hint` optional, coarse only

### Integration

Represents an external system connection.

Fields:

- `id`
- `type`
- `display_name`
- `status`
- `last_success_at`
- `last_error_at`
- `capabilities`

### Energy Sample

Represents a timestamped reading in normalized units when local persistence is needed.

Fields:

- `id`
- `site_id`
- `source_integration_id`
- `timestamp`
- `production_w`
- `consumption_w`
- `grid_import_w`
- `grid_export_w`
- `battery_charge_w` optional
- `battery_discharge_w` optional
- `quality`

### Device

Represents an observable or controllable device.

Fields:

- `id`
- `integration_id`
- `external_id`
- `display_name`
- `device_type`
- `capabilities`
- `status`
- `last_seen_at`

### Device Sample

Represents timestamped device telemetry when local persistence is needed.

Fields:

- `id`
- `device_id`
- `timestamp`
- `power_w` optional
- `energy_wh` optional
- `state`
- `raw_capability_values` optional adapter-owned detail

### Device Capability Snapshot

Represents the discovered capabilities of a device at a point in time.

Fields:

- `id`
- `device_id`
- `captured_at`
- `component_id`
- `capability_id`
- `capability_version`
- `attributes`
- `commands`
- `is_observable`
- `is_controllable`
- `wattbridge_mapping`

### Approval Request

Represents a manual approval waiting for user decision.

Fields:

- `id`
- `recommendation_id`
- `device_id`
- `created_at`
- `expires_at`
- `requested_action`
- `safety_summary`
- `status`
- `approved_at` optional
- `approved_from` optional

### Rule

Represents a user-configured automation or recommendation rule.

Fields:

- `id`
- `name`
- `enabled`
- `mode`
- `surplus_threshold_w`
- `minimum_duration_seconds`
- `time_window`
- `device_priority`
- `safety_constraints`

### Recommendation

Represents a proposed action with reasoning.

Fields:

- `id`
- `rule_id`
- `device_id`
- `created_at`
- `recommended_action`
- `reason`
- `confidence`
- `status`

### Action Event

Represents a skipped, approved, rejected, or executed action.

Fields:

- `id`
- `recommendation_id`
- `device_id`
- `timestamp`
- `action`
- `result`
- `reason`
- `actor`

## Units

- Power: watts.
- Energy: watt-hours or kilowatt-hours, explicitly named.
- Time: UTC timestamps stored, site timezone used for display.

## Modeling Rules

- Store raw integration responses only if needed for debugging, redacted, and behind a retention limit.
- Prefer refreshing from source APIs over long-term local duplication when source APIs are reliable and rate limits allow it.
- Store enough local state to keep the dashboard understandable during source outages and to explain automation decisions later.
- Store SmartThings device capability snapshots because capabilities may differ by model, region, firmware, and account.
- Treat SmartThings command success as pending until a later state read/event confirms the expected outcome.
- Keep external IDs namespaced by integration.
- Treat missing device-level energy data as normal.
- Do not infer safe controllability from observability alone.
