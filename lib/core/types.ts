export type IntegrationKind =
  | "solar"
  | "appliance"
  | "battery"
  | "ev_charger"
  | "smart_plug"
  | "climate"
  | "home_automation";

export type IntegrationStatus = "healthy" | "degraded" | "offline" | "unknown";

export type EnergySample = {
  timestamp: string;
  production_w: number;
  consumption_w: number;
  grid_import_w: number;
  grid_export_w: number;
  quality: "live" | "recent" | "mock" | "stale" | "partial";
};

export type EnergyState = EnergySample & {
  surplus_w: number;
  self_consumption_w: number;
};

export type DeviceCapability = {
  id: string;
  label: string;
  observable: boolean;
  controllable: boolean;
  attributes: string[];
  commands: string[];
};

export type DeviceState = {
  id: string;
  display_name: string;
  device_type: string;
  integration_id: string;
  status: "online" | "offline" | "unknown";
  operating_state: string;
  power_w?: number;
  energy_wh?: number;
  capabilities: DeviceCapability[];
  updated_at: string;
};

export type Recommendation = {
  id: string;
  device_id: string;
  created_at: string;
  expires_at: string;
  title: string;
  reason: string;
  recommended_action: string;
  surplus_w: number;
  status: "proposed" | "approved" | "rejected" | "expired" | "executed";
};

export type ApprovalRequest = {
  id: string;
  recommendation_id: string;
  device_id: string;
  created_at: string;
  expires_at: string;
  requested_action: string;
  safety_summary: string;
  status: "pending" | "approved" | "rejected" | "expired";
  approved_at?: string;
  approved_from?: "local" | "remote" | "mock";
};

export type AuditEvent = {
  id: string;
  created_at: string;
  event_type:
    | "recommendation_created"
    | "approval_created"
    | "approval_approved"
    | "approval_rejected"
    | "command_accepted"
    | "command_confirmed"
    | "command_failed"
    | "command_timed_out";
  actor: "system" | "user" | "adapter" | "edge_connector";
  summary: string;
  metadata?: Record<string, unknown>;
};

export type RuleConfig = {
  surplus_threshold_w: number;
  minimum_duration_seconds: number;
  approval_ttl_seconds: number;
  cooldown_seconds: number;
};

export type CommandState =
  | "not_requested"
  | "approval_required"
  | "approved"
  | "accepted"
  | "confirmed"
  | "failed"
  | "timed_out";
