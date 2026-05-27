import { writeSanitizedJson } from "./shared/sanitize";

const baseUrl = "https://api.smartthings.com/v1";
const token = process.env.SMARTTHINGS_TOKEN;
const dryerDeviceId = process.env.SMARTTHINGS_DRYER_DEVICE_ID;

async function getJson(path: string) {
  if (!token) {
    throw new Error("Missing SMARTTHINGS_TOKEN. Use only a short-lived PAT for Phase 0 discovery.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  const body = await response.json().catch(() => ({ status: response.status, text: "Non-JSON response" }));
  return { status: response.status, path, body };
}

async function main() {
  const results = [await getJson("/devices")];

  if (dryerDeviceId) {
    results.push(await getJson(`/devices/${dryerDeviceId}`));
    results.push(await getJson(`/devices/${dryerDeviceId}/status`));
    results.push(await getJson(`/devices/${dryerDeviceId}/health`));
  }

  await writeSanitizedJson("fixtures/discovery/smartthings.json", {
    captured_at: new Date().toISOString(),
    note: "Read-only SmartThings discovery. No commands are sent. Secrets redacted.",
    results
  });
  console.log("Wrote fixtures/discovery/smartthings.json");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
