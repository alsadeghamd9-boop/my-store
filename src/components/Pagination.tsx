import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export default function Pagination({
  page,
  pages,
  basePath,
}: {
  page: number;
  pages: number;
  basePath: (nextPage: number) => string;
}) {
  if (pages <= 1) return null;

  const window: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let index = start; index <= end; index += 1) window.push(index);

  const item =
    "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-bold transition";

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="ترقيم الصفحات">
      {page > 1 && (
        <Link
          href={basePath(page - 1)}
          className={`${item} border border-slate-300 bg-white text-ink-800 hover:bg-slate-50`}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight width={16} height={16} />
        </Link>
      )}
      {start > 1 && (
        <>
          <Link href={basePath(1)} className={`${item} border border-slate-300 bg-white hover:bg-slate-50`}>
            1
          </Link>
          {start > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}
      {window.map((value) => (
        <Link
          key={value}
          href={basePath(value)}
          className={`${item} ${
            value === page
              ? "bg-ink-900 text-white"
              : "border border-slate-300 bg-white text-ink-800 hover:bg-slate-50"
          }`}
          aria-current={value === page ? "page" : undefined}
        >
          {value}
        </Link>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-1 text-slate-400">…</span>}
          <Link href={basePath(pages)} className={`${item} border border-slate-300 bg-white hover:bg-slate-50`}>
            {pages}
          </Link>
        </>
      )}
      {page < pages && (
        <Link
          href={basePath(page + 1)}
          className={`${item} border border-slate-300 bg-white text-ink-800 hover:bg-slate-50`}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft width={16} height={16} />
        </Link>
      )}
    </nav>
  );
}
