"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./hooks";

const LenisContext = createContext<RefObject<Lenis | null> | null>(null);

/**
 * Smooth wheel scrolling, driven by the GSAP ticker and synced to ScrollTrigger.
 * Touch scrolling stays native. Off under reduced motion.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenis = useRef<Lenis | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      return;
    }

    const instance = new Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.12 });
    const tick = (time: number) => instance.raf(time * 1000);

    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.current = instance;

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

/** Ref to the Lenis instance (null under reduced motion or before mount). */
export function useLenis(): RefObject<Lenis | null> {
  const context = useContext(LenisContext);

  if (context === null) {
    throw new Error("useLenis must be used inside LenisProvider");
  }

  return context;
}
