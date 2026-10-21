import type { Metadata } from "next";
import Link from "next/link";
import { Ledger } from "@/components/Ledger/Ledger";
import { LedgerFilters } from "@/components/Ledger/LedgerFilters";
import styles from "@/components/Ledger/Ledger.module.css";
import { getTrips } from "@/lib/api";
import { applyFilter, parseFilter } from "@/lib/filters";
import { formatKm } from "@/lib/format";

export const metadata: Metadata = {
  title: "Trip",
  description: "Semua trip motor, dari yang terbaru.",
};

export default async function TripsPage({ searchParams }: PageProps<"/trip">) {
  const trips = await getTrips();
  const filter = parseFilter(await searchParams);
  const shown = applyFilter(trips, filter).reverse();
  const totalKm = trips.reduce((sum, trip) => sum + (trip.distance_km ?? 0), 0);
  const years = [...new Set(trips.map((trip) => trip.year).filter((year) => year !== null))].sort(
    (a, b) => b - a,
  );

  return (
    <>
      <header className={`wrap ${styles.head}`}>
        <h1 className={styles.heading}>Trip</h1>
        <p className={styles.count}>
          {trips.length} trip{totalKm > 0 && `, ${formatKm(totalKm)} km`}
        </p>
      </header>

      {trips.length === 0 ? (
        <div className={`wrap ${styles.empty}`}>
          <p>Belum ada trip yang dipublikasikan. Tambah trip pertama lewat halaman admin.</p>
        </div>
      ) : (
        <>
          <LedgerFilters years={years} filter={filter} />
          {shown.length > 0 ? (
            <Ledger trips={shown} preview />
          ) : (
            <div className={`wrap ${styles.empty}`}>
              <p>Tidak ada trip yang cocok dengan saringan ini.</p>
              <Link href="/trip" scroll={false}>
                Lihat semua trip
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
