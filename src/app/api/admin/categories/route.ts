import { randomBytes } from "node:crypto";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { BAD_REQUEST, fail, ok, readJson } from "@/lib/api";
import { parseCategory } from "@/lib/category-input";

export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  return ok({ categories: await getDb().select().from(categories).orderBy(asc(categories.sort), asc(categories.id)) });
}
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("صلاحية المسؤول مطلوبة.", 403);
  const body = await readJson(req);
  if (!body) return fail(BAD_REQUEST);
  const parsed = parseCategory(body);
  if (parsed.error) return fail(parsed.error, 422);
  const [created] = await getDb().insert(categories).values({ ...parsed.data, slug: `section-${randomBytes(6).toString("hex")}` }).returning();
  return ok(created, { status: 201 });
}
