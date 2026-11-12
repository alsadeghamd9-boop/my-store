import { ok } from "@/lib/api";
import { getCategories } from "@/lib/queries";
export const dynamic = "force-dynamic";
export async function GET() { return ok({ categories: await getCategories() }); }
