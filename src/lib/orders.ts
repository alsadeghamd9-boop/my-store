import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Put an order's quantities back on the shelf (used when it is cancelled). */
export async function restoreStock(tx: Tx, orderId: number) {
  await tx.execute(sql`
    update products p
    set stock = p.stock + oi.quantity,
        sold_count = greatest(p.sold_count - oi.quantity, 0)
    from order_items oi
    where oi.order_id = ${orderId} and oi.product_id = p.id
  `);
}

export function newOrderNumber() {
  return `QF-${randomInt(100_000_000, 1_000_000_000)}`;
}

/** Accepts 05XXXXXXXX, 5XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX → "05XXXXXXXX". */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-()]/g, "");
  // Accept Arabic-Indic digits too.
  digits = digits.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if (digits.startsWith("+966")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("00966")) digits = `0${digits.slice(5)}`;
  else if (digits.startsWith("966")) digits = `0${digits.slice(3)}`;
  else if (/^5\d{8}$/.test(digits)) digits = `0${digits}`;
  return /^05\d{8}$/.test(digits) ? digits : null;
}
