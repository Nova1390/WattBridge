import { mockDryer, mockEnergyState } from "@/lib/core/mock-data";
import type { DeviceAdapter, EnergySourceAdapter } from "./contracts";

export const mockEnergyAdapter: EnergySourceAdapter = {
  id: "mock_energy",
  kind: "solar",
  displayName: "Mock Solar Adapter",
  async getHealth() {
    return { status: "healthy", checked_at: new Date().toISOString(), message: "Mock adapter operativo" };
  },
  async readCurrentState() {
    return mockEnergyState;
  }
};

export const mockSmartThingsAdapter: DeviceAdapter = {
  id: "mock_smartthings",
  displayName: "Mock SmartThings Adapter",
  async getHealth() {
    return { status: "healthy", checked_at: new Date().toISOString(), message: "Mock dryer disponibile" };
  },
  async discoverDevices() {
    return [mockDryer];
  },
  async readDeviceState() {
    return mockDryer;
  }
};
