import { scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export function validPasswordLength(password: string) {
  // bcrypt only uses the first 72 bytes; reject longer values rather than silently truncating.
  return password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
}

export async function hashPassword(password: string) {
  if (!validPasswordLength(password)) throw new Error("Password must be 8 characters and at most 72 UTF-8 bytes");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, stored: string) {
  if (stored.startsWith("$2")) {
    return Buffer.byteLength(password, "utf8") <= 72 && bcrypt.compare(password, stored);
  }
  // Existing customer accounts from the old version continue to work; new
  // passwords (and the environment-seeded admin) always use bcrypt.
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const key = await new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, 64, (err, value) => (err ? reject(err) : resolve(value)));
  });
  const expected = Buffer.from(hash, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
