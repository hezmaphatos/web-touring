"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { RouteMap } from "@/components/RouteMap/RouteMap";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { TripImage } from "@/components/TripImage/TripImage";
import { toSceneTrip } from "@/lib/geo/route";
import type { RouteScene } from "@/lib/geo/scene";
import { CHAPTER_COLORS, formatKm, TYPE_LABELS } from "@/lib/format";
import type { MapTrip } from "@/lib/types";
import styles from "./Peta.module.css";

interface ZoomControls {
  zoomBy: (factor: number) => void;
  reset: () => void;
}

/** Published trips draw up to the scrubber position: trip k is drawn by (position - k). */
function applyPosition(scene: RouteScene, published: MapTrip[], position: number) {
  published.forEach((trip, index) => scene.setProgress(trip.slug, position - index));
}

/**
 * Full-viewport map of every route. Drag pans, Ctrl/⌘ + wheel or the buttons zoom, two
 * fingers pan and zoom on touch. The year scrubber reveals routes in order; clicking a route
 * opens its sheet and paints it in the chapter color.
 */
export function PetaExplorer({ trips }: { trips: MapTrip[] }) {
  const sceneTrips = useMemo(() => trips.map(toSceneTrip), [trips]);
  const published = useMemo(() => trips.filter((trip) => trip.status === "published"), [trips]);
  const [position, setPosition] = useState(published.length);
  const [selected, setSelected] = useState<string | null>(null);
  const scene = useRef<RouteScene | null>(null);
  const zoom = useRef<ZoomControls | null>(null);
  const latest = useRef({ position, selected });
  const sheetHeading = useRef<HTMLHeadingElement>(null);
  const scrubberId = useId();

  useEffect(() => {
    latest.current = { position, selected };
    const current = scene.current;

    if (current !== null) {
      applyPosition(current, published, position);
      current.select(selected);
    }
  }, [position, selected, published]);

  useEffect(() => {
    if (selected !== null) {
      sheetHeading.current?.focus();
    }
  }, [selected]);

  useEffect(() => {
    if (selected === null) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const handleScene = useCallback(
    (created: RouteScene | null) => {
      scene.current = created;
      zoom.current = null;

      if (created === null) {
        return;
      }

      applyPosition(created, published, latest.current.position);
      created.select(latest.current.selected);

      // d3-zoom is only needed here, so it loads with this page.
      void Promise.all([import("d3-zoom"), import("d3-selection")]).then(
        ([{ zoom: createZoom, zoomIdentity }, { select }]) => {
          if (scene.current !== created) {
            return;
          }

          const behavior = createZoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 14])
            .filter((event: Event) => {
              if (event.type === "touchstart") {
                return (event as TouchEvent).touches.length > 1;
              }
              if (event.type === "wheel") {
                const wheel = event as WheelEvent;
                return wheel.ctrlKey || wheel.metaKey;
              }
              return !(event as MouseEvent).button;
            })
            .on("zoom", (event: { transform: { k: number; x: number; y: number } }) => {
              const { k, x, y } = event.transform;
              created.setView({ k, x, y });
            });

          const selection = select(created.element).call(behavior).style("touch-action", "pan-y");

          zoom.current = {
            zoomBy: (factor) => behavior.scaleBy(selection, factor),
            reset: () => behavior.transform(selection, zoomIdentity),
          };
        },
      );
    },
    [published],
  );

  const handleResize = useCallback(() => zoom.current?.reset(), []);

  const trip = trips.find((item) => item.slug === selected) ?? null;
  const shown = Math.min(Math.floor(position), published.length);
  const current = published[Math.max(Math.ceil(position) - 1, 0)];
  const reading =
    published.length === 0
      ? "Belum ada trip"
      : shown === published.length
        ? "Semua trip"
        : current?.year
          ? `Sampai ${current.year}`
          : `${shown} trip`;

  return (
    <div className={styles.explorer}>
      <div className={styles.stage}>
        <RouteMap
          className={styles.map}
          trips={sceneTrips}
          label="Peta semua rute. Pilih rute untuk melihat ringkasannya."
          onSelect={setSelected}
          onScene={handleScene}
          onResize={handleResize}
          interactiveStops
          padding={48}
        />

        <div className={styles.zoom}>
          <button
            type="button"
            onClick={() => zoom.current?.zoomBy(1.6)}
            aria-label="Perbesar peta"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoom.current?.zoomBy(1 / 1.6)}
            aria-label="Perkecil peta"
          >
            −
          </button>
          <button type="button" onClick={() => zoom.current?.reset()} className={styles.reset}>
            Semua
          </button>
        </div>

        {published.length > 1 && (
          <div className={styles.scrubber}>
            <label htmlFor={scrubberId} className={styles.reading}>
              {reading}
            </label>
            <input
              id={scrubberId}
              type="range"
              min={0}
              max={published.length}
              step={0.01}
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              aria-valuetext={`${reading}, ${shown} dari ${published.length} trip`}
              className={styles.range}
            />
            <ol className={styles.ticks} aria-hidden="true">
              {published.map((item, index) =>
                item.year !== null && item.year !== published[index - 1]?.year ? (
                  <li key={item.slug} style={{ left: `${(index / published.length) * 100}%` }}>
                    {item.year}
                  </li>
                ) : null,
              )}
            </ol>
          </div>
        )}

        {trip && (
          <section className={styles.sheet} aria-labelledby="peta-trip" data-surface="light">
            <button type="button" className={styles.close} onClick={() => setSelected(null)}>
              Tutup
            </button>
            {trip.cover && <TripImage image={trip.cover} sizes="(min-width: 900px) 400px, 100vw" />}
            <div className={styles.sheetBody}>
              <p className={styles.sheetMeta}>
                {trip.number !== null ? `Trip ke-${trip.number}` : "Rencana"},{" "}
                {TYPE_LABELS[trip.type].toLowerCase()}
              </p>
              <h2 id="peta-trip" ref={sheetHeading} tabIndex={-1} className={styles.sheetTitle}>
                {trip.title}
              </h2>
              {trip.distance_km !== null && (
                <p className={styles.sheetKm}>
                  {formatKm(trip.distance_km)}
                  <span> km</span>
                </p>
              )}
              {trip.status === "planned" ? (
                <TransitionLink href="/next-ride" className={styles.open}>
                  Lihat rencana
                </TransitionLink>
              ) : (
                <TransitionLink
                  href={`/trip/${trip.slug}`}
                  color={CHAPTER_COLORS[trip.type]}
                  className={styles.open}
                >
                  Buka cerita
                </TransitionLink>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
