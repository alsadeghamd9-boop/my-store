import { ok } from "@/lib/api";
import { listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Live suggestions for the header search box. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return ok({ items: [] });
  const { items } = await listProducts({ q, pageSize: 6 });
  return ok({
    items: items.map((p) => ({
      slug: p.slug,
      title: p.title,
      image: p.images[0] ?? "",
      price: p.price,
    })),
  });
}
