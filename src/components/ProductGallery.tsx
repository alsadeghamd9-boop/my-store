"use client";

import { useState } from "react";
import SmartImage from "@/components/SmartImage";

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const list = images.length > 0 ? images : [""];
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, list.length - 1);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {list.length > 1 && (
        <ul className="flex gap-2 sm:flex-col" aria-label="صور المنتج">
          {list.map((src, i) => (
            <li key={`${src}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                onMouseEnter={() => setIndex(i)}
                aria-label={`عرض الصورة ${i + 1} من ${list.length}`}
                aria-current={i === safeIndex}
                className={`block h-16 w-16 overflow-hidden rounded-xl border-2 bg-white ${
                  i === safeIndex ? "border-ink-900" : "border-line hover:border-ink-700"
                }`}
              >
                <SmartImage src={src} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white">
        <SmartImage
          src={list[safeIndex]}
          alt={title}
          eager
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  );
}
