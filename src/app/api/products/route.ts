import { getCategories, listProducts } from "@/lib/queries";
import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const query = new URL(req.url).searchParams;
  const category = query.get("category");
  const found = category ? (await getCategories()).find((item) => item.slug === category) : undefined;
  if (category && !found) return ok({ items: [], total: 0, page: 1, pages: 1 });
  const page = Math.max(1, Math.min(10000, Math.floor(Number(query.get("page")) || 1)));
  return ok(await listProducts({ q: (query.get("q") ?? "").slice(0, 100), categoryId: found?.id, page, pageSize: 12 }));
}
