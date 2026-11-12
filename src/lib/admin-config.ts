import "server-only";
import { validPasswordLength } from "@/lib/password";

/** Credentials never leave the server, and no built-in fallback exists. */
export function getAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !validPasswordLength(password)) return null;
  return { email, password };
}
