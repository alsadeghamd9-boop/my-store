"use client";

import { useEffect, useState } from "react";

function getRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownTimer({
  hoursFromNow = 12,
  label = "ينتهي العرض خلال",
}: {
  hoursFromNow?: number;
  label?: string;
}) {
  const [target] = useState(() => new Date(Date.now() + hoursFromNow * 3600000));
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const pad = (value: number) => value.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="flex items-center gap-1" dir="ltr">
        {[pad(remaining.hours), pad(remaining.minutes), pad(remaining.seconds)].map((unit, index) => (
          <span key={index} className="flex items-center gap-1">
            <span className="rounded-md bg-ink-900 px-1.5 py-0.5 font-mono text-xs font-black text-gold-300">
              {unit}
            </span>
            {index < 2 && <span className="font-black text-ink-900">:</span>}
          </span>
        ))}
      </span>
    </div>
  );
}
