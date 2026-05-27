# Operational Workplan

This document is the execution checklist for WattBridge. It turns the roadmap into small, verifiable work blocks and keeps documentation and Brain memory updates from being forgotten.

## Session Protocol

Every meaningful work session must:

1. Check repository status, current branch, latest commit, and deployment state.
2. Read the relevant roadmap, architecture, ADR, operations, and integration docs before editing.
3. Implement one verifiable capability or documentation correction at a time.
4. Run the minimum verification suite: `npm test`, `npm run typecheck`, and `npm run build`.
5. Add focused tests when core logic, RLS, adapters, safety rules, or dashboard behavior changes.
6. Update docs in the same commit when behavior, architecture, setup, risks, or decisions change.
7. Update Brain only for durable project state, decisions, risks, or next actions.
8. Never store tokens, secrets, raw transcripts, raw private fixtures, or unredacted logs in Git or Brain.
9. Commit WattBridge and Brain separately.

## Documentation Rules

- `README.md`: current state, deploy URLs, setup commands, and next implementation step.
- `docs/02-roadmap.md`: phase status, test gates, and blockers.
- `docs/03-system-architecture.md`: system boundaries and data flow.
- `docs/07-operations.md`: deployment, runbook, health checks, and external setup blockers.
- ADRs: any meaningful architecture decision with status, context, options, decision, consequences, and follow-up tasks.
- Integration docs: vendor API findings, capabilities, auth requirements, rate limits, and sanitized fixture notes.
- Research docs: unresolved risks and vendor/API uncertainty.

## Brain Rules

Update `/Users/roccodaffuso/Documents/Brain/Brain/01_Projects/WattBridge.md` when any of these changes:

- deployed state;
- accepted decision;
- integration discovery result;
- safety or security posture;
- external blocker;
- stable next action.

Before committing Brain:

- inspect `git status` in the Brain vault;
- stage only WattBridge-related notes;
- avoid raw chat logs and secrets;
- write concise, curated memory rather than transcripts.

## Work Blocks

### Block 1: Foundation Alignment

Status: complete.

Goals:

- Align operations docs with Vercel plus Supabase as the current deployed foundation.
- Verify production dashboard HTTP status.
- Verify Vercel GitHub connection and Preview environment variables.
- Keep real device commands disabled.

Exit criteria:

- Operations docs describe the real deployment.
- Vercel production dashboard returns HTTP 200.
- Pushes to `main` trigger Production deployments.
- Vercel/GitHub and Preview env status are documented.
- Brain project note reflects current blockers and next actions.

### Block 2: Supabase Readiness

Status: complete.

Goals:

- Validate production magic-link login through `/auth/callback`.
- Verify the initial migration from a clean database.
- Add or document controlled demo seed behavior.
- Test RLS for unauthenticated and authenticated access.
- Keep `audit_events` append-only for normal clients.
- Document backup, restore, and secret handling.

Exit criteria:

- Migration and RLS checks are repeatable.
- Audit write/read behavior is documented and tested.
- ADR-0003 has enough evidence to move toward `Accepted` or list blockers.

Current findings:

- Production login works and dashboard reaches `Supabase live`.
- Demo seed writes current state rows to Supabase.
- Demo recommendation, approval, and audit seed IDs must remain stable so repeated clicks do not create noisy duplicates.
- `npm run check:supabase-readiness` verifies anonymous RLS behavior and anonymous audit update/delete blocking using the public anon key.
- Remote readiness check passed: all protected anon reads returned no rows, and anon audit update/delete touched no rows.
- Remote schema check confirms RLS is enabled on all 9 public control-plane tables.
- Authenticated RLS SQL harness passes: own demo site visible, other simulated user hidden, authenticated audit insert allowed, authenticated audit update/delete blocked.
- Demo duplicates from pre-stable seed clicks have been cleaned; stable demo rows remain.
- Clean local migration reset passed with `supabase db reset --local --no-seed`.

### Block 3: Enphase Read-Only Discovery

Status: in progress.

Goals:

- Run Enphase cloud discovery with local-only credentials.
- Validate local Envoy access if available.
- Save sanitized fixtures.
- Decide which values come from vendor history and which need local caching.

Exit criteria:

- Enphase capability matrix is documented.
- Sanitized fixtures exist.
- Storage strategy is updated if discovery changes assumptions.

Current findings:

