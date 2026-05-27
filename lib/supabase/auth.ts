const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";

export function createAuthCallbackUrl(origin: string, next = DEFAULT_AUTH_REDIRECT_PATH) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", normalizeInternalRedirect(next));
  return callbackUrl.toString();
}

export function normalizeInternalRedirect(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return next;
}
