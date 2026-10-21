"use client";

import dynamic from "next/dynamic";
import styles from "./RideMode.module.css";

/**
 * Ride mode (map engine, d3, the gauge) loads after the chapter has rendered, keeping it off
 * the critical path. The placeholder takes the strip's exact space, so nothing shifts.
 */
export const RideModeLazy = dynamic(() => import("./RideMode").then((module) => module.RideMode), {
  ssr: false,
  loading: () => <div className={styles.rail} aria-hidden="true" />,
});
