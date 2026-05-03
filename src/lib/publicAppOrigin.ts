/**
 * Best-effort public origin for links in server-side code (emails, sheet webhooks).
 * Prefer NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL; fall back to request Host.
 */
export function publicAppOriginFromRequest(req: Request): string | null {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return null;
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
