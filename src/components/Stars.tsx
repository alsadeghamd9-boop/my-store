import type { CSSProperties } from "react";

/**
 * Read-only rating drawn with a CSS mask (see `.stars` in globals.css) so a
 * grid of products doesn't ship hundreds of SVG nodes. Fills from the start
 * edge, i.e. from the right in RTL.
 */
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className="stars"
      role="img"
      aria-label={`${value.toFixed(1)} من 5 نجوم`}
      style={{ "--star": `${size}px` } as CSSProperties}
    >
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}