- Official Enphase API v4 docs confirm that Monitoring APIs use OAuth 2.0 and require both a bearer access token and application API key on API requests.
- Enphase developer application is Live on the Watt plan with System Details, Site Level Production Monitoring, Site Level Consumption Monitoring, and EV Charger Monitoring access.
- OAuth authorization-code exchange succeeded locally. Access and refresh tokens are stored only in ignored `.env.local`.
- Cloud discovery script validates both token and API key before sending read-only requests.
- OAuth helper script can exchange an authorization code and update ignored `.env.local` without printing returned tokens.
- Initial read-only discovery succeeded and saved sanitized fixture `fixtures/discovery/enphase-cloud.json`.
- Successful checks: `/systems`, `/summary`, `/devices`, `/latest_telemetry`, production meter telemetry, consumption meter telemetry, energy import telemetry, and energy export telemetry.
- Target account exposes one system, 12 microinverters, 2 meters, 1 gateway, and 1 Q Relay.
- Summary/current telemetry is available.
- Recent 24-hour telemetry returned 96 production intervals and 96 consumption intervals, indicating 15-minute history.
- Import/export telemetry is available but has a different interval array shape and must be normalized separately.
- The committed fixture redacts household energy values, identifiers, serial numbers, tokens, keys, and authorization values.
- The Watt plan call budget is low; Enphase Cloud must be used parsimoniously with explicit call budgets, scheduled refreshes, current-state caching, and stale/degraded UI instead of dashboard-driven polling.
- Fixture-based Enphase adapter tests now cover payload shape, 15-minute telemetry cadence, nested import/export intervals, and Watt plan API-budget policy without making network calls.
- Next real-data step: implement a read-only Enphase adapter around the tested normalization helpers, with scheduled/explicit refresh only and stale/degraded state.

### Block 4: SmartThings Read-Only Discovery

Goals:

- Use PAT only for short discovery.
- Identify the dryer pilot and capability snapshot.
- Verify observable power/energy/state attributes and exposed commands.
- Document OAuth requirement for durable operation.

Exit criteria:

- Dryer capability matrix is documented.
- No real command has been sent.
- SmartThings risks and next actions are updated.

### Block 5: Adapter Contracts And Read-Only Adapters

Goals:

- Stabilize vendor-neutral adapter contracts.
- Keep mock adapter as the reference contract.
- Implement Enphase and SmartThings read-only adapters from sanitized fixtures first.
- Add contract tests for capability mapping, normalization, unavailable data, and rate limits.

Exit criteria:

- Adapters are testable offline.
- Core domain has no Enphase/Samsung assumptions.
- No command adapter executes real actions.

### Block 6: Real Data Dashboard

Goals:

- Read current state from Supabase.
- Show integration health and stale/degraded states.
- Keep demo mode separate for development.
- Verify desktop and mobile layout.

Exit criteria:

- Production dashboard can show real current state or a clear not-configured state.
- Mock/demo data does not obscure real integration status.

### Block 7: Manual Recommendation And Approval

Goals:

- Generate recommendations from real read-only data.
- Enforce manual approval only.
- Record recommendation, approval, skip, expiry, and audit events.

Exit criteria:

- Approval lifecycle is tested and audited.
- No real device command is sent.

### Block 8: Safety And Command State Machine

Goals:

- Add surplus threshold, minimum duration, time window, cooldown, approval TTL, and compatible-device checks.
- Model command states: `accepted`, `confirmed`, `failed`, and `timed_out`.
- Test negative cases before command execution exists.

Exit criteria:

- Safety tests are green.
- Documentation explicitly permits considering a controlled SmartThings command.

### Block 9: Controlled SmartThings Command

Goals:

- Use durable auth, preferably OAuth, not long-running PAT.
- Keep command execution behind an explicit feature flag.
- Send only supported commands after approval and safety re-check.
- Confirm outcome by later state/event observation.

Exit criteria:

- First real command, if enabled, is manual, audited, and confirmed or timed out.
- Automatic mode remains out of scope.

### Block 10: Notifications, Edge Connector, And Expansion

Goals:

- Add in-app notifications before push/email.
- Introduce edge connector only if discovery proves local access is needed.
- Add adapter registry and future-integration template.

Exit criteria:

- Notification behavior is useful and not noisy.
- Edge connector decision is evidence-based.
- A future mock adapter proves the core remains vendor-neutral.
