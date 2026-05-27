import { writeSanitizedJson } from "./shared/sanitize";

const baseUrl = "https://api.enphaseenergy.com/api/v4";
const token = process.env.ENPHASE_ACCESS_TOKEN;
const systemId = process.env.ENPHASE_SYSTEM_ID;

async function getJson(path: string) {
  if (!token) {
    throw new Error("Missing ENPHASE_ACCESS_TOKEN. This read-only script does not run without an explicit token.");
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
  const results = [await getJson("/systems")];

  if (systemId) {
    results.push(await getJson(`/systems/${systemId}/summary`));
    results.push(await getJson(`/systems/${systemId}/devices`));
    results.push(await getJson(`/systems/${systemId}/latest_telemetry`));
  }

  await writeSanitizedJson("fixtures/discovery/enphase-cloud.json", {
    captured_at: new Date().toISOString(),
    note: "Read-only Enphase Cloud discovery. Secrets redacted.",
    results
  });
  console.log("Wrote fixtures/discovery/enphase-cloud.json");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
