import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  note?: string;
  href?: string;
  linkLabel?: string;
};

export default function SectionHeader({ title, note, href, linkLabel = "عرض الكل" }: Props) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-ink-950 sm:text-2xl">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-sm font-semibold text-ink-700 hover:text-ink-950 hover:underline"
        >
          {linkLabel}
          <ChevronLeft size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
