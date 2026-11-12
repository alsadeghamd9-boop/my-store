import { getCurrentUser } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getWishlistIds } from "@/lib/queries";
import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const [user, cart, wishlist] = await Promise.all([getCurrentUser(), getCart(), getWishlistIds()]);
  return ok({ user, cartCount: cart.count, wishlistCount: wishlist.size });
}
