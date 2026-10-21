"use client";

import { useEffect, useId, useRef, useState } from "react";
import { TripImage } from "@/components/TripImage/TripImage";
import { formatDateRange } from "@/lib/format";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/hooks";
import type { GarageItem, ImageData } from "@/lib/types";
import styles from "./Garage.module.css";

interface Props {
  photo: ImageData;
  items: GarageItem[];
}

/**
 * The bike as a spec sheet: yellow squares sit on the photo where each modification is;
 * opening one reveals its part, category, install date and note beside it.
 */
export function GarageSheet({ photo, items }: Props) {
  const spotted = items.filter((item) => item.hotspot !== null);
  const [openId, setOpenId] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<number, HTMLButtonElement>());
  const reduced = useReducedMotion();
  const panelId = useId();
  const item = spotted.find((candidate) => candidate.id === openId) ?? null;

  // The detail opens with a height reveal from the hotspot's row.
  useEffect(() => {
    if (item === null || panel.current === null) {
      return;
    }

    panel.current.querySelector<HTMLElement>("h2")?.focus();
    gsap.fromTo(
      panel.current,
      { clipPath: "inset(0% 0% 100% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: reduced ? 0 : 0.45, ease: "expo.out" },
    );
  }, [item, reduced]);

  useEffect(() => {
    if (openId === null) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        buttons.current.get(openId)?.focus();
        setOpenId(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  const side = item?.hotspot && item.hotspot.x > 55 ? styles.toLeft : styles.toRight;

  const close = () => {
    if (openId !== null) {
      buttons.current.get(openId)?.focus();
    }
    setOpenId(null);
  };

  return (
    <div className={styles.sheet}>
      <div className={styles.frame}>
        <TripImage image={photo} sizes="(min-width: 1600px) 1520px, 100vw" priority />

        {spotted.map((spot) => (
          <button
            key={spot.id}
            ref={(element) => {
              if (element) {
                buttons.current.set(spot.id, element);
              } else {
                buttons.current.delete(spot.id);
              }
            }}
            type="button"
            className={styles.hotspot}
            style={{ left: `${spot.hotspot?.x}%`, top: `${spot.hotspot?.y}%` }}
            aria-expanded={openId === spot.id}
            aria-controls={panelId}
            onClick={() => setOpenId((current) => (current === spot.id ? null : spot.id))}
          >
            <span className="visually-hidden">{spot.name}</span>
          </button>
        ))}
      </div>

      {/* Wide screens: on the photo next to its hotspot. Phones: under the photo. */}
      {item?.hotspot && (
        <div
          ref={panel}
          id={panelId}
          className={`${styles.detail} ${side}`}
          style={{ left: `${item.hotspot.x}%`, top: `${item.hotspot.y}%` }}
          role="region"
          aria-label={item.name}
        >
          <Detail item={item} onClose={close} />
        </div>
      )}
    </div>
  );
}

function Detail({ item, onClose }: { item: GarageItem; onClose: () => void }) {
  const installed = formatDateRange(item.installed_at, null);

  return (
    <>
      <p className={styles.detailCategory}>{item.category}</p>
      <h2 className={styles.detailName} tabIndex={-1}>
        {item.name}
      </h2>
      {installed && <p className={styles.detailDate}>Dipasang {installed}</p>}
      {item.description_html && (
        <div
          className={styles.detailNote}
          dangerouslySetInnerHTML={{ __html: item.description_html }}
        />
      )}
      <button type="button" className={styles.detailClose} onClick={onClose}>
        Tutup
      </button>
    </>
  );
}
