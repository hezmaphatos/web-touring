import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chapter } from "@/components/Chapter/Chapter";
import { getMap, getTrip, getTrips } from "@/lib/api";
import { ghostPath } from "@/lib/geo/ghost";
import { routeCoordinates } from "@/lib/geo/route";

export async function generateStaticParams() {
  try {
    const trips = await getTrips();
    return trips.map((trip) => ({ slug: trip.slug }));
  } catch {
    // Without the API at build time every chapter renders on its first visit instead.
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/trip/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTrip(slug);

  if (trip === null) {
    return {};
  }

  const description = trip.summary ?? undefined;
  const images = trip.cover ? [{ url: trip.cover.src, alt: trip.cover.alt }] : undefined;

  return {
    title: trip.title,
    description,
    alternates: { canonical: `/trip/${trip.slug}` },
    openGraph: {
      type: "article",
      title: trip.title,
      description,
      url: `/trip/${trip.slug}`,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: trip.title, description },
  };
}

export default async function TripPage({ params }: PageProps<"/trip/[slug]">) {
  const { slug } = await params;
  const trip = await getTrip(slug);

  if (trip === null) {
    notFound();
  }

  // Neighbouring routes for the ghosts behind the previous/next links.
  const map = await getMap();
  const ghostOf = (slug: string | undefined) => {
    const neighbour = map.find((item) => item.slug === slug);
    return neighbour ? ghostPath(routeCoordinates(neighbour.route_geojson, neighbour.stops)) : null;
  };

  return (
    <Chapter
      trip={trip}
      ghosts={{ prev: ghostOf(trip.prev?.slug), next: ghostOf(trip.next?.slug) }}
    />
  );
}
