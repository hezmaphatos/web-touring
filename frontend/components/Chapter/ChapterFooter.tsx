import { TransitionLink } from "@/components/Transition/TransitionLink";
import { GHOST_HEIGHT, GHOST_WIDTH } from "@/lib/geo/ghost";
import type { TripLink } from "@/lib/types";
import type { Ghosts } from "./Chapter";
import styles from "./Chapter.module.css";

interface Props {
  prev: TripLink | null;
  next: TripLink | null;
  ghosts: Ghosts;
}

/** Previous and next trip as huge text links, each with a ghost of its route behind. */
export function ChapterFooter({ prev, next, ghosts }: Props) {
  if (prev === null && next === null) {
    return null;
  }

  return (
    <nav aria-label="Trip lain" className={styles.neighbours}>
      {prev && <Neighbour link={prev} label="Trip sebelumnya" ghost={ghosts.prev} />}
      {next && <Neighbour link={next} label="Trip berikutnya" ghost={ghosts.next} />}
    </nav>
  );
}

function Neighbour({
  link,
  label,
  ghost,
}: {
  link: TripLink;
  label: string;
  ghost: string | null;
}) {
  return (
    <TransitionLink href={`/trip/${link.slug}`} className={styles.neighbour}>
      {ghost && (
        <svg
          className={styles.ghost}
          viewBox={`0 0 ${GHOST_WIDTH} ${GHOST_HEIGHT}`}
          preserveAspectRatio="xMaxYMid meet"
          aria-hidden="true"
        >
          <path d={ghost} />
        </svg>
      )}
      <span className={styles.neighbourLabel}>{label}</span>
      <span className={styles.neighbourTitle}>{link.title}</span>
    </TransitionLink>
  );
}
