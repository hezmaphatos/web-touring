"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { RouteMap } from "@/components/RouteMap/RouteMap";
import { routeCoordinates, type SceneTrip } from "@/lib/geo/route";
import type { RouteScene } from "@/lib/geo/scene";
import { formatKm } from "@/lib/format";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/hooks";
import type { Trip } from "@/lib/types";
import styles from "./RideMode.module.css";

/**
 * Ride mode. Scrolling through the story drives this trip's route (drawn up to the reader's
 * position, the yellow marker riding along) and, on wide screens, a fixed gauge on the left
 * edge that fills with progress and reads out kilometers ridden. Under reduced motion both
 * show the finished state.
 */
export function RideMode({ trip }: { trip: Trip }) {
  const sceneTrips = useMemo<SceneTrip[]>(
    () => [
      {
        key: trip.slug,
        label: trip.title,
        type: trip.type,
        planned: false,
        coords: routeCoordinates(trip.route_geojson, trip.stops),
        stops: trip.stops.map((stop) => ({ name: stop.name, coord: [stop.lng, stop.lat] })),
      },
    ],
    [trip],
  );
  const rail = useRef<HTMLDivElement>(null);
  const gauge = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const scene = useRef<RouteScene | null>(null);
  const progress = useRef(0);
  const reduced = useReducedMotion();

  const apply = useCallback(
    (value: number) => {
      progress.current = value;
      scene.current?.setProgress(trip.slug, value);

      if (fill.current) {
        fill.current.style.transform = `scaleY(${value})`;
      }

      if (readout.current && gauge.current) {
        const track = gauge.current.clientHeight;
        readout.current.style.transform = `translateY(${Math.round(value * track)}px)`;
        readout.current.textContent =
          trip.distance_km === null ? "" : `${formatKm(Math.round(value * trip.distance_km))} km`;
      }
    },
    [trip.slug, trip.distance_km],
  );

  const handleScene = useCallback(
    (created: RouteScene | null) => {
      scene.current = created;
      created?.setProgress(trip.slug, progress.current);
    },
    [trip.slug],
  );

  useEffect(() => {
    const story = rail.current?.parentElement;

    if (!story) {
      return;
    }

    if (reduced) {
      apply(1);
      gauge.current?.classList.add(styles.on);
      return;
    }

    apply(0);

    const context = gsap.context(() => {
      // Mapped straight from scroll position: linear, no easing.
      ScrollTrigger.create({
        trigger: story,
        start: "top 60%",
        end: "bottom bottom",
        onUpdate: (self) => apply(self.progress),
        onToggle: (self) => gauge.current?.classList.toggle(styles.on, self.isActive),
        onRefresh: (self) => apply(self.progress),
      });
    });

    return () => context.revert();
  }, [apply, reduced]);

  return (
    <>
      <div ref={rail} className={styles.rail}>
        <div className={styles.railMap}>
          <RouteMap
            className={styles.map}
            trips={sceneTrips}
            label={`Rute ${trip.title}`}
            onScene={handleScene}
            interactiveStops
            padding={16}
          />
        </div>
      </div>
      <div ref={gauge} className={styles.gauge} aria-hidden="true">
        <div ref={fill} className={styles.fill} data-chapter={trip.type} />
        <span ref={readout} className={styles.readout} />
      </div>
    </>
  );
}
