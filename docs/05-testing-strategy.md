# Testing Strategy

## Goals

- Make energy calculations trustworthy.
- Keep integration behavior stable as vendor APIs change.
- Prevent unsafe automation behavior.
- Verify dashboard workflows without requiring live devices for every test run.

## Test Types

### Unit Tests

Cover:

- Energy calculations.
- Surplus detection.
- Rule evaluation.
- Data normalization.
- Time-window handling.
- Device capability mapping.

### Contract Tests

Each adapter must satisfy a shared contract:

- Reports health.
- Lists capabilities.
- Normalizes readings.
- Handles unavailable data.
- Rejects unsupported commands.

### Mocked Integration Tests

Use captured, sanitized fixtures for:

- Enphase production/consumption/import/export responses.
- SmartThings device discovery, status, capabilities, energy readings, and command responses.
- SmartThings OAuth token refresh.
- SmartThings webhook subscription events if implemented.
- SmartThings rate-limit and cloud outage responses.

### End-To-End Tests

Cover:

- Dashboard loads with current energy state.
- Historical chart renders expected ranges.
- Device list shows status and power data where available.
- Recommendation appears when surplus criteria are met.
- Manual approval flow records the expected audit event.

### Automation Safety Tests

Cover:

- No repeated toggling inside cooldown windows.
- No command when surplus duration is too short.
- No command outside time window.
- No command for unsupported capability.
- No automatic command when mode is manual approval.
- Command remains pending until SmartThings state/events confirm outcome.
- Expired approvals do not execute.

### Regression Tests

Cover:

- Historical aggregation.
- Timezone boundaries.
- Missing samples.
- Duplicate samples.
- Integration retry behavior.

### Security Tests

Cover:

- Token storage behavior.
- Local network exposure.
- Supabase row-level access if ADR-0005 is approved.
- Static migration guardrails for RLS coverage and append-only audit policies.
- OAuth callback CSRF/state validation.
- Redaction in logs.
- Rejection of unauthenticated local API access if auth is enabled.

## Manual Real-Home Checklist

- Confirm photovoltaic readings match vendor app within acceptable tolerance.
- Confirm grid import/export direction is correct.
- Confirm SmartThings device list matches expected appliances.
- Confirm no command is sent during read-only validation.
- Confirm logs do not contain tokens or secrets.
- Confirm service restart preserves configuration and history.
