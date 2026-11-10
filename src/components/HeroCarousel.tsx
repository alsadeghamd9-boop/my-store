"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  gradient: string;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex(((next % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(${index * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0" dir="rtl">
            <div className={`relative h-[240px] sm:h-[300px] lg:h-[360px] ${slide.gradient}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/25 to-black/70" />
              <div className="relative flex h-full flex-col justify-center gap-3 px-6 sm:px-10">
                <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  {slide.eyebrow}
                </span>
                <h2 className="max-w-lg text-2xl font-black leading-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h2>
                <p className="max-w-md text-sm text-white/85 sm:text-base">{slide.description}</p>
                <a
                  href={slide.href}
                  className="btn-gold mt-1 w-fit rounded-full px-6 py-2.5 text-sm font-extrabold"
                >
                  {slide.cta}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="الشريحة السابقة"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/45"
          >
            <ChevronRight width={22} height={22} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="الشريحة التالية"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white/45"
          >
            <ChevronLeft width={22} height={22} />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(slideIndex)}
                aria-label={`الشريحة ${slideIndex + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  slideIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
