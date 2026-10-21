import type { Metadata } from "next";
import { GarageSheet } from "@/components/Garage/GarageSheet";
import { GarageTable } from "@/components/Garage/GarageTable";
import styles from "@/components/Garage/Garage.module.css";
import { getGarage } from "@/lib/api";
import { loadSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Garage",
  description: "Motornya dan semua modifikasi yang terpasang.",
};

export default async function GaragePage() {
  const [site, items] = await Promise.all([loadSite(), getGarage()]);
  const bikeName = site.bike.name ?? "Motor";
  const spotted = items.filter((item) => item.hotspot !== null).length;

  return (
    <>
      <header className={`wrap ${styles.head}`}>
        <h1 className={styles.heading}>{bikeName}</h1>
        <p className={styles.count}>
          {items.length} modifikasi
          {site.bike.photo && spotted > 0 && `, ${spotted} ditandai di foto`}
        </p>
      </header>

      <div className="wrap">
        {site.bike.photo ? (
          <GarageSheet photo={site.bike.photo} items={items} />
        ) : (
          <p className={styles.noPhoto}>
            Foto motor belum diunggah. Tambahkan lewat Pengaturan di admin.
          </p>
        )}
      </div>

      <section className={`wrap ${styles.list}`} aria-labelledby="daftar-modifikasi">
        <h2 id="daftar-modifikasi" className={styles.listHeading}>
          Semua modifikasi
        </h2>
        {items.length > 0 ? (
          <GarageTable items={items} />
        ) : (
          <p className={styles.empty}>Belum ada modifikasi yang dicatat.</p>
        )}
      </section>
    </>
  );
}
