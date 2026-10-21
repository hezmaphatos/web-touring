import type { Site } from "@/lib/types";
import styles from "./Footer.module.css";

export function Footer({ site }: { site: Site }) {
  return (
    <footer className={styles.footer} data-surface="dark">
      <div className={`wrap ${styles.inner}`}>
        <p className={styles.name}>{site.site_name}</p>
        {(site.links.youtube || site.links.instagram) && (
          <ul className={styles.links}>
            {site.links.youtube && (
              <li>
                <a href={site.links.youtube} rel="me noopener" target="_blank">
                  YouTube
                </a>
              </li>
            )}
            {site.links.instagram && (
              <li>
                <a href={site.links.instagram} rel="me noopener" target="_blank">
                  Instagram
                </a>
              </li>
            )}
          </ul>
        )}
        <p className={styles.note}>
          Peta dasar dari Natural Earth. Tanpa GPX, rute digambar lewat titik singgah, jadi
          bentuknya perkiraan.
        </p>
      </div>
    </footer>
  );
}
