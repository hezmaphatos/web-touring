"use client";

import { useEffect, useRef } from "react";
import { odometerDigits } from "@/lib/format";
import { Flip, gsap } from "@/lib/motion/gsap";
import { isLowEndDevice } from "@/lib/motion/hooks";
import { OPENING_SESSION_KEY } from "@/lib/motion/opening";
import styles from "./Opening.module.css";

/** Full wheel cycles each strip turns before landing; the units strip turns the most. */
const UNITS_CYCLES = 4;

interface Props {
  km: number;
  /** Draw the routes over `seconds` (0 = at once). */
  drawRoutes: (seconds: number) => void;
}

function shouldPlay(): boolean {
  const html = document.documentElement;

  if (html.hasAttribute("data-opening")) {
    return true;
  }

  // Arrived through client-side navigation: the boot script did not run for this page.
  try {
    const play =
      sessionStorage.getItem(OPENING_SESSION_KEY) === null &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (play) {
      html.setAttribute("data-opening", "");
    }

    return play;
  } catch {
    return false;
  }
}

/**
 * Home opening, first visit per session only, skippable by click, key or scroll:
 * black screen, a mechanical odometer rolls up to the total distance, the odometer flies
 * into the nav readout while the black closes to a line, then every route draws in order.
 */
export function Opening({ km, drawRoutes }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const draw = useRef(drawRoutes);
  const digits = odometerDigits(km);

  useEffect(() => {
    draw.current = drawRoutes;
  });

  useEffect(() => {
    const element = root.current;

    if (element === null || !shouldPlay()) {
      draw.current(0);
      return;
    }

    const html = document.documentElement;
    const overlay = element.querySelector<HTMLElement>("[data-overlay]");
    const center = element.querySelector<HTMLElement>("[data-center]");
    const frame = element.querySelector<HTMLElement>("[data-frame]");
    const strips = [...element.querySelectorAll<HTMLElement>("[data-strip]")];
    const readout = document.querySelector<HTMLElement>("[data-odometer-readout]");
    const short = isLowEndDevice();
    let routesStarted = false;
    let done = false;

    const startRoutes = (seconds: number) => {
      if (!routesStarted) {
        routesStarted = true;
        draw.current(seconds);
      }
    };

    const timeline = gsap.timeline();

    // Seen once it completes or is skipped; an unmount mid-sequence lets it play again.
    const markSeen = () => {
      try {
        sessionStorage.setItem(OPENING_SESSION_KEY, "1");
      } catch {
        // Storage blocked: the opening simply plays again next time.
      }
    };

    const finish = (seen: boolean) => {
      if (seen) {
        markSeen();
      }

      if (done) {
        return;
      }

      done = true;
      timeline.kill();
      gsap.killTweensOf([overlay, frame]);
      html.removeAttribute("data-opening");
      startRoutes(0);
      removeSkipListeners();
    };

    const skip = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key === "Tab") {
        return;
      }
      finish(true);
    };

    const skipEvents = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    const removeSkipListeners = () => {
      for (const name of skipEvents) {
        window.removeEventListener(name, skip);
      }
    };

    for (const name of skipEvents) {
      window.addEventListener(name, skip, { passive: true });
    }

    // Each strip holds the digits 0–9 for every cycle plus the final turn.
    strips.forEach((strip) => {
      const cells = Number(strip.dataset.cells);
      const target = Number(strip.dataset.target);
      gsap.set(strip, { yPercent: short ? (-100 * target) / cells : 0 });
    });

    const rollStart = short ? 0.2 : 0.4;
    const flipAt = short ? 0.8 : 3.0;
    const flipSeconds = short ? 0.5 : 0.8;

    // Pure black first: the odometer appears when the roll starts, not when the HTML arrives.
    timeline.set(center, { visibility: "visible" }, rollStart);

    if (!short) {
      strips.forEach((strip, index) => {
        const fromRight = strips.length - 1 - index;
        const start = rollStart + fromRight * 0.12;
        const cells = Number(strip.dataset.cells);
        const target = Number(strip.dataset.target);
        timeline.to(
          strip,
          { yPercent: (-100 * target) / cells, duration: 2.4 - start, ease: "power3.out" },
          start,
        );
      });
    }

    timeline.add(() => {
      if (frame && readout) {
        Flip.fit(frame, readout, { duration: flipSeconds, ease: "expo.inOut", scale: true });
      }
    }, flipAt);
    timeline.to(
      overlay,
      { clipPath: "inset(50% 0% 50% 0%)", duration: flipSeconds, ease: "expo.inOut" },
      flipAt,
    );
    timeline.add(() => {
      html.removeAttribute("data-opening");
      startRoutes(short ? 0 : 2);
    }, flipAt + flipSeconds);
    timeline.add(
      () => {
        done = true;
        markSeen();
        removeSkipListeners();
      },
      flipAt + flipSeconds + (short ? 0 : 2),
    );

    return () => {
      finish(false);
    };
  }, []);

  return (
    <div ref={root} className={styles.opening} aria-hidden="true">
      <div className={styles.overlay} data-overlay />
      <div className={styles.center} data-center>
        <div className={styles.frame} data-frame>
          {digits.split("").map((digit, index) => {
            const fromRight = digits.length - 1 - index;
            const cycles = Math.max(UNITS_CYCLES - fromRight, 1);
            const cells = cycles * 10 + 10;
            const target = cycles * 10 + Number(digit);

            return (
              <span key={index} className={styles.cell}>
                <span className={styles.strip} data-strip data-cells={cells} data-target={target}>
                  {Array.from({ length: cells }, (_, cell) => (
                    <span key={cell} className={styles.digit}>
                      {cell % 10}
                    </span>
                  ))}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
