import { getCurrentUser, readSessionId } from "@/lib/auth";
import { getCart, getWishlist } from "@/db/queries";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const sessionId = await readSessionId();
  const cart = await getCart(sessionId);
  const wishlist = await getWishlist(sessionId);
  return ok({ user, cartCount: cart.count, wishlistCount: wishlist.length });
}
