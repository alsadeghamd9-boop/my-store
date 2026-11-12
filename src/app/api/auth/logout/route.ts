export const dynamic = "force-dynamic";

import { BAD_REQUEST, fail, ok, readJson } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await readJson(req))) return fail(BAD_REQUEST);
  await destroySession();
  return ok({ ok: true });
}
