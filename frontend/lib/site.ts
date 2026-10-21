import "server-only";

import { cache } from "react";
import { getSite } from "./api";
import type { Site } from "./types";

const FALLBACK: Site = {
  site_name: process.env.SITE_NAME ?? "Logbook",
  about_html: null,
  bike: { name: null, photo: null },
  portrait: null,
  links: { youtube: null, instagram: null },
  total_km: 0,
  counts: { trips: 0, photos: 0, videos: 0 },
};

/**
 * Site settings for the layout. The layout must render even if the API is briefly down,
 * so errors fall back to the env site name and zero totals.
 */
export const loadSite = cache(async (): Promise<Site> => {
  try {
    return await getSite();
  } catch (error) {
    console.error("Could not load /site", error);
    return FALLBACK;
  }
});

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
