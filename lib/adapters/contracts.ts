import type { DeviceState, EnergyState, IntegrationStatus } from "@/lib/core/types";

export type AdapterHealth = {
  status: IntegrationStatus;
  checked_at: string;
  message?: string;
  api_budget?: AdapterApiBudget;
  stale_after_seconds?: number;
};

export type AdapterApiBudget = {
  policy: "constrained" | "standard";
  calls_per_minute_limit?: number;
  calls_per_month_limit?: number;
  min_request_interval_ms?: number;
  dashboard_polling_allowed: boolean;
};

export type AdapterRefreshTrigger = "manual" | "scheduled" | "dashboard";

export type AdapterRefreshResult<TState> = {
  state: TState;
  refreshed_at: string;
  api_calls_used: number;
  stale_after_seconds: number;
};

export type EnergySourceAdapter = {
  id: string;
  kind: "solar" | "battery" | "grid";
  displayName: string;
  getHealth(): Promise<AdapterHealth>;
  readCurrentState(): Promise<EnergyState>;
  refreshCurrentState?(trigger: AdapterRefreshTrigger): Promise<AdapterRefreshResult<EnergyState>>;
};

export type DeviceAdapter = {
  id: string;
  displayName: string;
  getHealth(): Promise<AdapterHealth>;
  discoverDevices(): Promise<DeviceState[]>;
  readDeviceState(deviceId: string): Promise<DeviceState>;
};

export type CommandAdapter = {
  proposeSupportedCommands(deviceId: string): Promise<string[]>;
  executeCommand(deviceId: string, command: string): Promise<{ state: "accepted" | "rejected"; message: string }>;
  confirmCommandOutcome(deviceId: string, expectedState: string, timeoutMs: number): Promise<"confirmed" | "failed" | "timed_out">;
};

export type EdgeConnector = {
  id: string;
  displayName: string;
  getHealth(): Promise<AdapterHealth>;
  syncOutbound(): Promise<{ synced_at: string; events: number }>;
};
