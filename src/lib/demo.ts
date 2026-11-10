import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEMO_ADMIN_EMAIL,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  ensureSeeded,
} from "@/lib/seed";

// Hash -> "still the seeded password?" so the check costs one scrypt per change.
const checked = new Map<string, boolean>();

/**
 * Sample accounts that still use their seeded password. The sign-in page lists
 * them for convenience; once a password is changed the account drops off.
 */
export async function getDemoAccounts() {
  await ensureSeeded();
  const candidates = [
    { label: "عميل", email: DEMO_USER_EMAIL, password: DEMO_USER_PASSWORD },
    { label: "مدير المتجر", email: DEMO_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD },
  ];
  const rows = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(
      inArray(
        users.email,
        candidates.map((c) => c.email),
      ),
    );

  const result: typeof candidates = [];
  for (const candidate of candidates) {
    const row = rows.find((r) => r.email === candidate.email);
    if (!row) continue;
    let valid = checked.get(row.passwordHash);
    if (valid === undefined) {
      valid = await verifyPassword(candidate.password, row.passwordHash);
      if (checked.size > 50) checked.clear();
      checked.set(row.passwordHash, valid);
    }
    if (valid) result.push(candidate);
  }
  return result;
}
