"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import SmartImage from "@/components/SmartImage";

export default function ImageUploader({ images, onChange, limit = 6, onBusyChange }: {
  images: string[];
  onChange: (images: string[]) => void;
  limit?: number;
  onBusyChange?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > limit) {
      setError(`يمكن رفع ${limit} صور كحد أقصى.`);
      event.target.value = "";
      return;
    }
    setError("");
    setBusy(true);
    onBusyChange?.(true);
    const uploaded = [...images];
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) { setError("حجم الصورة يجب ألا يتجاوز 4 ميجابايت."); break; }
      const form = new FormData();
      form.append("file", file);
      try {
        const response = await fetch("/api/admin/upload", { method: "POST", body: form, credentials: "same-origin" });
        const data = await response.json();
        if (!response.ok || typeof data.url !== "string") {
          setError(typeof data.error === "string" ? data.error : "تعذّر رفع الصورة.");
          break;
        }
        uploaded.push(data.url);
      } catch {
        setError("تعذّر الاتصال بخدمة الرفع. حاول مجدداً.");
        break;
      }
    }
    onChange(uploaded);
    setBusy(false);
    onBusyChange?.(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div key={`${image}-${index}`} className="relative">
            <SmartImage src={image} alt={`الصورة ${index + 1}`} className="h-24 w-24 rounded-xl border border-line object-cover" />
            <button type="button" disabled={busy} aria-label={`إزالة الصورة ${index + 1}`} onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute -end-2 -top-2 grid size-7 place-items-center rounded-full bg-ink-900 text-white shadow">
              <X size={15} />
            </button>
          </div>
        ))}
        {images.length < limit && (
          <label className="flex h-24 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-700/40 bg-paper text-xs font-semibold text-ink-700 hover:bg-ink-100">
            {busy ? <LoaderCircle className="animate-spin" size={21} /> : <ImagePlus size={21} />}
            {busy ? "جارٍ الرفع..." : "رفع صورة"}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={limit > 1} disabled={busy} onChange={upload} className="sr-only" />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">JPG أو PNG أو WebP، حتى 4 ميجابايت للصورة. تُرفع الملفات إلى Cloudinary.</p>
      {error && <p role="alert" className="field-error">{error}</p>}
      {busy && <p role="status" className="mt-1 text-xs text-muted">انتظر اكتمال رفع الصورة قبل حفظ التغييرات.</p>}
    </div>
  );
}
