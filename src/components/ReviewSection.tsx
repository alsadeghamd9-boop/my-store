"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { Stars } from "@/components/ui";
import { StarIcon } from "@/components/icons";
import { timeAgo } from "@/lib/format";

export interface ReviewItem {
  id: number;
  author: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: Date | string;
}

export default function ReviewSection({
  productId,
  initialReviews,
  initialRating,
  signedInName,
}: {
  productId: number;
  initialReviews: ReviewItem[];
  initialRating: number;
  signedInName: string | null;
}) {
  const { notify } = useCart();
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [busy, setBusy] = useState(false);

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length) * 10) / 10
      : initialRating;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((item) => item.rating === star).length,
  }));
  const totalVotes = Math.max(1, reviews.length);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (body.trim().length < 3) {
      notify("اكتب مراجعة من 3 أحرف على الأقل", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title,
          body,
          author: author || signedInName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error ?? "تعذّر إرسال المراجعة", "error");
      } else {
        setReviews(data.reviews ?? []);
        setTitle("");
        setBody("");
        setRating(5);
        notify("شكرًا لك! تمت إضافة مراجعتك");
      }
    } catch {
      notify("تحقق من اتصالك بالإنترنت", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="reviews" className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="card h-fit p-5">
        <h2 className="text-lg font-extrabold text-ink-900">تقييمات العملاء</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-4xl font-black text-ink-900" dir="ltr">
            {average.toFixed(1)}
          </span>
          <span>
            <Stars value={average} size={18} />
            <span className="mt-1 block text-xs text-slate-500">
              {reviews.length.toLocaleString("ar-SA-u-nu-latn")} مراجعة موثقة
            </span>
          </span>
        </div>

        <ul className="mt-4 space-y-1.5">
          {distribution.map((row) => (
            <li key={row.star} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 font-bold text-slate-600">{row.star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${(row.count / totalVotes) * 100}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-left text-slate-500" dir="ltr">
                {row.count}
              </span>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="mt-5 space-y-2 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-extrabold text-ink-900">اكتب مراجعة</h3>

          {!signedInName && (
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="اسمك"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40"
            />
          )}

          <div className="flex items-center gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} نجوم`}
                className="transition hover:scale-110"
              >
                <StarIcon
                  width={24}
                  height={24}
                  className={(hover || rating) >= star ? "text-gold-500" : "text-slate-300"}
                />
              </button>
            ))}
            <span className="ml-2 text-xs font-bold text-slate-500" dir="rtl">
              {rating} / 5
            </span>
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="عنوان المراجعة (اختياري)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder="شاركنا رأيك في المنتج..."
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-gold w-full rounded-full py-2 text-sm font-extrabold disabled:opacity-60"
          >
            {busy ? "جارٍ الإرسال..." : "أرسل المراجعة"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            لا توجد مراجعات بعد — كن أول من يقيّم هذا المنتج.
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-900 text-sm font-black text-gold-300">
                    {review.author.slice(0, 1)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink-900">{review.author}</span>
                    <Stars value={review.rating} size={13} />
                  </span>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(review.createdAt)}</span>
              </div>
              {review.title && (
                <h4 className="mt-2 text-sm font-extrabold text-ink-900">{review.title}</h4>
              )}
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{review.body}</p>
              {review.verified && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  ✓ شراء موثّق
                </span>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
