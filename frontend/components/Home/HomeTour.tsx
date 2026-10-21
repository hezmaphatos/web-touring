"use client";

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { RouteMap } from "@/components/RouteMap/RouteMap";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { emWidth } from "@/lib/fit/measure";
import { toSceneTrip } from "@/lib/geo/route";
import type { RouteScene } from "@/lib/geo/scene";
import { CHAPTER_COLORS, formatDateRange, formatKm } from "@/lib/format";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import type { MapTrip } from "@/lib/types";
import { Opening } from "./Opening";
import styles from "./Home.module.css";

interface Props {
  siteName: string;
  totalKm: number;
  /** Published trips, chronological. */
  trips: MapTrip[];
}

/** List mode: reduced motion or a low-end device. Mirrors the CSS that turns the tour into a list. */
function isListMode(): boolean {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.hasAttribute("data-lowend")
  );
}

/**
 * Home: the opening sequence, then a pinned map. Each trip is a step in the page; scrolling
 * onto a step eases the map to that trip's bounding box while its panel sits on the left.
 * In list mode the map stays still with every route drawn and the steps read as a list.
 */
export function HomeTour({ siteName, totalKm, trips }: Props) {
  const sceneTrips = useMemo(() => trips.map(toSceneTrip), [trips]);
  const scene = useRef<RouteScene | null>(null);
  const pendingDraw = useRef<number | null>(null);
  const steps = useRef<HTMLOListElement>(null);
  const active = useRef(0);
  const viewTween = useRef<gsap.core.Tween | null>(null);

  const runDraw = useCallback(
    (target: RouteScene, seconds: number) => {
      if (seconds <= 0) {
        target.setAllProgress(1);
        return;
      }

      // Chronological and overlapping: all routes finish within `seconds`.
      const each = Math.min(1, seconds * 0.6);
      const stagger = sceneTrips.length > 1 ? (seconds - each) / (sceneTrips.length - 1) : 0;

      sceneTrips.forEach((trip, index) => {
        const state = { progress: 0 };
        gsap.to(state, {
          progress: 1,
          duration: each,
          delay: index * stagger,
          ease: "power2.inOut",
          onUpdate: () => target.setProgress(trip.key, state.progress),
        });
      });
    },
    [sceneTrips],
  );

  const drawRoutes = useCallback(
    (seconds: number) => {
      if (scene.current === null) {
        pendingDraw.current = seconds;
        return;
      }
      runDraw(scene.current, seconds);
    },
    [runDraw],
  );

  const goTo = useCallback(
    (index: number) => {
      const target = scene.current;
      active.current = index;

      if (target === null) {
        return;
      }

      const key = index === 0 ? undefined : sceneTrips[index - 1]?.key;
      const interpolate = target.interpolator(target.currentView, target.viewFor(key));
      const state = { t: 0 };

      viewTween.current?.kill();
      viewTween.current = gsap.to(state, {
        t: 1,
        duration: 1.1,
        ease: "expo.out",
        onUpdate: () => target.setView(interpolate(state.t)),
      });
      target.focus(key ?? null);
    },
    [sceneTrips],
  );

  const handleScene = useCallback(
    (created: RouteScene | null) => {
      scene.current = created;

      if (created === null) {
        return;
      }

      if (pendingDraw.current !== null) {
        runDraw(created, pendingDraw.current);
        pendingDraw.current = null;
      } else {
        created.setAllProgress(document.documentElement.hasAttribute("data-opening") ? 0 : 1);
      }
    },
    [runDraw],
  );

  // Keep the panel side of the map free: left column on wide screens, bottom half on phones.
  const handleReady = useCallback(
    (ready: RouteScene) => {
      ready.setFrameResolver((width, height) => {
        if (isListMode()) {
          return { top: 0, right: 0, bottom: 0, left: 0 };
        }

        return window.matchMedia("(min-width: 900px)").matches
          ? { top: 0, right: 0, bottom: 0, left: width * 0.42 }
          : { top: 0, right: 0, bottom: height * 0.48, left: 0 };
      });
      ready.setView(ready.viewFor(sceneTrips[active.current - 1]?.key));
    },
    [sceneTrips],
  );

  const handleResize = useCallback(
    (resized: RouteScene) => {
      viewTween.current?.kill();
      resized.setView(resized.viewFor(sceneTrips[active.current - 1]?.key));
    },
    [sceneTrips],
  );

  useEffect(() => {
    const list = steps.current;

    if (list === null || isListMode()) {
      return;
    }

    const context = gsap.context(() => {
      list.querySelectorAll<HTMLElement>("[data-step]").forEach((step, index) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive && active.current !== index) {
              goTo(index);
            }
          },
        });
      });
    }, list);

    return () => context.revert();
  }, [goTo]);

  return (
    <section className={styles.tour} aria-label="Semua trip di peta">
      <Opening km={totalKm} drawRoutes={drawRoutes} />

      <div className={styles.stage}>
        <RouteMap
          className={styles.map}
          trips={sceneTrips}
          label={`Peta rute ${trips.length} trip`}
          onScene={handleScene}
          onReady={handleReady}
          onResize={handleResize}
        />
      </div>

      <ol ref={steps} className={styles.steps}>
        <li className={styles.step} data-step>
          <div className={styles.panel}>
            <h1 className={styles.siteName}>{siteName}</h1>
            <p className={styles.bigKm}>
              {formatKm(totalKm)}
              <span className={styles.unit}> km</span>
            </p>
            <p className={styles.lead}>
              {trips.length} trip sejauh ini.
              {trips.length > 0 && " Gulir untuk menyusuri tiap trip dari yang pertama."}
            </p>
          </div>
        </li>
        {trips.map((trip) => {
          const dates = formatDateRange(trip.started_at, trip.ended_at);

          return (
            <li key={trip.slug} className={styles.step} data-step>
              <article className={styles.panel}>
                <p className={styles.number}>Trip ke-{trip.number}</p>
                <h2
                  className={styles.tripTitle}
                  style={
                    {
                      "--fit-em": emWidth(trip.title.toLocaleUpperCase("id-ID"), -0.01),
                    } as CSSProperties
                  }
                >
                  {trip.title}
                </h2>
                {dates && <p className={styles.dates}>{dates}</p>}
                {trip.distance_km !== null && (
                  <p className={styles.bigKm}>
                    {formatKm(trip.distance_km)}
                    <span className={styles.unit}> km</span>
                  </p>
                )}
                <TransitionLink
                  href={`/trip/${trip.slug}`}
                  color={CHAPTER_COLORS[trip.type]}
                  className={styles.open}
                >
                  Buka cerita
                  <span className="visually-hidden"> {trip.title}</span>
                </TransitionLink>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
