"use client";

import { useState } from "react";
import styles from "./Chapter.module.css";

const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Click-to-load YouTube: a thumbnail first, the youtube-nocookie iframe only after a click.
 * Never autoplays on page load; playback starts from the visitor's click.
 */
export function YouTubeFacade({ id, title }: { id: string; title: string | null }) {
  const [playing, setPlaying] = useState(false);

  if (!ID_PATTERN.test(id)) {
    return null;
  }

  const label = title ?? "Video YouTube";

  return (
    <figure className={styles.video}>
      <div className={styles.videoFrame}>
        {playing ? (
          <iframe
            className={styles.videoEmbed}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.videoButton}
            onClick={() => setPlaying(true)}
            aria-label={`Putar video: ${label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
            <img
              className={styles.videoThumb}
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
            />
            <span className={styles.play} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28">
                <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {title && <figcaption className={styles.caption}>{title}</figcaption>}
    </figure>
  );
}
