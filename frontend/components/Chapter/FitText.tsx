"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/motion/hooks";

interface Props {
  children: ReactNode;
  className?: string;
  /** Server-measured width of the text in em; sizes the line before hydration. */
  em: number;
}

/**
 * One line of text scaled to fill its container's width exactly.
 * CSS sets the size from server-side font metrics (no layout shift); once fonts are loaded
 * this measures the real line and corrects any small difference (kerning, fallback fonts).
 */
export function FitText({ children, className, em }: Props) {
  const line = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = line.current;
    const container = element?.parentElement;

    if (!element || !container) {
      return;
    }

    const fit = () => {
      element.style.fontSize = "";
      const available = container.clientWidth;
      const width = element.getBoundingClientRect().width;

      if (available > 0 && width > 0) {
        const size = Number.parseFloat(getComputedStyle(element).fontSize);
        element.style.fontSize = `${(size * available) / width}px`;
      }
    };

    fit();
    void document.fonts.ready.then(fit);

    // Refit on width changes only; fitting itself changes the container's height.
    let lastWidth = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth !== lastWidth) {
        lastWidth = container.clientWidth;
        fit();
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <span ref={line} className={className} style={{ "--fit-em": em } as CSSProperties}>
      {children}
    </span>
  );
}
