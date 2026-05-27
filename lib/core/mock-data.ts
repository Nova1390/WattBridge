import { normalizeEnergySample } from "./energy";
import { canRecommendDryerRun, createDryerRecommendation } from "./rules";
import type { AuditEvent, DeviceState } from "./types";

export const mockEnergyState = normalizeEnergySample({
  timestamp: new Date().toISOString(),
  production_w: 4350,
  consumption_w: 2140,
  grid_import_w: 0,
  grid_export_w: 2210,
  quality: "mock"
});

export const mockDryer: DeviceState = {
  id: "dryer_mock",
  display_name: "Asciugatrice",
  device_type: "dryer",
  integration_id: "smartthings_mock",
  status: "online",
  operating_state: "idle",
  power_w: 12,
  energy_wh: 1820,
  updated_at: new Date().toISOString(),
  capabilities: [
    {
      id: "dryerOperatingState",
      label: "Stato ciclo",
      observable: true,
      controllable: false,
      attributes: ["machineState", "dryerJobState", "completionTime"],
      commands: []
    },
    {
      id: "powerMeter",
      label: "Potenza istantanea",
      observable: true,
      controllable: false,
      attributes: ["power"],
      commands: []
    },
    {
      id: "dryerMode",
      label: "Modalita asciugatura",
      observable: true,
      controllable: true,
      attributes: ["dryerMode"],
      commands: ["setDryerMode"]
    }
  ]
};

export const mockRecommendation = canRecommendDryerRun(mockEnergyState, mockDryer).allowed
  ? createDryerRecommendation(mockEnergyState, mockDryer)
  : null;

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "audit_mock_1",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    event_type: "recommendation_created",
    actor: "system",
    summary: "Raccomandazione mock generata con surplus disponibile."
  },
  {
    id: "audit_mock_2",
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    event_type: "approval_created",
    actor: "user",
    summary: "Richiesta approval mock pronta per validare il flusso."
  }
];
