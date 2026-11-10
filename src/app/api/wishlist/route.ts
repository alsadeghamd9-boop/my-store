import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { wishlistItems } from "@/db/schema";
import { ensureSession } from "@/lib/auth";
import { getWishlist } from "@/db/queries";
import { fail, ok, readJson, toNumber } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { id: sessionId } = await ensureSession();
  const items = await getWishlist(sessionId);
  return ok({ items });
}

export async function POST(req: Request) {
  await ensureBootstrap();
  const { id: sessionId } = await ensureSession();
  const body = await readJson(req);
  const productId = toNumber(body.productId);
  if (!productId) return fail("معرف المنتج مطلوب");

  await db
    .insert(wishlistItems)
    .values({ sessionId, productId })
    .onConflictDoNothing();

  const items = await getWishlist(sessionId);
  return ok({ items });
}

export async function DELETE(req: Request) {
  await ensureBootstrap();
  const { id: sessionId } = await ensureSession();
  const body = await readJson(req);
  const productId = toNumber(body.productId) ?? toNumber(new URL(req.url).searchParams.get("productId"));
  if (!productId) return fail("معرف المنتج مطلوب");

  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.sessionId, sessionId), eq(wishlistItems.productId, productId)));

  const items = await getWishlist(sessionId);
  return ok({ items });
}
