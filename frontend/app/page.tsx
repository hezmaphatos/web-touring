import { HomeTour } from "@/components/Home/HomeTour";
import { LatestTrip } from "@/components/Home/LatestTrip";
import { getMap } from "@/lib/api";
import { loadSite } from "@/lib/site";

export default async function HomePage() {
  const [site, map] = await Promise.all([loadSite(), getMap()]);
  const trips = map.filter((trip) => trip.status === "published");
  const latest = trips.at(-1);

  return (
    <>
      <HomeTour siteName={site.site_name} totalKm={site.total_km} trips={trips} />
      {latest && <LatestTrip trip={latest} />}
    </>
  );
}
