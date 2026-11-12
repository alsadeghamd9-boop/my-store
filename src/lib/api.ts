import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Reject cross-origin browser mutations, including multipart uploads. */
export function isSameOrigin(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true; // Non-browser clients do not necessarily send Origin.
  try {
    const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host).split(",")[0].trim();
    const protocol = (req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "")).split(",")[0].trim();
    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

/**
 * Mutating endpoints only accept JSON bodies. Browsers cannot send
 * `application/json` cross-site without a CORS preflight (which we never
 * approve), so this doubles as CSRF protection for cookie-authenticated calls.
 */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!isSameOrigin(req)) return null;
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!type.includes("application/json")) return null;
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function int(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : NaN;
  return Number.isInteger(n) ? n : null;
}

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Small in-memory limiter — enough to slow down password guessing. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export const BAD_REQUEST = "تعذّر قراءة الطلب. حدّث الصفحة وحاول مرة أخرى.";
