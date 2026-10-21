import type { Metadata } from "next";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Halaman tidak ada",
};

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.band} aria-hidden="true" />
      <div className={`wrap ${styles.body}`}>
        <h1 className={styles.heading}>Jalan ditutup</h1>
        <p className={styles.text}>
          Halaman ini nggak ada. Mungkin link-nya salah atau trip-nya belum dipublikasikan.
        </p>
        <Link href="/trip" className={styles.link}>
          Kembali ke daftar trip
        </Link>
      </div>
      <div className={styles.band} aria-hidden="true" />
    </div>
  );
}
