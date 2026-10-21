import { emWidth } from "@/lib/fit/measure";
import { durationDays, formatDateRange, formatKm, formatNumber } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { FitText } from "./FitText";
import styles from "./Chapter.module.css";

/** Must match `.titleLine` letter-spacing. */
const TITLE_TRACKING_EM = -0.02;

export function TitleBlock({ trip }: { trip: Trip }) {
  const title = trip.title.toLocaleUpperCase("id-ID");
  const dates = formatDateRange(trip.started_at, trip.ended_at);
  const days = durationDays(trip.started_at, trip.ended_at);
  // Units are the labels: "612 km", "2.093 m", "3 hari". Empty values are left out.
  const facts: { label: string; value: string; unit: string | null }[] = [];

  if (dates !== null) {
    facts.push({ label: "Tanggal", value: dates, unit: null });
  }

  if (trip.distance_km !== null) {
    facts.push({ label: "Jarak", value: formatKm(trip.distance_km), unit: "km" });
  }

  if (trip.max_elevation_m !== null) {
    facts.push({ label: "Titik tertinggi", value: formatNumber(trip.max_elevation_m), unit: "m" });
  }

  if (days !== null) {
    facts.push({ label: "Lama perjalanan", value: String(days), unit: "hari" });
  }

  return (
    <header>
      <div className={styles.titleBlock} data-chapter={trip.type} data-surface="dark">
        <div className={`wrap ${styles.titleInner}`}>
          <p className={styles.tripNumber}>Trip ke-{trip.number}</p>
          <h1 className={styles.title}>
            <FitText className={styles.titleLine} em={emWidth(title, TITLE_TRACKING_EM)}>
              {title}
            </FitText>
          </h1>
        </div>
      </div>

      {facts.length > 0 && (
        <dl className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.fact}>
              <dt className="visually-hidden">{fact.label}</dt>
              <dd>
                {fact.value}
                {fact.unit && <span className={styles.unit}> {fact.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
