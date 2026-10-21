import type { Metadata } from "next";
import Link from "next/link";
import { Ledger } from "@/components/Ledger/Ledger";
import { PetaExplorer } from "@/components/Peta/PetaExplorer";
import styles from "@/components/Peta/Peta.module.css";
import { getMap } from "@/lib/api";

export const metadata: Metadata = {
  title: "Peta",
  description: "Semua rute trip di satu peta.",
};

export default async function PetaPage() {
  const trips = await getMap();
  const published = trips.filter((trip) => trip.status === "published");
  const planned = trips.filter((trip) => trip.status === "planned");

  return (
    <>
      <h1 className="visually-hidden">Peta</h1>
      <PetaExplorer trips={trips} />

      <section aria-labelledby="daftar-trip">
        <div className={`wrap ${styles.listHead}`}>
          <h2 id="daftar-trip" className={styles.listHeading}>
            Daftar trip
          </h2>
          <p className={styles.hint}>
            Geser peta untuk berpindah, Ctrl atau ⌘ dengan gulir (atau tombol + dan −) untuk zoom.
            Rute tanpa GPX ditarik lewat titik singgah, jadi bentuknya perkiraan.
          </p>
        </div>
        <Ledger trips={[...published].reverse()} />
        {planned.length > 0 && (
          <div className={`wrap ${styles.planned}`}>
            <h3>Rencana</h3>
            <ul>
              {planned.map((trip) => (
                <li key={trip.slug}>
                  <Link href="/next-ride">{trip.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
