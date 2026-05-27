import { writeSanitizedJson } from "./shared/sanitize";

const baseUrl = "https://api.enphaseenergy.com/api/v4";
const token = process.env.ENPHASE_ACCESS_TOKEN;
const apiKey = process.env.ENPHASE_API_KEY;
const systemId = process.env.ENPHASE_SYSTEM_ID;
const requestDelayMs = Number(process.env.ENPHASE_DISCOVERY_DELAY_MS ?? 6500);

const telemetryEndpoints = [
  "/telemetry/production_meter",
  "/telemetry/consumption_meter",
  "/energy_import_telemetry",
  "/energy_export_telemetry"
];

function fixturePath(path: string) {
  return path.replace(/\/systems\/[^/]+/g, "/systems/[REDACTED]");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function discoveryWindow(summary: Record<string, unknown>) {
  const fallbackEnd = Math.floor(Date.now() / 1000) - 3600;
  const summaryEnd = typeof summary.last_interval_end_at === "number" ? summary.last_interval_end_at : fallbackEnd;
  const endAt = Number(process.env.ENPHASE_DISCOVERY_END_AT ?? summaryEnd);
  const startAt = Number(process.env.ENPHASE_DISCOVERY_START_AT ?? endAt - 24 * 60 * 60);
  return { startAt, endAt };
}

function withQuery(path: string, params: Record<string, string | number>) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return `${url.pathname.replace("/api/v4", "")}?${url.searchParams.toString()}`;
}

async function getJson(path: string) {
  if (!token) {
    throw new Error("Missing ENPHASE_ACCESS_TOKEN. This read-only script does not run without an explicit token.");
  }
  if (!apiKey) {
    throw new Error("Missing ENPHASE_API_KEY. Enphase API v4 requires the application API key with every request.");
  }

  const url = new URL(`${baseUrl}${path}`);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  const body = await response.json().catch(() => ({ status: response.status, text: "Non-JSON response" }));
  return { status: response.status, path: fixturePath(path), body };
}

async function main() {
  const results = [await getJson("/systems")];

  if (systemId) {
    await sleep(requestDelayMs);
    const summary = await getJson(`/systems/${systemId}/summary`);
    results.push(summary);

    await sleep(requestDelayMs);
    results.push(await getJson(`/systems/${systemId}/devices`));

    await sleep(requestDelayMs);
    results.push(await getJson(`/systems/${systemId}/latest_telemetry`));

    const { startAt, endAt } = discoveryWindow(summary.body as Record<string, unknown>);
    for (const endpoint of telemetryEndpoints) {
      await sleep(requestDelayMs);
      results.push(
        await getJson(
          withQuery(`/systems/${systemId}${endpoint}`, {
            start_at: startAt,
            end_at: endAt
          })
        )
      );
    }
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
