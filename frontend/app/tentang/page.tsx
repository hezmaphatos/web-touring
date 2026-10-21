import type { Metadata } from "next";
import { TransitionLink } from "@/components/Transition/TransitionLink";
import { TripImage } from "@/components/TripImage/TripImage";
import { loadSite } from "@/lib/site";
import styles from "./tentang.module.css";

export const metadata: Metadata = {
  title: "Tentang",
  description: "Siapa yang menulis catatan perjalanan ini, dan motornya.",
};

export default async function AboutPage() {
  const site = await loadSite();

  return (
    <article className={`wrap ${styles.page}`}>
      <h1 className={styles.heading}>Tentang</h1>

      <div className={styles.body}>
        {site.portrait && (
          <div className={styles.portrait}>
            <TripImage image={site.portrait} sizes="(min-width: 768px) 40vw, 100vw" priority />
          </div>
        )}

        <div className={styles.text}>
          {site.about_html ? (
            <div className={styles.prose} dangerouslySetInnerHTML={{ __html: site.about_html }} />
          ) : (
            <p className={styles.prose}>Cerita tentang aku belum ditulis.</p>
          )}

          <dl className={styles.facts}>
            {site.bike.name && (
              <div>
                <dt>Motor</dt>
                <dd>
                  <TransitionLink href="/garage">{site.bike.name}</TransitionLink>
                </dd>
              </div>
            )}
            {site.links.youtube && (
              <div>
                <dt>YouTube</dt>
                <dd>
                  <a href={site.links.youtube} rel="me noopener" target="_blank">
                    Tonton videonya
                  </a>
                </dd>
              </div>
            )}
            {site.links.instagram && (
              <div>
                <dt>Instagram</dt>
                <dd>
                  <a href={site.links.instagram} rel="me noopener" target="_blank">
                    Lihat fotonya
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </article>
  );
}
