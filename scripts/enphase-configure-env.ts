import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

const envPath = ".env.local";
const redirectUri = "https://api.enphaseenergy.com/oauth/redirect_uri";

type PromptOptions = {
  required?: boolean;
  secret?: boolean;
};

async function prompt(label: string, options: PromptOptions = {}) {
  const input = process.stdin;
  const output = process.stdout;

  if (!options.secret) {
    const readline = await import("node:readline/promises");
    const rl = readline.createInterface({ input, output });
    const value = (await rl.question(`${label}: `)).trim();
    rl.close();
    if (options.required && !value) {
      throw new Error(`${label} is required.`);
    }
    return value;
  }

  return new Promise<string>((resolve, reject) => {
    const rl = createInterface({ input, output, terminal: true });
    const muted = rl as typeof rl & { _writeToOutput: (text: string) => void };
    muted._writeToOutput = (text: string) => {
      if (text.endsWith(": ")) {
        output.write(text);
      }
    };

    rl.question(`${label}: `, (answer) => {
      rl.close();
      const value = answer.trim();
      if (options.required && !value) {
        reject(new Error(`${label} is required.`));
        return;
      }
      resolve(value);
    });
  });
}

async function updateLocalEnv(updates: Record<string, string>) {
  let content = "";
  try {
    content = await readFile(envPath, "utf8");
  } catch {
    content = "";
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      continue;
    }

    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    content = pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
  }

  await writeFile(envPath, content.trimStart(), "utf8");
}

async function main() {
  const apiKey = await prompt("ENPHASE_API_KEY", { required: true, secret: true });
  const clientId = await prompt("ENPHASE_CLIENT_ID", { required: true, secret: true });
  const clientSecret = await prompt("ENPHASE_CLIENT_SECRET", { required: true, secret: true });
  const authCode = await prompt("ENPHASE_AUTH_CODE", { required: true, secret: true });
  const systemId = await prompt("ENPHASE_SYSTEM_ID (optional, can be added after /systems)", { secret: true });

  await updateLocalEnv({
    ENPHASE_API_KEY: apiKey,
    ENPHASE_CLIENT_ID: clientId,
    ENPHASE_CLIENT_SECRET: clientSecret,
    ENPHASE_AUTH_CODE: authCode,
    ENPHASE_REDIRECT_URI: redirectUri,
    ENPHASE_WRITE_ENV: "true",
    ENPHASE_SYSTEM_ID: systemId
  });

  console.log(".env.local updated with Enphase local discovery settings.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
