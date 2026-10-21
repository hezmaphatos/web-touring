import type { Metadata } from "next";
import styles from "@/components/NextRide/NextRide.module.css";
import { NextRideMap } from "@/components/NextRide/NextRideMap";
import { getNextRides } from "@/lib/api";
import { TYPE_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Next ride",
  description: "Trip yang sedang direncanakan, kapan, dan kenapa.",
};

export default async function NextRidePage() {
  const planned = await getNextRides();

  return (
    <>
      <header className={`wrap ${styles.head}`}>
        <h1 className={styles.heading}>Next ride</h1>
        <p className={styles.count}>
          {planned.length === 0 ? "Belum ada rencana trip." : `${planned.length} rencana`}
        </p>
      </header>

      {planned.length > 0 && (
        <>
          <NextRideMap trips={planned} />
          <ol className={styles.list}>
            {planned.map((trip) => (
              <li key={trip.slug} className={styles.item}>
                <div className="wrap">
                  <p className={styles.meta}>Rencana, {TYPE_LABELS[trip.type].toLowerCase()}</p>
                  <h2 className={styles.title}>{trip.title}</h2>
                  {trip.planned_for && <p className={styles.when}>{trip.planned_for}</p>}
                  {trip.note_html && (
                    <div
                      className={styles.note}
                      dangerouslySetInnerHTML={{ __html: trip.note_html }}
                    />
                  )}
                  {trip.stops.length > 0 && (
                    <p className={styles.stops}>
                      Lewat {trip.stops.map((stop) => stop.name).join(", ")}.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
