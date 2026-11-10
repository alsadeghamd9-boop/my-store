import Link from "next/link";

/** Wordmark with a small "trail to a destination" mark. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="قافلة — الصفحة الرئيسية"
      className={`inline-flex shrink-0 items-center gap-2 rounded-lg text-white ${className}`}
    >
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#f7a600" />
        <path
          d="M6 22c3.5-9.5 7.5-9.5 10-4.5s6 4.5 9.5-6"
          stroke="#0b2a2f"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="25.5" cy="10.5" r="2.4" fill="#0b2a2f" />
      </svg>
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight">قافلة</span>
    </Link>
  );
}
