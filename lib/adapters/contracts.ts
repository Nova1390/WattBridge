import type { DeviceState, EnergyState, IntegrationStatus } from "@/lib/core/types";

export type AdapterHealth = {
  status: IntegrationStatus;
  checked_at: string;
  message?: string;
};

export type EnergySourceAdapter = {
  id: string;
  kind: "solar" | "battery" | "grid";
  displayName: string;
  getHealth(): Promise<AdapterHealth>;
  readCurrentState(): Promise<EnergyState>;
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
