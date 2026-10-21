import { TripImage } from "@/components/TripImage/TripImage";
import type { Photo, Video } from "@/lib/types";
import { YouTubeFacade } from "./YouTubeFacade";
import styles from "./Chapter.module.css";

/** Where a photo sits in the flow, decided by its aspect ratio and running position. */
export type PhotoPlacement = "bleed" | "wideLeft" | "wideRight" | "portraitLeft" | "portraitRight";

export interface PlacedPhoto {
  photo: Photo;
  placement: PhotoPlacement;
}

const SIZES: Record<PhotoPlacement, string> = {
  bleed: "100vw",
  wideLeft: "(min-width: 768px) 66vw, 100vw",
  wideRight: "(min-width: 768px) 66vw, 100vw",
  portraitLeft: "(min-width: 768px) 42vw, 100vw",
  portraitRight: "(min-width: 768px) 42vw, 100vw",
};

/**
 * Layout rule: landscape photos cycle full-bleed, 8 columns left, 8 columns right;
 * portrait photos take 5 columns, alternating left and right, with the caption beside them.
 * The counters run across the whole chapter so the rhythm continues between stops.
 */
export function placePhotos(
  photos: Photo[],
  counters = { landscape: 0, portrait: 0 },
): PlacedPhoto[] {
  return photos.map((photo) => {
    if (photo.image.width >= photo.image.height) {
      const step = counters.landscape++ % 3;
      return { photo, placement: step === 0 ? "bleed" : step === 1 ? "wideLeft" : "wideRight" };
    }

    const step = counters.portrait++ % 2;
    return { photo, placement: step === 0 ? "portraitLeft" : "portraitRight" };
  });
}

export function MediaFlow({ photos, videos }: { photos: PlacedPhoto[]; videos: Video[] }) {
  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className={styles.media}>
      {photos.map(({ photo, placement }) =>
        placement === "bleed" ? (
          <figure key={photo.id} className={styles.bleed}>
            <TripImage image={photo.image} sizes={SIZES[placement]} />
            {photo.caption && (
              <figcaption className={`${styles.caption} ${styles.bleedCaption}`}>
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          <div key={photo.id} className="wrap">
            <figure className={`${styles.placed} ${styles[placement]}`}>
              <TripImage
                image={photo.image}
                sizes={SIZES[placement]}
                className={styles.placedImage}
              />
              {photo.caption && <figcaption className={styles.caption}>{photo.caption}</figcaption>}
            </figure>
          </div>
        ),
      )}
      {videos.map((video) => (
        <div key={video.id} className={`wrap ${styles.videoRow}`}>
          <YouTubeFacade id={video.youtube_id} title={video.title} />
        </div>
      ))}
    </div>
  );
}
