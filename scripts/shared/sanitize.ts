const SECRET_PATTERNS = [/token/i, /secret/i, /password/i, /authorization/i, /bearer/i, /key/i];

export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SECRET_PATTERNS.some((pattern) => pattern.test(key)) ? "[REDACTED]" : sanitize(nested)
      ])
    );
  }

  return value;
}

export async function writeSanitizedJson(path: string, value: unknown) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(sanitize(value), null, 2)}\n`, "utf8");
}
