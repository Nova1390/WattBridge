import { describe, expect, it } from "vitest";
import { calculateSurplus, normalizeEnergySample } from "@/lib/core/energy";
import { mockDryer } from "@/lib/core/mock-data";
import { canRecommendDryerRun, createApprovalRequest, createDryerRecommendation, isApprovalExpired } from "@/lib/core/rules";

describe("energy calculations", () => {
  it("uses positive grid export as surplus", () => {
    expect(calculateSurplus({ production_w: 3000, consumption_w: 1800, grid_export_w: 900 })).toBe(1200);
  });

  it("normalizes negative values to zero", () => {
    const normalized = normalizeEnergySample({
      timestamp: "2026-05-27T10:00:00.000Z",
      production_w: -1,
      consumption_w: 2500,
      grid_import_w: -20,
      grid_export_w: 0,
      quality: "mock"
    });

    expect(normalized.production_w).toBe(0);
    expect(normalized.grid_import_w).toBe(0);
  });
});

describe("manual approval rules", () => {
  it("creates a recommendation when surplus and device state allow it", () => {
    const energy = normalizeEnergySample({
      timestamp: "2026-05-27T10:00:00.000Z",
      production_w: 4200,
      consumption_w: 1600,
      grid_import_w: 0,
      grid_export_w: 2600,
      quality: "mock"
    });

    expect(canRecommendDryerRun(energy, mockDryer).allowed).toBe(true);
  });

  it("blocks recommendation when surplus is insufficient", () => {
    const energy = normalizeEnergySample({
      timestamp: "2026-05-27T10:00:00.000Z",
      production_w: 1800,
      consumption_w: 1700,
      grid_import_w: 0,
      grid_export_w: 100,
      quality: "mock"
    });

    expect(canRecommendDryerRun(energy, mockDryer).allowed).toBe(false);
  });

  it("marks expired approvals", () => {
    const now = new Date("2026-05-27T10:00:00.000Z");
    const recommendation = createDryerRecommendation(
      normalizeEnergySample({
        timestamp: now.toISOString(),
        production_w: 4200,
        consumption_w: 1600,
        grid_import_w: 0,
        grid_export_w: 2600,
        quality: "mock"
      }),
      mockDryer,
      now
    );
    const approval = createApprovalRequest(recommendation, now);

    expect(isApprovalExpired(approval, new Date("2026-05-27T10:20:00.000Z"))).toBe(true);
  });
});
