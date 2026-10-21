import type { CSSProperties } from "react";
import type { ImageData } from "@/lib/types";
import styles from "./TripImage.module.css";

interface Props {
  image: ImageData;
  /** `sizes` attribute for the srcset, e.g. "(min-width: 1024px) 66vw, 100vw". */
  sizes: string;
  /** Above-the-fold images load eagerly with high priority. */
  priority?: boolean;
  className?: string;
}

/**
 * Pre-generated variants (AVIF and WebP) with explicit dimensions and a pixel LQIP
 * behind the image, so nothing shifts while it loads.
 */
export function TripImage({ image, sizes, priority = false, className }: Props) {
  const style: CSSProperties | undefined = image.placeholder
    ? { backgroundImage: `url(${image.placeholder})` }
    : undefined;

  return (
    <picture className={`${styles.picture} ${className ?? ""}`} style={style}>
      {image.avif_srcset && <source type="image/avif" srcSet={image.avif_srcset} sizes={sizes} />}
      <img
        className={styles.image}
        src={image.src}
        srcSet={image.srcset}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </picture>
  );
}
