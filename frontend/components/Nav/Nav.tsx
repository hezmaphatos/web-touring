"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OdometerReadout } from "@/components/Odometer/OdometerReadout";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/hooks";
import { useLenis } from "@/lib/motion/LenisProvider";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "/trip", label: "Trip" },
  { href: "/peta", label: "Peta" },
  { href: "/garage", label: "Garage" },
  { href: "/statistik", label: "Statistik" },
  { href: "/next-ride", label: "Next ride" },
  { href: "/tentang", label: "Tentang" },
];

function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ siteName, totalKm }: { siteName: string; totalKm: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const firstRun = useRef(true);
  const reduced = useReducedMotion();
  const lenis = useLenis();

  // Menu opens with a height reveal only.
  useEffect(() => {
    const element = panel.current;

    if (element === null) {
      return;
    }

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    gsap.killTweensOf(element);

    // While the menu covers the page, everything behind it is out of reach (Tab included).
    for (const behind of document.querySelectorAll("main, body > footer, footer")) {
      behind.toggleAttribute("inert", open);
    }

    if (open) {
      lenis.current?.stop();
      document.documentElement.style.overflow = "hidden";
      gsap.set(element, { visibility: "visible" });
      gsap.fromTo(
        element,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: reduced ? 0 : 0.5, ease: "expo.out" },
      );
      element.querySelector<HTMLElement>("a")?.focus();
    } else {
      lenis.current?.start();
      document.documentElement.style.overflow = "";
      gsap.to(element, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: reduced ? 0 : 0.35,
        ease: "power3.out",
        onComplete: () => gsap.set(element, { visibility: "hidden" }),
      });
    }
  }, [open, reduced, lenis]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={styles.bar}>
      <div className={`wrap ${styles.inner}`}>
        <TransitionLink
          href="/"
          className={styles.name}
          aria-current={pathname === "/" ? "page" : undefined}
          onClick={close}
        >
          {siteName}
        </TransitionLink>
        <OdometerReadout km={totalKm} />

        <nav aria-label="Utama" className={styles.desktop}>
          <ul className={styles.links}>
            {LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  className={styles.link}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={toggle}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="menu-utama"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Tutup" : "Menu"}
        </button>
      </div>

      <div ref={panel} id="menu-utama" className={styles.panel} data-surface="dark">
        <nav aria-label="Menu">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  className={styles.panelLink}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                  onClick={close}
                >
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
