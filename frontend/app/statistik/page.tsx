import type { Metadata } from "next";
import styles from "@/components/Stats/Stats.module.css";
import { YearBars } from "@/components/Stats/YearBars";
import { getStats } from "@/lib/api";
import { formatKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Statistik",
  description: "Total kilometer, trip, hari di jalan, dan angka lain dari semua perjalanan.",
};

export default async function StatsPage() {
  const stats = await getStats();
  const facts = [
    { value: formatKm(stats.total_km), label: "kilometer ditempuh" },
    { value: formatNumber(stats.trips), label: "trip" },
    { value: formatNumber(stats.days_on_road), label: "hari di jalan" },
    {
      value: stats.highest_point_m === null ? "–" : formatNumber(stats.highest_point_m),
      label: "meter, titik tertinggi",
    },
    { value: formatNumber(stats.provinces_visited), label: "provinsi disinggahi" },
    { value: formatNumber(stats.photos), label: "foto" },
    { value: formatNumber(stats.videos), label: "video" },
  ];

  return (
    <>
      <header className={`wrap ${styles.head}`}>
        <h1 className={styles.heading}>Statistik</h1>
      </header>

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt className={styles.label}>{fact.label}</dt>
            <dd className={styles.value}>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <section className={`wrap ${styles.years}`} aria-labelledby="km-per-tahun">
        <h2 id="km-per-tahun" className={styles.yearsHeading}>
          Kilometer per tahun
        </h2>
        {stats.km_per_year.length > 0 ? (
          <YearBars years={stats.km_per_year} />
        ) : (
          <p className={styles.empty}>
            Belum ada trip bertanggal. Isi tanggal trip di admin untuk melihat angka per tahun.
          </p>
        )}
      </section>
    </>
  );
}
