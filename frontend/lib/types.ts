export type TripType = "coast" | "highland" | "forest" | "city";
export type TripStatus = "published" | "planned";

export interface ImageData {
  src: string;
  srcset: string;
  avif_srcset: string | null;
  width: number;
  height: number;
  placeholder: string | null;
  alt: string;
}

export interface StopPoint {
  name: string;
  lat: number;
  lng: number;
}

/** Ledger, home and map shape. `number` is null for planned trips. */
export interface TripSummary {
  number: number | null;
  slug: string;
  title: string;
  summary: string | null;
  type: TripType;
  status: TripStatus;
  started_at: string | null;
  ended_at: string | null;
  year: number | null;
  distance_km: number | null;
  max_elevation_m: number | null;
  cover: ImageData | null;
  stops: StopPoint[];
}

export interface GeoJsonLine {
  type: "LineString" | "MultiLineString" | "Feature" | "FeatureCollection";
  coordinates?: number[][] | number[][][];
  geometry?: GeoJsonLine;
  features?: GeoJsonLine[];
}

export interface MapTrip extends TripSummary {
  route_geojson: GeoJsonLine | null;
  planned_for: string | null;
}

export interface PlannedTrip extends MapTrip {
  note_html: string | null;
}

export interface Stop {
  id: number;
  name: string;
  province: string | null;
  lat: number;
  lng: number;
  km_marker: number | null;
  note_html: string | null;
}

export interface Photo {
  id: number;
  stop_id: number | null;
  caption: string | null;
  image: ImageData;
}

export interface Video {
  id: number;
  stop_id: number | null;
  youtube_id: string;
  title: string | null;
}

export interface TripLink {
  slug: string;
  title: string;
}

export interface Trip extends Omit<TripSummary, "stops"> {
  number: number;
  pull_quote: string | null;
  description_html: string | null;
  stops: Stop[];
  photos: Photo[];
  videos: Video[];
  route_geojson: GeoJsonLine | null;
  prev: TripLink | null;
  next: TripLink | null;
}

export interface Site {
  site_name: string;
  about_html: string | null;
  bike: { name: string | null; photo: ImageData | null };
  portrait: ImageData | null;
  links: { youtube: string | null; instagram: string | null };
  total_km: number;
  counts: { trips: number; photos: number; videos: number };
}

export interface Stats {
  total_km: number;
  trips: number;
  days_on_road: number;
  highest_point_m: number | null;
  provinces_visited: number;
  photos: number;
  videos: number;
  km_per_year: { year: number; km: number; trips: number }[];
}

export interface GarageItem {
  id: number;
  name: string;
  category: string;
  description_html: string | null;
  installed_at: string | null;
  hotspot: { x: number; y: number } | null;
  photo: ImageData | null;
}
