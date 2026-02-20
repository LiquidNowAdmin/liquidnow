"use client";

import { useRef, useEffect, useCallback } from "react";

export default function ScrollWaves() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const speeds = useRef<number[]>(
    Array.from({ length: 15 }, (_, i) => 0.8 + (i + 1) * 0.12)
  );

  const onScroll = useCallback(() => {
    const vw = window.innerWidth;
    const progress = Math.min(window.scrollY * 1.5, vw);
    layerRefs.current.forEach((el, idx) => {
      if (!el) return;
      const offset = -(progress * speeds.current[idx]);
      el.style.transform = `translateX(${offset}px)`;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div className="flow-waves">
      {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => {
        const amplitude = 8 + i * 4;
        const center = 50;
        const peak = center - amplitude;
        const trough = center + amplitude;
        const d = `M0,${center}C240,${peak},480,${trough},720,${center}C960,${peak},1200,${trough},1440,${center}C1680,${peak},1920,${trough},2160,${center}C2400,${peak},2640,${trough},2880,${center}`;
        return (
          <div
            key={i}
            ref={(el) => { layerRefs.current[i - 1] = el; }}
            className={`flow-wave-layer flow-wave-${i}`}
          >
            <svg viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full">
              <path
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeOpacity={0.3 + i * 0.04}
                d={d}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
