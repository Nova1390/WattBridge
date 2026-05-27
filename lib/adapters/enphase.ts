import type { AdapterApiBudget, AdapterRefreshTrigger, EnergySourceAdapter } from "@/lib/adapters/contracts";
import { normalizeEnergySample } from "@/lib/core/energy";
import type { EnergyState } from "@/lib/core/types";

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

export type EnphaseCloudAdapterConfig = {
  systemId: string;
  apiKey: string;
  accessToken: string;
  fetchJson?: (path: string) => Promise<Record<string, unknown>>;
  now?: () => Date;
  requestDelayMs?: number;
  staleAfterSeconds?: number;
};

export const enphaseWattApiBudget: AdapterApiBudget = {
  policy: "constrained",
  calls_per_minute_limit: 10,
  calls_per_month_limit: 1000,
  min_request_interval_ms: 6500,
  dashboard_polling_allowed: false
};

const baseUrl = "https://api.enphaseenergy.com/api/v4";
const defaultStaleAfterSeconds = 30 * 60;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function latestIntervalPowerW(body: Record<string, unknown>, field: string) {
  const intervals = flattenIntervals(asArray(body.intervals));
  const withValues = intervals.filter((interval) => typeof interval.end_at === "number" && numberValue(interval[field]) !== null);
  const latest = withValues.at(-1);
  const previous = withValues.at(-2);

  if (!latest) {
    return { power_w: 0, end_at: null, found: false };
  }

  const latestEndAt = latest.end_at as number;
  const previousEndAt = typeof previous?.end_at === "number" ? previous.end_at : latestEndAt - 900;
  const durationSeconds = Math.max(latestEndAt - previousEndAt, 1);
  const energyWh = numberValue(latest[field]) ?? 0;

  return {
    power_w: Math.round((energyWh * 3600) / durationSeconds),
    end_at: latestEndAt,
    found: true
  };
}

function utcFromEpochSeconds(value: number) {
  return new Date(value * 1000).toISOString();
}

function withQuery(path: string, params: Record<string, string | number>) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return `${url.pathname.replace("/api/v4", "")}?${url.searchParams.toString()}`;
}

export function normalizeEnphaseTelemetryState(responses: Record<EnphaseTelemetryKind, Record<string, unknown>>): EnergyState {
  const production = latestIntervalPowerW(responses.production, telemetryPaths.production.field);
  const consumption = latestIntervalPowerW(responses.consumption, telemetryPaths.consumption.field);
  const gridImport = latestIntervalPowerW(responses.grid_import, telemetryPaths.grid_import.field);
  const gridExport = latestIntervalPowerW(responses.grid_export, telemetryPaths.grid_export.field);
  const timestamps = [production.end_at, consumption.end_at, gridImport.end_at, gridExport.end_at].filter((value) => typeof value === "number");
  const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Math.floor(Date.now() / 1000);
  const complete = production.found && consumption.found && gridImport.found && gridExport.found;

  return normalizeEnergySample({
    timestamp: utcFromEpochSeconds(latestTimestamp),
    production_w: production.power_w,
    consumption_w: consumption.power_w,
    grid_import_w: gridImport.power_w,
    grid_export_w: gridExport.power_w,
    quality: complete ? "recent" : "partial"
  });
}

export class EnphaseCloudReadOnlyAdapter implements EnergySourceAdapter {
  readonly id = "enphase_cloud";
  readonly kind = "solar" as const;
  readonly displayName = "Enphase Cloud";

  private currentState: EnergyState | null = null;
  private refreshedAt: Date | null = null;

  constructor(private readonly config: EnphaseCloudAdapterConfig) {}

  async getHealth() {
    const now = this.config.now?.() ?? new Date();
    const staleAfterSeconds = this.config.staleAfterSeconds ?? defaultStaleAfterSeconds;
    const isStale =
      !this.refreshedAt || now.getTime() - this.refreshedAt.getTime() > staleAfterSeconds * 1000 || this.currentState?.quality === "partial";

    return {
      status: isStale ? ("degraded" as const) : ("healthy" as const),
      checked_at: now.toISOString(),
      message: isStale ? "Enphase cached state is stale, missing, or partial." : "Enphase cached state is fresh.",
      api_budget: enphaseWattApiBudget,
      stale_after_seconds: staleAfterSeconds
    };
  }

  async readCurrentState() {
    if (!this.currentState) {
      throw new Error("No cached Enphase state is available. Run a manual or scheduled refresh first.");
    }

    const health = await this.getHealth();
    return health.status === "degraded" ? { ...this.currentState, quality: "stale" as const } : this.currentState;
  }

  async refreshCurrentState(trigger: AdapterRefreshTrigger) {
    if (trigger === "dashboard") {
      throw new Error("Enphase Cloud refresh is not allowed from dashboard rendering.");
    }

    const plannedCalls = 4;
    const budget = evaluateEnphaseCloudBudget(plannedCalls);
    if (!budget.allowed) {
      throw new Error(budget.message);
    }

    const endAt = Math.floor((this.config.now?.() ?? new Date()).getTime() / 1000);
    const startAt = endAt - 24 * 60 * 60;
    const responses = {} as Record<EnphaseTelemetryKind, Record<string, unknown>>;
    const kinds = Object.keys(telemetryPaths) as EnphaseTelemetryKind[];

    for (const [index, kind] of kinds.entries()) {
      if (index > 0) {
        await sleep(this.config.requestDelayMs ?? enphaseWattApiBudget.min_request_interval_ms ?? 0);
      }

      responses[kind] = await this.fetchJson(
        withQuery(`/systems/${this.config.systemId}${telemetryPaths[kind].match}`, {
          start_at: startAt,
          end_at: endAt
        })
      );
    }

    this.currentState = normalizeEnphaseTelemetryState(responses);
    this.refreshedAt = this.config.now?.() ?? new Date();

    return {
      state: this.currentState,
      refreshed_at: this.refreshedAt.toISOString(),
      api_calls_used: plannedCalls,
      stale_after_seconds: this.config.staleAfterSeconds ?? defaultStaleAfterSeconds
    };
  }

  private async fetchJson(path: string) {
    if (this.config.fetchJson) {
      return this.config.fetchJson(path);
    }

    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set("key", this.config.apiKey);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        Accept: "application/json"
      }
    });

    const body = await response.json().catch(() => ({ message: "Non-JSON response" }));
    if (!response.ok) {
      throw new Error(typeof body.message === "string" ? body.message : `Enphase request failed with HTTP ${response.status}.`);
    }

    return body as Record<string, unknown>;
  }
}
