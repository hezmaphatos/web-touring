"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/hooks";
import { useLenis } from "@/lib/motion/LenisProvider";
import styles from "./Transition.module.css";

interface TransitionApi {
  navigate: (href: string, color: string) => void;
}

const TransitionContext = createContext<TransitionApi | null>(null);

const COVER_SECONDS = 0.42;
const REVEAL_SECONDS = 0.42;
/** Reveal anyway if the route has not changed by then (failed or slow navigation). */
const FALLBACK_MS = 6000;

/**
 * Page transition: a full-height block in the destination's chapter color wipes across
 * like a passing vehicle, the route changes underneath, then the block drives off.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const curtain = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const fallback = useRef<number | undefined>(undefined);

  const reveal = useCallback(() => {
    const element = curtain.current;
    window.clearTimeout(fallback.current);
    pending.current = false;

    if (element === null) {
      return;
    }

    lenis.current?.scrollTo(0, { immediate: true, force: true });
    gsap.to(element, {
      clipPath: "inset(0% 0% 0% 100%)",
      duration: REVEAL_SECONDS,
      ease: "power3.out",
      onComplete: () => gsap.set(element, { visibility: "hidden" }),
    });
  }, [lenis]);

  const navigate = useCallback(
    (href: string, color: string) => {
      const target = new URL(href, window.location.href);
      const element = curtain.current;

      if (reduced || element === null || target.pathname === window.location.pathname) {
        router.push(href);
        return;
      }

      if (pending.current) {
        return;
      }

      pending.current = true;
      element.style.background = color;
      gsap.fromTo(
        element,
        { clipPath: "inset(0% 100% 0% 0%)", visibility: "visible" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: COVER_SECONDS,
          ease: "power3.in",
          onComplete: () => {
            router.push(href);
            fallback.current = window.setTimeout(reveal, FALLBACK_MS);
          },
        },
      );
    },
    [reduced, reveal, router],
  );

  useEffect(() => {
    if (pending.current) {
      reveal();
    }
  }, [pathname, reveal]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={curtain} className={styles.curtain} aria-hidden="true" />
    </TransitionContext.Provider>
  );
}

export function useTransition(): TransitionApi | null {
  return useContext(TransitionContext);
}
