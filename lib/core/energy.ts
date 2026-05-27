import type { EnergySample, EnergyState } from "./types";

export function calculateSurplus(sample: Pick<EnergySample, "production_w" | "consumption_w" | "grid_export_w">) {
  return Math.max(sample.grid_export_w, sample.production_w - sample.consumption_w, 0);
}

export function normalizeEnergySample(sample: EnergySample): EnergyState {
  const production = Math.max(sample.production_w, 0);
  const consumption = Math.max(sample.consumption_w, 0);
  const gridImport = Math.max(sample.grid_import_w, 0);
  const gridExport = Math.max(sample.grid_export_w, 0);

  return {
    timestamp: sample.timestamp,
    production_w: production,
    consumption_w: consumption,
    grid_import_w: gridImport,
    grid_export_w: gridExport,
    quality: sample.quality,
    surplus_w: calculateSurplus({
      production_w: production,
      consumption_w: consumption,
      grid_export_w: gridExport
    }),
    self_consumption_w: Math.min(production, consumption)
  };
}

export function wattsToKilowatts(value: number) {
  return value / 1000;
}

export function formatWatts(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${wattsToKilowatts(value).toFixed(1)} kW`;
  }

  return `${Math.round(value)} W`;
}
