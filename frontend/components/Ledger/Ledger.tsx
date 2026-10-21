"use client";

import { useRef, useState, type MouseEvent } from "react";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { TripImage } from "@/components/TripImage/TripImage";
import { CHAPTER_COLORS, formatKm } from "@/lib/format";
import { useLowEnd, useReducedMotion, useTouch } from "@/lib/motion/hooks";
import type { TripSummary } from "@/lib/types";
import { LedgerPreview } from "./LedgerPreview";
import styles from "./Ledger.module.css";

interface Props {
  trips: TripSummary[];
  /** Cursor-following WebGL cover preview (the /trip page only). */
  preview?: boolean;
}

/**
 * The trips ledger: one full-width ruled row per trip, newest first.
 * Rows are plain text; on hover the row takes the trip's chapter color and, on capable
 * desktops, a distorted cover preview follows the cursor. On touch and low-end devices a tap
 * opens the row inline with the cover and a "Buka cerita" link instead.
 */
export function Ledger({ trips, preview = false }: Props) {
  const list = useRef<HTMLOListElement>(null);
  const touch = useTouch();
  const lowEnd = useLowEnd();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const expandable = touch || lowEnd;
  const webgl = preview && !touch && !lowEnd && !reduced;

  function toggle(event: MouseEvent<HTMLAnchorElement>, slug: string) {
    if (expandable) {
      event.preventDefault();
      setOpen((current) => (current === slug ? null : slug));
    }
  }

  return (
    <>
      <ol ref={list} className={styles.ledger}>
        {trips.map((trip) => {
          const isOpen = expandable && open === trip.slug;
          const panelId = `trip-${trip.slug}-buka`;

          return (
            <li key={trip.slug} className={styles.item} data-type={trip.type} data-slug={trip.slug}>
              <TransitionLink
                href={`/trip/${trip.slug}`}
                color={CHAPTER_COLORS[trip.type]}
                className={styles.row}
                onClick={(event) => toggle(event, trip.slug)}
                aria-expanded={expandable ? isOpen : undefined}
                aria-controls={expandable ? panelId : undefined}
              >
                <span className={styles.number}>
                  <span className="visually-hidden">Trip ke-</span>
                  {trip.number}
                </span>
                <span className={styles.title} data-flex-width>
                  {trip.title}
                </span>
                <span className={styles.year}>
                  {trip.year ?? <span className="visually-hidden">Tanggal belum diisi</span>}
                </span>
                <span className={styles.km}>
                  {trip.distance_km !== null && (
                    <>
                      {formatKm(trip.distance_km)}
                      <span className={styles.unit}> km</span>
                    </>
                  )}
                </span>
              </TransitionLink>
              {isOpen && (
                <div id={panelId} className={styles.expanded} data-chapter={trip.type}>
                  {trip.cover && (
                    <TripImage image={trip.cover} sizes="100vw" className={styles.expandedImage} />
                  )}
                  <div className={styles.expandedBody}>
                    {trip.summary && <p className={styles.summary}>{trip.summary}</p>}
                    <TransitionLink
                      href={`/trip/${trip.slug}`}
                      color={CHAPTER_COLORS[trip.type]}
                      className={styles.openLink}
                    >
                      Buka cerita
                    </TransitionLink>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {webgl && <LedgerPreview list={list} trips={trips} />}
    </>
  );
}
