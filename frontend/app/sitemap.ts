import type { MetadataRoute } from "next";
import { getTrips } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

const PAGES = ["", "/trip", "/peta", "/garage", "/statistik", "/next-ride", "/tentang"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await getTrips().catch(() => []);

  return [
    ...PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...trips.map((trip) => ({
      url: `${SITE_URL}/trip/${trip.slug}`,
      lastModified: trip.ended_at ?? trip.started_at ?? undefined,
      images: trip.cover ? [trip.cover.src] : undefined,
    })),
  ];
}
