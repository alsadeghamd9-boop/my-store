"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { api } from "@/lib/client";

type Existing = { rating: number; title: string; body: string };

const HINTS = ["", "سيئ", "دون المتوقع", "مقبول", "جيد جداً", "ممتاز"];

export default function ReviewForm({
  productId,
  existing,
}: {
  productId: number;
  existing?: Existing;
}) {
  const router = useRouter();
  const toast = useToast();
  const uid = useId();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "save" | "delete">(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (rating < 1) next.rating = "اختر عدد النجوم أولاً.";
    if (body.trim().length < 10) next.body = "اكتب رأيك في 10 أحرف على الأقل.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy("save");
    const res = await api("/api/reviews", "POST", { productId, rating, title, body });
    setBusy(null);
    if (!res.ok) {
      setErrors(res.fields ?? {});
      toast({ tone: "error", message: res.error });
      return;
    }
    toast({ message: existing ? "حُدّث تقييمك." : "شكراً لك! نُشر تقييمك." });
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    const res = await api("/api/reviews", "DELETE", { productId });
    setBusy(null);
    if (!res.ok) {
      toast({ tone: "error", message: res.error });
      return;
    }
    setRating(0);
    setTitle("");
    setBody("");
    toast({ message: "حُذف تقييمك." });
    router.refresh();
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <p id={`${uid}-rating`} className="label">
          تقييمك للمنتج
        </p>
        <div className="flex items-center gap-3">
          <div
            role="radiogroup"
            aria-labelledby={`${uid}-rating`}
            aria-describedby={errors.rating ? `${uid}-rating-err` : undefined}
            className="flex"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} من 5 — ${HINTS[n]}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="grid h-10 w-10 place-items-center rounded-lg hover:bg-paper"
              >
                <Star
                  size={27}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden="true"
                  className={shown >= n ? "text-saffron-500" : "text-[#c3cfcc]"}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted">{HINTS[shown]}</span>
        </div>
        {errors.rating && (
          <p id={`${uid}-rating-err`} className="field-error">
            {errors.rating}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${uid}-title`} className="label">
          عنوان التقييم <span className="font-normal text-muted">(اختياري)</span>
        </label>
        <input
          id={`${uid}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className="field"
        />
      </div>

      <div>
        <label htmlFor={`${uid}-body`} className="label">
          رأيك
        </label>
        <textarea
          id={`${uid}-body`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? `${uid}-body-err` : undefined}
          placeholder="ما الذي أعجبك أو لم يعجبك؟ كيف كانت الجودة مقارنة بالسعر؟"
          className="field resize-y"
        />
        {errors.body && (
          <p id={`${uid}-body-err`} className="field-error">
            {errors.body}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy !== null} className="btn btn-dark">
          {busy === "save" ? "جارٍ النشر…" : existing ? "تحديث التقييم" : "نشر التقييم"}
        </button>
        {existing && (
          <button type="button" onClick={remove} disabled={busy !== null} className="btn btn-outline">
            {busy === "delete" ? "جارٍ الحذف…" : "حذف تقييمي"}
          </button>
        )}
      </div>
    </form>
  );
}
