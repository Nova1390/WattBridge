import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

function pass(name: string, detail: string): CheckResult {
  return { name, ok: true, detail };
}

function fail(name: string, detail: string): CheckResult {
  return { name, ok: false, detail };
}

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const results: CheckResult[] = [];

  for (const table of protectedTables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      results.push(pass(`anon select ${table}`, `blocked with ${error.code ?? "error"}`));
      continue;
    }

    results.push(data && data.length > 0 ? fail(`anon select ${table}`, "returned rows") : pass(`anon select ${table}`, "returned no rows"));
  }

  const auditId = "00000000-0000-4000-8000-000000000201";
  const auditUpdate = await supabase.from("audit_events").update({ summary: "anonymous update should not apply" }).eq("id", auditId).select();
  results.push(
    auditUpdate.error || !auditUpdate.data || auditUpdate.data.length === 0
      ? pass("anon audit update", auditUpdate.error?.code ? `blocked with ${auditUpdate.error.code}` : "updated no rows")
      : fail("anon audit update", "updated rows")
  );

  const auditDelete = await supabase.from("audit_events").delete().eq("id", auditId).select();
  results.push(
    auditDelete.error || !auditDelete.data || auditDelete.data.length === 0
      ? pass("anon audit delete", auditDelete.error?.code ? `blocked with ${auditDelete.error.code}` : "deleted no rows")
      : fail("anon audit delete", "deleted rows")
  );

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
  }

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
