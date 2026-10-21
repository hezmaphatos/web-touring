import { TransitionLink } from "@/components/Transition/TransitionLink";
import { CHAPTER_COLORS, formatKm } from "@/lib/format";
import type { TripSummary } from "@/lib/types";
import styles from "./Ledger.module.css";

/**
 * The trips ledger: one full-width ruled row per trip, newest first.
 * Rows are plain text; on hover the row takes the trip's chapter color.
 */
export function Ledger({ trips }: { trips: TripSummary[] }) {
  return (
    <ol className={styles.ledger}>
      {trips.map((trip) => (
        <li key={trip.slug} className={styles.item} data-type={trip.type}>
          <TransitionLink
            href={`/trip/${trip.slug}`}
            color={CHAPTER_COLORS[trip.type]}
            className={styles.row}
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
        </li>
      ))}
    </ol>
  );
}
