"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useLowEnd, useReducedMotion } from "./hooks";

const MIN_WIDTH = 62;
const MAX_WIDTH = 125;
/** wdth units per px/s of scroll velocity. */
const RESPONSE = 0.012;
const IDLE_MS = 140;

/**
 * Velocity-driven width for elements marked `data-flex-width` (stop names, pull quotes,
 * ledger titles). Scrolling down condenses them, scrolling up widens them, idle returns to 100.
 * Their height is locked at wdth 100 so the reflow never pushes the page around.
 */
export function FlexWidth() {
  const reduced = useReducedMotion();
  const lowEnd = useLowEnd();
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    if (reduced || lowEnd) {
      root.style.removeProperty("--wdth");
      return;
    }

    const elements = () => [...document.querySelectorAll<HTMLElement>("[data-flex-width]")];
    const proxy = { width: 100 };
    const setWidth = () => root.style.setProperty("--wdth", proxy.width.toFixed(1));
    const toWidth = gsap.quickTo(proxy, "width", {
      duration: 0.45,
      ease: "power3.out",
      onUpdate: setWidth,
    });

    const lock = () => {
      gsap.killTweensOf(proxy);
      proxy.width = 100;
      setWidth();

      for (const element of elements()) {
        element.style.height = "";
      }

      for (const element of elements()) {
        element.style.height = `${element.offsetHeight}px`;
      }
    };

    let idle: number | undefined;
    let resize: number | undefined;

    const trigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const target = 100 - self.getVelocity() * RESPONSE;
        toWidth(Math.min(Math.max(target, MIN_WIDTH), MAX_WIDTH));
        window.clearTimeout(idle);
        idle = window.setTimeout(() => toWidth(100), IDLE_MS);
      },
    });

    const onResize = () => {
      window.clearTimeout(resize);
      resize = window.setTimeout(lock, 200);
    };

    lock();
    void document.fonts.ready.then(lock);
    window.addEventListener("resize", onResize);

    return () => {
      trigger.kill();
      window.clearTimeout(idle);
      window.clearTimeout(resize);
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf(proxy);
      root.style.removeProperty("--wdth");

      for (const element of elements()) {
        element.style.height = "";
      }
    };
  }, [reduced, lowEnd, pathname]);

  return null;
}
