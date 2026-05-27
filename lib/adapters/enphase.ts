import type { AdapterApiBudget } from "@/lib/adapters/contracts";

type EnphaseResult = {
  status: number;
  path: string;
  body?: Record<string, unknown>;
};

export type EnphaseDiscoveryFixture = {
  captured_at: string;
  results: EnphaseResult[];
};

export type EnphaseTelemetryKind = "production" | "consumption" | "grid_import" | "grid_export";

export type EnphaseTelemetrySummary = {
  status: number;
  interval_count: number;
  cadence_seconds: number | null;
  field: string | null;
};

export type EnphaseDiscoverySummary = {
  system_count: number;
  device_counts: {
    microinverters: number;
    meters: number;
    gateways: number;
    q_relays: number;
  };
  telemetry: Record<EnphaseTelemetryKind, EnphaseTelemetrySummary>;
  api_budget: AdapterApiBudget;
};

export const enphaseWattApiBudget: AdapterApiBudget = {
  policy: "constrained",
  calls_per_minute_limit: 10,
  calls_per_month_limit: 1000,
  min_request_interval_ms: 6500,
  dashboard_polling_allowed: false
};

const telemetryPaths: Record<EnphaseTelemetryKind, { match: string; field: string }> = {
  production: { match: "/telemetry/production_meter", field: "wh_del" },
  consumption: { match: "/telemetry/consumption_meter", field: "enwh" },
  grid_import: { match: "/energy_import_telemetry", field: "wh_imported" },
  grid_export: { match: "/energy_export_telemetry", field: "wh_exported" }
};

function findResult(fixture: EnphaseDiscoveryFixture, pathPart: string) {
  return fixture.results.find((result) => result.path.includes(pathPart));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function flattenIntervals(intervals: unknown[]) {
  return intervals.flatMap((interval) => (Array.isArray(interval) ? interval : [interval])).filter((interval) => {
    return interval && typeof interval === "object" && !Array.isArray(interval);
  }) as Record<string, unknown>[];
}

function cadenceSeconds(intervals: Record<string, unknown>[]) {
  const first = intervals[0]?.end_at;
  const second = intervals[1]?.end_at;
  if (typeof first !== "number" || typeof second !== "number") {
    return null;
  }
  return Math.abs(second - first);
}

function summarizeTelemetry(result: EnphaseResult | undefined, field: string): EnphaseTelemetrySummary {
  const intervals = flattenIntervals(asArray(result?.body?.intervals));

  return {
    status: result?.status ?? 0,
    interval_count: intervals.length,
    cadence_seconds: cadenceSeconds(intervals),
    field: intervals.some((interval) => field in interval) ? field : null
  };
}

export function summarizeEnphaseDiscovery(fixture: EnphaseDiscoveryFixture): EnphaseDiscoverySummary {
  const systems = asArray(findResult(fixture, "/systems")?.body?.systems);
  const devices = findResult(fixture, "/devices")?.body?.devices as Record<string, unknown> | undefined;

  return {
    system_count: systems.length,
    device_counts: {
      microinverters: asArray(devices?.micros).length,
      meters: asArray(devices?.meters).length,
      gateways: asArray(devices?.gateways).length,
      q_relays: asArray(devices?.q_relays).length
    },
    telemetry: {
      production: summarizeTelemetry(findResult(fixture, telemetryPaths.production.match), telemetryPaths.production.field),
      consumption: summarizeTelemetry(findResult(fixture, telemetryPaths.consumption.match), telemetryPaths.consumption.field),
      grid_import: summarizeTelemetry(findResult(fixture, telemetryPaths.grid_import.match), telemetryPaths.grid_import.field),
      grid_export: summarizeTelemetry(findResult(fixture, telemetryPaths.grid_export.match), telemetryPaths.grid_export.field)
    },
    api_budget: enphaseWattApiBudget
  };
}

export function evaluateEnphaseCloudBudget(callsPlanned: number, budget: AdapterApiBudget = enphaseWattApiBudget) {
  const perMinuteLimit = budget.calls_per_minute_limit ?? Number.POSITIVE_INFINITY;

  return {
    allowed: callsPlanned <= perMinuteLimit,
    status: callsPlanned <= perMinuteLimit ? "healthy" : "degraded",
    message:
      callsPlanned <= perMinuteLimit
        ? "Planned Enphase calls fit the per-minute API budget."
        : "Planned Enphase calls exceed the per-minute API budget."
  } as const;
}
