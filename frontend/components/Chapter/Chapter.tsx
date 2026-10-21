import { TripImage } from "@/components/TripImage/TripImage";
import type { Photo, Trip, Video } from "@/lib/types";
import { ChapterFooter } from "./ChapterFooter";
import { KmMarker } from "./KmMarker";
import { MediaFlow, placePhotos } from "./MediaFlow";
import { TitleBlock } from "./TitleBlock";
import styles from "./Chapter.module.css";

function byStop<T extends { stop_id: number | null }>(items: T[], stopIds: Set<number>) {
  const attached = new Map<number, T[]>();
  const loose: T[] = [];

  for (const item of items) {
    if (item.stop_id !== null && stopIds.has(item.stop_id)) {
      attached.set(item.stop_id, [...(attached.get(item.stop_id) ?? []), item]);
    } else {
      loose.push(item);
    }
  }

  return { attached, loose };
}

/**
 * A trip chapter: title block, cover, story with a kilometer post per stop, the stop's
 * photos and videos after its text, the pull quote halfway, then everything unattached.
 */
export function Chapter({ trip }: { trip: Trip }) {
  const stopIds = new Set(trip.stops.map((stop) => stop.id));
  const photos = byStop<Photo>(trip.photos, stopIds);
  const videos = byStop<Video>(trip.videos, stopIds);
  const counters = { landscape: 0, portrait: 0 };
  const quoteAfter = trip.stops.length === 0 ? -1 : Math.ceil(trip.stops.length / 2) - 1;

  const stopSections = trip.stops.map((stop, index) => ({
    stop,
    photos: placePhotos(photos.attached.get(stop.id) ?? [], counters),
    videos: videos.attached.get(stop.id) ?? [],
    quote: index === quoteAfter,
  }));
  const loosePhotos = placePhotos(photos.loose, counters);

  const pullQuote = trip.pull_quote && (
    <blockquote className={styles.quote} data-chapter={trip.type} data-surface="dark">
      <p className="wrap" data-flex-width>
        {trip.pull_quote}
      </p>
    </blockquote>
  );

  return (
    <article className={styles.chapter}>
      <TitleBlock trip={trip} />

      {trip.cover &&
        (trip.cover.width >= trip.cover.height ? (
          <div className={styles.cover}>
            <TripImage image={trip.cover} sizes="100vw" priority />
          </div>
        ) : (
          <div className={`wrap ${styles.coverPortrait}`}>
            <TripImage image={trip.cover} sizes="(min-width: 768px) 58vw, 100vw" priority />
          </div>
        ))}

      <div className={styles.story}>
        {trip.description_html && (
          <div className="wrap">
            <div
              className={styles.prose}
              dangerouslySetInnerHTML={{ __html: trip.description_html }}
            />
          </div>
        )}

        {quoteAfter === -1 && pullQuote}

        {stopSections.map((section, index) => (
          <section
            key={section.stop.id}
            className={styles.stop}
            aria-labelledby={`titik-${section.stop.id}`}
          >
            <div className="wrap">
              <KmMarker stop={section.stop} order={index + 1} type={trip.type} />
              {section.stop.note_html && (
                <div
                  className={styles.prose}
                  dangerouslySetInnerHTML={{ __html: section.stop.note_html }}
                />
              )}
            </div>
            <MediaFlow photos={section.photos} videos={section.videos} />
            {section.quote && pullQuote}
          </section>
        ))}

        <MediaFlow photos={loosePhotos} videos={videos.loose} />
      </div>

      <ChapterFooter prev={trip.prev} next={trip.next} />
    </article>
  );
}
