import { FitText } from "@/components/Chapter/FitText";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { TripImage } from "@/components/TripImage/TripImage";
import { emWidth } from "@/lib/fit/measure";
import { CHAPTER_COLORS } from "@/lib/format";
import type { TripSummary } from "@/lib/types";
import styles from "./Home.module.css";

/** The newest trip: full-bleed cover with its title set huge on the chapter color. */
export function LatestTrip({ trip }: { trip: TripSummary }) {
  const title = trip.title.toLocaleUpperCase("id-ID");

  return (
    <section className={styles.latest} aria-labelledby="trip-terbaru">
      <TransitionLink
        href={`/trip/${trip.slug}`}
        color={CHAPTER_COLORS[trip.type]}
        className={styles.latestLink}
      >
        {trip.cover && <TripImage image={trip.cover} sizes="100vw" />}
        <div className={styles.latestBand} data-chapter={trip.type} data-surface="dark">
          <div className="wrap">
            <p className={styles.latestLabel}>Trip terbaru, ke-{trip.number}</p>
            <h2 id="trip-terbaru" className={styles.latestTitle}>
              <FitText className={styles.latestLine} em={emWidth(title, -0.02)}>
                {title}
              </FitText>
            </h2>
          </div>
        </div>
      </TransitionLink>
    </section>
  );
}
