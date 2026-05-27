import type { ApprovalRequest, DeviceState, EnergyState, Recommendation, RuleConfig } from "./types";

export const defaultDryerRule: RuleConfig = {
  surplus_threshold_w: 1400,
  minimum_duration_seconds: 600,
  approval_ttl_seconds: 900,
  cooldown_seconds: 3600
};

export function canRecommendDryerRun(energy: EnergyState, device: DeviceState, rule: RuleConfig = defaultDryerRule) {
  const hasSurplus = energy.surplus_w >= rule.surplus_threshold_w;
  const isAvailable = device.status === "online" && !["running", "drying"].includes(device.operating_state.toLowerCase());
  const hasAnyCommand = device.capabilities.some((capability) => capability.controllable && capability.commands.length > 0);

  return {
    allowed: hasSurplus && isAvailable && hasAnyCommand,
    reasons: {
      hasSurplus,
      isAvailable,
      hasAnyCommand
    }
  };
}

export function createDryerRecommendation(energy: EnergyState, device: DeviceState, now = new Date()) {
  const expiresAt = new Date(now.getTime() + defaultDryerRule.approval_ttl_seconds * 1000);

  return {
    id: `rec_${now.getTime()}`,
    device_id: device.id,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    title: "Surplus disponibile",
    reason: `Surplus stimato di ${Math.round(energy.surplus_w)} W con asciugatrice disponibile.`,
    recommended_action: "prepare_dryer_run",
    surplus_w: energy.surplus_w,
    status: "proposed"
  } satisfies Recommendation;
}

export function createApprovalRequest(recommendation: Recommendation, now = new Date()) {
  return {
    id: `approval_${now.getTime()}`,
    recommendation_id: recommendation.id,
    device_id: recommendation.device_id,
    created_at: now.toISOString(),
    expires_at: recommendation.expires_at,
    requested_action: recommendation.recommended_action,
    safety_summary: "Manual approval only. Nessun comando reale viene inviato in questa foundation.",
    status: "pending"
  } satisfies ApprovalRequest;
}

export function isApprovalExpired(approval: Pick<ApprovalRequest, "expires_at">, now = new Date()) {
  return new Date(approval.expires_at).getTime() <= now.getTime();
}
