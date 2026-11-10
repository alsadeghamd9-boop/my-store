import { listCategories } from "@/db/queries";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  return ok({ categories });
}
