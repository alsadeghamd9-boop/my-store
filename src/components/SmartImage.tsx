"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string | undefined;
  alt: string;
  className?: string;
  eager?: boolean;
};

/** Plain <img> with a neutral placeholder if the remote photo fails to load. */
export default function SmartImage(props: Props) {
  return <ImageWithFallback key={props.src ?? "empty"} {...props} />;
}

function ImageWithFallback({ src, alt, className = "", eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The error may fire before hydration attaches onError; check once on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`flex items-center justify-center bg-paper text-muted ${className}`}
      >
        <ImageOff size={28} aria-hidden="true" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
