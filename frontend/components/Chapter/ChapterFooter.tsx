import { TransitionLink } from "@/components/Transition/TransitionLink";
import type { TripLink } from "@/lib/types";
import styles from "./Chapter.module.css";

/** Previous and next trip as huge text links. */
export function ChapterFooter({ prev, next }: { prev: TripLink | null; next: TripLink | null }) {
  if (prev === null && next === null) {
    return null;
  }

  return (
    <nav aria-label="Trip lain" className={styles.neighbours}>
      {prev && (
        <TransitionLink href={`/trip/${prev.slug}`} className={styles.neighbour}>
          <span className={styles.neighbourLabel}>Trip sebelumnya</span>
          <span className={styles.neighbourTitle}>{prev.title}</span>
        </TransitionLink>
      )}
      {next && (
        <TransitionLink href={`/trip/${next.slug}`} className={styles.neighbour}>
          <span className={styles.neighbourLabel}>Trip berikutnya</span>
          <span className={styles.neighbourTitle}>{next.title}</span>
        </TransitionLink>
      )}
    </nav>
  );
}
