import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EnphaseCloudReadOnlyAdapter,
  evaluateEnphaseCloudBudget,
  normalizeEnphaseTelemetryState,
  summarizeEnphaseDiscovery
} from "@/lib/adapters/enphase";
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

describe("Enphase read-only adapter", () => {
  const telemetryResponses = {
    production: {
      intervals: [
        { end_at: 1779889500, wh_del: 500 },
        { end_at: 1779890400, wh_del: 1000 }
      ]
    },
    consumption: {
      intervals: [
        { end_at: 1779889500, enwh: 600 },
        { end_at: 1779890400, enwh: 500 }
      ]
    },
    grid_import: {
      intervals: [
        [
          { end_at: 1779889500, wh_imported: 0 },
          { end_at: 1779890400, wh_imported: 50 }
        ]
      ]
    },
    grid_export: {
      intervals: [
        [
          { end_at: 1779889500, wh_exported: 100 },
          { end_at: 1779890400, wh_exported: 200 }
        ]
      ]
    }
  };

  it("normalizes recent telemetry into vendor-neutral energy state", () => {
    expect(normalizeEnphaseTelemetryState(telemetryResponses)).toMatchObject({
      timestamp: "2026-05-27T14:00:00.000Z",
      production_w: 4000,
      consumption_w: 2000,
      grid_import_w: 200,
      grid_export_w: 800,
      surplus_w: 2000,
      quality: "recent"
    });
  });

  it("refreshes only through explicit triggers and serves cached state afterward", async () => {
    const paths: string[] = [];
    const adapter = new EnphaseCloudReadOnlyAdapter({
      systemId: "system",
      apiKey: "api-key",
      accessToken: "token",
      requestDelayMs: 0,
      now: () => new Date("2026-05-27T14:05:00.000Z"),
      fetchJson: async (path) => {
        paths.push(path);
        if (path.includes("production_meter")) return telemetryResponses.production;
        if (path.includes("consumption_meter")) return telemetryResponses.consumption;
        if (path.includes("energy_import_telemetry")) return telemetryResponses.grid_import;
        if (path.includes("energy_export_telemetry")) return telemetryResponses.grid_export;
        throw new Error(`Unexpected path ${path}`);
      }
    });

    await expect(adapter.refreshCurrentState("dashboard")).rejects.toThrow("dashboard");

    const refresh = await adapter.refreshCurrentState("manual");
    expect(refresh.api_calls_used).toBe(4);
    expect(paths).toHaveLength(4);
    expect(paths.every((path) => path.includes("start_at=") && path.includes("end_at="))).toBe(true);
    await expect(adapter.readCurrentState()).resolves.toMatchObject({ production_w: 4000, quality: "recent" });
    await expect(adapter.getHealth()).resolves.toMatchObject({
      status: "healthy",
      api_budget: {
        dashboard_polling_allowed: false,
        calls_per_month_limit: 1000
      }
    });
  });

  it("marks cached state stale after the configured freshness window", async () => {
    let now = new Date("2026-05-27T14:05:00.000Z");
    const adapter = new EnphaseCloudReadOnlyAdapter({
      systemId: "system",
      apiKey: "api-key",
      accessToken: "token",
      requestDelayMs: 0,
      staleAfterSeconds: 60,
      now: () => now,
      fetchJson: async (path) => {
        if (path.includes("production_meter")) return telemetryResponses.production;
        if (path.includes("consumption_meter")) return telemetryResponses.consumption;
        if (path.includes("energy_import_telemetry")) return telemetryResponses.grid_import;
        if (path.includes("energy_export_telemetry")) return telemetryResponses.grid_export;
        throw new Error(`Unexpected path ${path}`);
      }
    });

    await adapter.refreshCurrentState("scheduled");
    now = new Date("2026-05-27T14:07:00.000Z");

    await expect(adapter.getHealth()).resolves.toMatchObject({ status: "degraded" });
    await expect(adapter.readCurrentState()).resolves.toMatchObject({ quality: "stale" });
  });
});
