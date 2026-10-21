"use client";

import { useEffect, useId, useRef } from "react";
import { loadLand } from "@/lib/geo/land";
import type { SceneTrip } from "@/lib/geo/route";
import { RouteScene, type SceneOptions } from "@/lib/geo/scene";

interface Props {
  trips: SceneTrip[];
  label: string;
  className?: string;
  interactiveStops?: boolean;
  onSelect?: (key: string) => void;
  /** Receives the scene once it exists (and null when it is destroyed). */
  onScene?: (scene: RouteScene | null) => void;
  /** Called after the land has loaded and the scene has a size. */
  onReady?: (scene: RouteScene) => void;
  /** Called after the map was resized (views in pixels need recomputing). */
  onResize?: (scene: RouteScene) => void;
  padding?: number;
}

/**
 * Mounts the shared map engine into an SVG. The scene is imperative: animations drive it
 * through the handle passed to `onScene`, outside React rendering.
 */
export function RouteMap({
  trips,
  label,
  className,
  interactiveStops,
  onSelect,
  onScene,
  onReady,
  onResize,
  padding,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const callbacks = useRef({ onSelect, onScene, onReady, onResize });

  useEffect(() => {
    callbacks.current = { onSelect, onScene, onReady, onResize };
  });

  useEffect(() => {
    const element = svg.current;

    if (element === null) {
      return;
    }

    const options: SceneOptions = {
      idPrefix: `map${id}`,
      padding,
      interactiveStops,
      onSelect: callbacks.current.onSelect ? (key) => callbacks.current.onSelect?.(key) : undefined,
    };
    const scene = new RouteScene(element, trips, options);
    const box = element.getBoundingClientRect();
    scene.resize(box.width, box.height);
    callbacks.current.onScene?.(scene);

    let cancelled = false;
    loadLand()
      .then((land) => {
        if (!cancelled) {
          scene.setLand(land);
          callbacks.current.onReady?.(scene);
        }
      })
      .catch((error: unknown) => console.error("Map data could not be loaded", error));

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = scene.size;
      scene.resize(entry.contentRect.width, entry.contentRect.height);

      if (width !== scene.size.width || height !== scene.size.height) {
        callbacks.current.onResize?.(scene);
      }
    });
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      callbacks.current.onScene?.(null);
      scene.destroy();
    };
  }, [trips, id, padding, interactiveStops]);

  // A map with focusable routes or stops is a group; a picture-only map is an image.
  const interactive = Boolean(onSelect) || Boolean(interactiveStops);

  return (
    <svg ref={svg} className={className} role={interactive ? "group" : "img"} aria-label={label} />
  );
}
