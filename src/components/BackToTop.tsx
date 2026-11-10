"use client";

export default function BackToTop() {
  return (
    <button
      type="button"
      className="block w-full bg-ink-700 py-3 text-center text-sm font-bold transition hover:bg-ink-600"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      العودة إلى الأعلى ↑
    </button>
  );
}
