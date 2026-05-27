import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateEnphaseCloudBudget, summarizeEnphaseDiscovery } from "@/lib/adapters/enphase";
import type { EnphaseDiscoveryFixture } from "@/lib/adapters/enphase";

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), "fixtures/discovery/enphase-cloud.json"), "utf8")
) as EnphaseDiscoveryFixture;

describe("Enphase discovery normalization", () => {
  it("summarizes the sanitized cloud fixture without vendor values leaking into core assumptions", () => {
    const summary = summarizeEnphaseDiscovery(fixture);

    expect(summary.system_count).toBe(1);
    expect(summary.device_counts).toEqual({
      microinverters: 12,
      meters: 2,
      gateways: 1,
      q_relays: 1
    });

    expect(summary.telemetry.production).toMatchObject({ status: 200, interval_count: 96, cadence_seconds: 900, field: "wh_del" });
    expect(summary.telemetry.consumption).toMatchObject({ status: 200, interval_count: 96, cadence_seconds: 900, field: "enwh" });
    expect(summary.telemetry.grid_import).toMatchObject({ status: 200, interval_count: 96, cadence_seconds: 900, field: "wh_imported" });
    expect(summary.telemetry.grid_export).toMatchObject({ status: 200, interval_count: 96, cadence_seconds: 900, field: "wh_exported" });
  });

  it("makes the Watt plan API budget explicit in adapter-level behavior", () => {
    const summary = summarizeEnphaseDiscovery(fixture);

    expect(summary.api_budget).toEqual({
      policy: "constrained",
      calls_per_minute_limit: 10,
      calls_per_month_limit: 1000,
      min_request_interval_ms: 6500,
      dashboard_polling_allowed: false
    });

    expect(evaluateEnphaseCloudBudget(4)).toMatchObject({ allowed: true, status: "healthy" });
    expect(evaluateEnphaseCloudBudget(11)).toMatchObject({ allowed: false, status: "degraded" });
  });
});
