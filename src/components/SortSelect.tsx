"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/constants";

/** Sort dropdown for the results page; keeps the other filters in the URL. */
export default function SortSelect({
  value,
  params,
}: {
  value: string;
  params: Record<string, string>;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">ترتيب حسب</span>
      <span className="sr-only sm:hidden">ترتيب حسب</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          next.delete("page");
          if (e.target.value === "featured") next.delete("sort");
          else next.set("sort", e.target.value);
          const query = next.toString();
          router.push(query ? `/search?${query}` : "/search");
        }}
        className="rounded-full border border-line bg-white py-2 ps-3 pe-2 text-sm font-medium text-body focus:border-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
