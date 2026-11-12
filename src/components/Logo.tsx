import Link from "next/link";

export default function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return <Link href="/" aria-label="سوق السودان — الصفحة الرئيسية" className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg ${light ? "text-white" : "text-ink-900"} ${className}`}>
    <span className={`grid size-10 place-items-center rounded-xl ${light ? "bg-white/10" : "bg-ink-900"}`}>
      <svg viewBox="0 0 40 40" className="size-8" fill="none" aria-hidden="true"><path d="M8 18.5 20 10l12 8.5M11.5 18.5V30h17V18.5M17 30v-7.5a3 3 0 0 1 6 0V30" stroke="#f4e7d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 14.5h22" stroke="#d8a577" strokeWidth="2" strokeLinecap="round"/></svg>
    </span>
    <span className="flex flex-col"><span className="font-display text-[19px] leading-tight font-bold tracking-tight">سوق السودان</span><span className={`mt-1 text-[9px] font-semibold tracking-[.18em] ${light ? "text-white/60" : "text-terracotta"}`} dir="ltr">SOUQ AL SUDAN</span></span>
  </Link>;
}
