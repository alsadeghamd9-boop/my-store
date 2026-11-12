import { randomInt } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Put an order's quantities back on the shelf, within its locked transaction. */
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
  return `SD-${randomInt(100_000_000, 1_000_000_000)}`;
}
export { normalizePhone } from "@/lib/phone";
