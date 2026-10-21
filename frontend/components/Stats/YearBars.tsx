"use client";

import { useEffect, useRef } from "react";
import { formatKm } from "@/lib/format";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/hooks";
import type { Stats } from "@/lib/types";
import styles from "./Stats.module.css";

const HEIGHT = 320;
const LABEL_SPACE = 34;
const VALUE_SPACE = 30;
const BAR = 56;
const GAP = 28;

/**
 * Kilometers per year as thick black bars, hand-built SVG. The bars grow from zero once,
 * when the chart enters the viewport; under reduced motion they are simply there.
 */
export function YearBars({ years }: { years: Stats["km_per_year"] }) {
  const chart = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const max = Math.max(...years.map((year) => year.km), 1);
  const width = years.length * (BAR + GAP) + GAP;
  const plot = HEIGHT - LABEL_SPACE - VALUE_SPACE;

  useEffect(() => {
    const element = chart.current;

    if (element === null || reduced) {
      return;
    }

    const context = gsap.context(() => {
      const bars = element.querySelectorAll("[data-bar]");
      gsap.set(bars, { scaleY: 0, transformOrigin: "50% 100%" });
      ScrollTrigger.create({
        trigger: element,
        start: "top 80%",
        once: true,
        onEnter: () => gsap.to(bars, { scaleY: 1, duration: 1.1, ease: "expo.out", stagger: 0.08 }),
      });
    }, element);

    return () => context.revert();
  }, [reduced]);

  return (
    <div className={styles.chartScroll}>
      <svg
        ref={chart}
        className={styles.chart}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Kilometer per tahun: ${years.map((year) => `${year.year} ${formatKm(year.km)} km`).join(", ")}`}
      >
        <line
          x1={0}
          x2={width}
          y1={HEIGHT - LABEL_SPACE}
          y2={HEIGHT - LABEL_SPACE}
          className={styles.baseline}
        />
        {years.map((year, index) => {
          const x = GAP + index * (BAR + GAP);
          const barHeight = Math.max((year.km / max) * plot, 3);
          const y = HEIGHT - LABEL_SPACE - barHeight;

          return (
            <g key={year.year}>
              <rect data-bar x={x} y={y} width={BAR} height={barHeight} className={styles.bar} />
              <text x={x} y={y - 10} className={styles.barValue}>
                {formatKm(year.km)}
              </text>
              <text x={x} y={HEIGHT - 8} className={styles.barYear}>
                {year.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
