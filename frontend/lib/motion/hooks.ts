"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const TOUCH_QUERY = "(hover: none), (pointer: coarse)";

function subscribeToQuery(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  };
}

const subscribeReduced = subscribeToQuery(REDUCED_QUERY);
const subscribeTouch = subscribeToQuery(TOUCH_QUERY);
const noSubscription = () => () => {};

/** True when the visitor asked for reduced motion. False during server rendering. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** True on touch-first devices (no hover). */
export function useTouch(): boolean {
  return useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );
}

interface DeviceNavigator extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function isLowEndDevice(): boolean {
  const device = navigator as DeviceNavigator;

  return (
    (device.hardwareConcurrency !== undefined && device.hardwareConcurrency <= 4) ||
    (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
    device.connection?.saveData === true
  );
}

/**
 * Low-end fallback: few cores, little memory or data saver on.
 * Disables WebGL and the velocity width effect, and shortens the opening sequence.
 */
export function useLowEnd(): boolean {
  return useSyncExternalStore(noSubscription, isLowEndDevice, () => false);
}

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
