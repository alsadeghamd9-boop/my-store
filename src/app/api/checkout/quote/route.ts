import { BAD_REQUEST, fail, ok, readJson } from "@/lib/api";
import { getCart } from "@/lib/cart";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  const cart = await getCart();
  return ok({ subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total });
}
