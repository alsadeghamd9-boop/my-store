import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cookieOptions, sha256, type SessionUser } from "@/lib/auth";

export const newGuestOrderToken = () => randomBytes(32).toString("hex");
const nameFor = (id: number) => `souq_order_${id}`;

export async function grantGuestOrderAccess(id: number, token: string) {
  (await cookies()).set(nameFor(id), token, await cookieOptions(30));
}
export async function canAccessOrder(
  order: { id: number; userId: number | null; guestAccessHash: string | null },
  user: SessionUser | null,
) {
  if (user?.role === "admin" || (user && order.userId === user.id)) return true;
  if (order.userId !== null || !order.guestAccessHash) return false;
  const token = (await cookies()).get(nameFor(order.id))?.value;
  return Boolean(token && /^[a-f0-9]{64}$/.test(token) && sha256(token) === order.guestAccessHash);
}
