"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    key: "tech",
    eyebrow: "إلكترونيات",
    title: "تقنية تسبق يومك",
    text: "سماعات وحواسيب وكاميرات مختارة بعناية، مع خصومات على أكثر المنتجات طلباً.",
    cta: "تسوّق الإلكترونيات",
    href: "/search?category=electronics",
    image: "/images/hero-tech.jpg",
    alt: "سماعات رأس وهاتف وساعة ذكية على منصات داكنة",
    panel: "bg-ink-900 text-white",
    eyebrowCls: "text-saffron-300",
    textCls: "text-ink-100",
    btn: "btn-primary",
  },
  {
    key: "home",
    eyebrow: "المنزل والمطبخ",
    title: "قهوتك كما تحبها، في بيتك",
    text: "ماكينات إسبريسو وأدوات مطبخ تصلك في اليوم التالي مع توصيل إكسبرس.",
    cta: "تسوّق المنزل والمطبخ",
    href: "/search?category=home",
    image: "/images/hero-home.jpg",
    alt: "ماكينة إسبريسو تصب القهوة بجوار قدر طهي على سطح مطبخ",
    panel: "bg-saffron-400 text-ink-950",
    eyebrowCls: "text-ink-800",
    textCls: "text-ink-900",
    btn: "btn-dark",
  },
  {
    key: "style",
    eyebrow: "أزياء وإكسسوارات",
    title: "خطوتك القادمة تبدأ هنا",
    text: "أحذية وحقائب ونظارات وساعات لكل يوم، بخصومات تصل إلى 25%.",
    cta: "تسوّق الأزياء",
    href: "/search?category=fashion",
    image: "/images/hero-style.jpg",
    alt: "حذاء رياضي ونظارة شمسية وساعة يد وحقيبة ظهر",
    panel: "bg-[#dce4da] text-ink-950",
    eyebrowCls: "text-express",
    textCls: "text-ink-800",
    btn: "btn-dark",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(timer);
  }, [paused, count]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="عروض مميزة"
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="grid">
        {SLIDES.map((s, i) => {
          const current = i === index;
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} من ${count}`}
              aria-hidden={!current}
              inert={!current}
              className={`col-start-1 row-start-1 grid transition-opacity duration-700 md:grid-cols-2 ${s.panel} ${
                current ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div className="order-2 flex flex-col justify-center px-5 pt-6 pb-20 sm:px-8 md:order-1 md:px-12 md:py-16 lg:px-16">
                <p className={`text-sm font-semibold ${s.eyebrowCls}`}>{s.eyebrow}</p>
                <h2 className="mt-2 text-[clamp(1.7rem,4.2vw,3.1rem)] leading-[1.25] font-extrabold">
                  {s.title}
                </h2>
                <p className={`mt-3 max-w-md text-[15px] leading-relaxed sm:text-base ${s.textCls}`}>
                  {s.text}
                </p>
                <div className="mt-6">
                  <Link href={s.href} className={`btn ${s.btn} px-6 py-3`}>
                    {s.cta}
                    <ChevronLeft size={17} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <div className="relative order-1 h-48 sm:h-64 md:order-2 md:h-auto md:min-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="on-dark absolute start-5 bottom-5 z-10 flex items-center gap-0.5 rounded-full bg-ink-950/90 p-1 text-white sm:start-8 md:start-12 md:bottom-6 lg:start-16">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + count) % count)}
          aria-label="الشريحة السابقة"
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          <ChevronRight size={17} aria-hidden="true" />
        </button>
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`الانتقال إلى الشريحة ${i + 1}`}
            aria-current={i === index}
            className="grid h-8 w-6 place-items-center"
          >
            <span
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-5 bg-saffron-400" : "w-2 bg-white/50"
              }`}
            />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % count)}
          aria-label="الشريحة التالية"
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
