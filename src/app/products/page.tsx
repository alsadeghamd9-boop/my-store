export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

// Retain the old URL while the search page is the single source of truth.
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  redirect(`/search${params.size ? `?${params}` : ""}`);
}
