"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-12">
      <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center">
        <h1 className="text-2xl font-bold text-ink-950">تعذّر تحميل هذه الصفحة</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          حدث خطأ من جهتنا، وبياناتك وسلتك بأمان. أعد المحاولة، وإذا استمرت المشكلة عد بعد قليل.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            إعادة المحاولة
          </button>
          <Link href="/" className="btn btn-outline">
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
