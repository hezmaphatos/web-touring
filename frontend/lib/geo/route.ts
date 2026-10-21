import type { GeoJsonLine, MapTrip, StopPoint, TripType } from "@/lib/types";

export type LngLat = [number, number];
export type Bounds = [LngLat, LngLat];

/** What the map scene needs to know about a trip. */
export interface SceneTrip {
  key: string;
  label: string;
  type: TripType;
  planned: boolean;
  coords: LngLat[];
  stops: { name: string; coord: LngLat }[];
}

/** Fallback frame when no trip has coordinates yet (Java). */
export const JAVA_BOUNDS: Bounds = [
  [105.1, -8.8],
  [114.6, -5.8],
];

function linesOf(geo: GeoJsonLine | null | undefined): LngLat[] {
  if (!geo) {
    return [];
  }

  switch (geo.type) {
    case "LineString":
      return (geo.coordinates as number[][]).map(([lng, lat]) => [lng, lat]);
    case "MultiLineString":
      return (geo.coordinates as number[][][]).flat().map(([lng, lat]) => [lng, lat]);
    case "Feature":
      return linesOf(geo.geometry);
    case "FeatureCollection":
      return (geo.features ?? []).flatMap((item) => linesOf(item));
    default:
      return [];
  }
}

/**
 * Route coordinates: the imported GeoJSON line when present, otherwise the stops in order.
 * Without GPX the route is an approximation through the stops, on purpose.
 */
export function routeCoordinates(routeGeojson: GeoJsonLine | null, stops: StopPoint[]): LngLat[] {
  const fromGeojson = linesOf(routeGeojson).filter(
    ([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat),
  );

  return fromGeojson.length > 1 ? fromGeojson : stops.map((stop) => [stop.lng, stop.lat]);
}

export function toSceneTrip(trip: MapTrip): SceneTrip {
  return {
    key: trip.slug,
    label: trip.title,
    type: trip.type,
    planned: trip.status === "planned",
    coords: routeCoordinates(trip.route_geojson, trip.stops),
    stops: trip.stops.map((stop) => ({ name: stop.name, coord: [stop.lng, stop.lat] })),
  };
}

/** Bounding box of some points, padded so a single point still gets a sensible frame. */
export function boundsOf(points: LngLat[], minSpan = 0.6): Bounds | null {
  if (points.length === 0) {
    return null;
  }

  let [minLng, minLat] = points[0];
  let [maxLng, maxLat] = points[0];

  for (const [lng, lat] of points) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const padLng = Math.max(0, (minSpan - (maxLng - minLng)) / 2);
  const padLat = Math.max(0, (minSpan - (maxLat - minLat)) / 2);

  return [
    [minLng - padLng, minLat - padLat],
    [maxLng + padLng, maxLat + padLat],
  ];
}

export function tripPoints(trip: SceneTrip): LngLat[] {
  return [...trip.coords, ...trip.stops.map((stop) => stop.coord)];
}
