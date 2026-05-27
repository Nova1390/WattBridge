import type { SupabaseClient } from "@supabase/supabase-js";
import { mockAuditEvents, mockDryer, mockEnergyState, mockRecommendation } from "@/lib/core/mock-data";
import { createApprovalRequest } from "@/lib/core/rules";

export async function seedDemoState(client: SupabaseClient, userId: string) {
  const siteId = "00000000-0000-4000-8000-000000000001";
  const smartThingsIntegrationId = "00000000-0000-4000-8000-000000000101";

  await client.from("sites").upsert({
    id: siteId,
    user_id: userId,
    name: "Casa",
    timezone: "Europe/Rome"
  });

  await client.from("integrations").upsert({
    id: smartThingsIntegrationId,
    site_id: siteId,
    user_id: userId,
    type: "appliance",
    display_name: "SmartThings Mock",
    status: "healthy",
    last_success_at: new Date().toISOString(),
    capabilities: ["device_state", "capability_snapshot", "manual_approval_mock"]
  });

  await client.from("energy_current_state").upsert({
    site_id: siteId,
    user_id: userId,
    ...mockEnergyState
  });

  await client.from("devices").upsert({
    id: mockDryer.id,
    integration_id: smartThingsIntegrationId,
    site_id: siteId,
    user_id: userId,
    external_id: "mock_dryer",
    display_name: mockDryer.display_name,
    device_type: mockDryer.device_type,
    capabilities: mockDryer.capabilities,
    status: mockDryer.status,
    last_seen_at: mockDryer.updated_at
  });

  await client.from("device_current_state").upsert({
    device_id: mockDryer.id,
    site_id: siteId,
    user_id: userId,
    operating_state: mockDryer.operating_state,
    power_w: mockDryer.power_w,
    energy_wh: mockDryer.energy_wh,
    raw_state: { source: "mock" },
    updated_at: mockDryer.updated_at
  });

  if (mockRecommendation) {
    await client.from("recommendations").upsert({
      id: mockRecommendation.id,
      site_id: siteId,
      user_id: userId,
      device_id: mockDryer.id,
      created_at: mockRecommendation.created_at,
      expires_at: mockRecommendation.expires_at,
      title: mockRecommendation.title,
      reason: mockRecommendation.reason,
      recommended_action: mockRecommendation.recommended_action,
      surplus_w: mockRecommendation.surplus_w,
      status: mockRecommendation.status
    });

    const approval = createApprovalRequest(mockRecommendation);
    await client.from("approval_requests").upsert({
      id: approval.id,
      site_id: siteId,
      user_id: userId,
      recommendation_id: approval.recommendation_id,
      device_id: approval.device_id,
      created_at: approval.created_at,
      expires_at: approval.expires_at,
      requested_action: approval.requested_action,
      safety_summary: approval.safety_summary,
      status: approval.status
    });
  }

  await client.from("audit_events").insert(
    mockAuditEvents.map((event) => ({
      site_id: siteId,
      user_id: userId,
      event_type: event.event_type,
      actor: event.actor,
      summary: event.summary,
      metadata: event.metadata ?? {}
    }))
  );
}
