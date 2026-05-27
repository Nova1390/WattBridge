import { readFile, writeFile } from "node:fs/promises";

const tokenUrl = "https://api.enphaseenergy.com/oauth/token";
const envPath = ".env.local";

const clientId = process.env.ENPHASE_CLIENT_ID;
const clientSecret = process.env.ENPHASE_CLIENT_SECRET;
const authCode = process.env.ENPHASE_AUTH_CODE;
const redirectUri = process.env.ENPHASE_REDIRECT_URI ?? "https://api.enphaseenergy.com/oauth/redirect_uri";
const writeEnv = process.env.ENPHASE_WRITE_ENV === "true";

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

async function updateLocalEnv(updates: Record<string, string>) {
  let content = "";
  try {
    content = await readFile(envPath, "utf8");
  } catch {
    content = "";
  }

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  }

  await writeFile(envPath, content.trimStart(), "utf8");
}

async function main() {
  const id = requireEnv("ENPHASE_CLIENT_ID", clientId);
  const secret = requireEnv("ENPHASE_CLIENT_SECRET", clientSecret);
  const code = requireEnv("ENPHASE_AUTH_CODE", authCode);

  const url = new URL(tokenUrl);
  url.searchParams.set("grant_type", "authorization_code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      Accept: "application/json"
    }
  });

  const body = await response.json().catch(() => ({ message: "Non-JSON response" }));

  if (!response.ok) {
    const message = typeof body?.message === "string" ? body.message : `HTTP ${response.status}`;
    throw new Error(`Enphase token exchange failed: ${message}`);
  }

  if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string") {
    throw new Error("Enphase token exchange response did not include both access_token and refresh_token.");
  }

  if (writeEnv) {
    await updateLocalEnv({
      ENPHASE_ACCESS_TOKEN: body.access_token,
      ENPHASE_REFRESH_TOKEN: body.refresh_token
    });
    console.log("Updated .env.local with Enphase access and refresh tokens.");
    return;
  }

  console.log("Enphase token exchange succeeded. Re-run with ENPHASE_WRITE_ENV=true to update .env.local.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
