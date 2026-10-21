"use client";

import { useCallback, useMemo } from "react";
import { RouteMap } from "@/components/RouteMap/RouteMap";
import { toSceneTrip } from "@/lib/geo/route";
import type { RouteScene } from "@/lib/geo/scene";
import { gsap } from "@/lib/motion/gsap";
import type { PlannedTrip } from "@/lib/types";
import styles from "./NextRide.module.css";

/** Planned routes, dashed, drawn once with the shared route draw (instantly under reduced motion). */
export function NextRideMap({ trips }: { trips: PlannedTrip[] }) {
  const sceneTrips = useMemo(() => trips.map(toSceneTrip), [trips]);

  const handleScene = useCallback(
    (scene: RouteScene | null) => {
      if (scene === null) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scene.setAllProgress(1);
        return;
      }

      const state = { progress: 0 };
      scene.setAllProgress(0);
      gsap.to(state, {
        progress: 1,
        duration: 1.4,
        delay: 0.2,
        ease: "power2.inOut",
        onUpdate: () => sceneTrips.forEach((trip) => scene.setProgress(trip.key, state.progress)),
      });
    },
    [sceneTrips],
  );

  return (
    <div className={styles.map}>
      <RouteMap
        className={styles.svg}
        trips={sceneTrips}
        label={`Peta ${trips.length} rencana trip`}
        onScene={handleScene}
        interactiveStops
        padding={40}
      />
    </div>
  );
}
