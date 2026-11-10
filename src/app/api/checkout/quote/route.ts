import { ensureSession, readSessionId } from "@/lib/auth";
import { computeTotals, getCart } from "@/db/queries";
import { ok, readJson, toStringValue } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const existing = await readSessionId();
  const sessionId = existing ?? (await ensureSession()).id;
  const body = await readJson(req);
  const promoCode = toStringValue(body.promoCode) || null;
  const cart = await getCart(sessionId);
  const totals = computeTotals(cart.subtotal, promoCode);
  return ok({ ...cart, totals });
}

export async function GET(req: Request) {
  const promo = new URL(req.url).searchParams.get("promo");
  const existing = await readSessionId();
  const sessionId = existing ?? (await ensureSession()).id;
  const cart = await getCart(sessionId);
  return ok({ ...cart, totals: computeTotals(cart.subtotal, promo) });
}
