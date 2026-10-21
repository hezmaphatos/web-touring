import { formatKm } from "@/lib/format";
import type { Stop, TripType } from "@/lib/types";
import styles from "./Chapter.module.css";

interface Props {
  stop: Stop;
  /** Position of the stop along the route, starting at 1. */
  order: number;
  type: TripType;
}

/**
 * A stop opens with a kilometer post (patok KM): a tall white post with a cap in the
 * chapter color, showing the cumulative distance. The stop name sits beside it.
 */
export function KmMarker({ stop, order, type }: Props) {
  return (
    <div className={styles.marker}>
      <div className={styles.post} aria-hidden="true">
        <span className={styles.postCap} data-chapter={type}>
          {order}
        </span>
        <span className={styles.postBody}>
          <span className={styles.postKm}>
            {stop.km_marker === null ? "–" : formatKm(stop.km_marker)}
          </span>
          <span className={styles.postUnit}>km</span>
        </span>
      </div>
      <div className={styles.markerText}>
        <h2 id={`titik-${stop.id}`} className={styles.stopName} data-flex-width>
          {stop.name}
        </h2>
        <p className={styles.stopMeta}>
          {stop.km_marker !== null && <>Kilometer {formatKm(stop.km_marker)}</>}
          {stop.km_marker !== null && stop.province && ", "}
          {stop.province}
        </p>
      </div>
    </div>
  );
}
