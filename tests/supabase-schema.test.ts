import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { demoIds } from "@/lib/supabase/demo-repository";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260527120000_initial_control_plane.sql"),
  "utf8"
);

const protectedTables = [
  "sites",
  "integrations",
  "devices",
  "device_capability_snapshots",
  "energy_current_state",
  "device_current_state",
  "recommendations",
  "approval_requests",
  "audit_events"
];

describe("Supabase migration guardrails", () => {
  it("enables row level security on every control-plane table", () => {
    for (const table of protectedTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("keeps audit events append-only for authenticated clients", () => {
    expect(migration).toContain('create policy "Authenticated users read own audit events"');
    expect(migration).toContain('create policy "Authenticated users append own audit events"');
    expect(migration).not.toMatch(/create policy .* on public\.audit_events\s+for all to authenticated/i);
    expect(migration).not.toMatch(/create policy .*audit events.*for update/i);
    expect(migration).not.toMatch(/create policy .*audit events.*for delete/i);
  });

  it("scopes user-owned records to the authenticated user", () => {
    const ownershipChecks = migration.match(/user_id = auth\.uid\(\)/g) ?? [];

    expect(ownershipChecks.length).toBeGreaterThanOrEqual(8);
  });
});

describe("Supabase demo seed guardrails", () => {
  it("uses stable ids for repeatable demo seeding", () => {
    expect(demoIds.site).toBe("00000000-0000-4000-8000-000000000001");
    expect(demoIds.recommendation).toBe("demo_recommendation_dryer_surplus");
    expect(demoIds.approval).toBe("demo_approval_dryer_surplus");
    expect(demoIds.auditRecommendationCreated).toBe("00000000-0000-4000-8000-000000000201");
    expect(demoIds.auditApprovalCreated).toBe("00000000-0000-4000-8000-000000000202");
  });
});
