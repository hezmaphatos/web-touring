import type { TripSummary, TripType } from "./types";

/** Terrain filter values as they appear in the URL (?medan=pantai). */
export const TERRAIN_PARAMS: Record<string, TripType> = {
  pantai: "coast",
  pegunungan: "highland",
  hutan: "forest",
  kota: "city",
};

export interface LedgerFilter {
  year: number | null;
  terrain: string | null;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilter(params: Record<string, string | string[] | undefined>): LedgerFilter {
  const year = Number.parseInt(first(params.tahun) ?? "", 10);
  const terrain = first(params.medan) ?? "";

  return {
    year: Number.isFinite(year) ? year : null,
    terrain: terrain in TERRAIN_PARAMS ? terrain : null,
  };
}

export function applyFilter(trips: TripSummary[], filter: LedgerFilter): TripSummary[] {
  return trips.filter(
    (trip) =>
      (filter.year === null || trip.year === filter.year) &&
      (filter.terrain === null || trip.type === TERRAIN_PARAMS[filter.terrain]),
  );
}

/** Query string for a filter, keeping the other dimension. */
export function filterHref(filter: LedgerFilter): string {
  const query = new URLSearchParams();

  if (filter.year !== null) {
    query.set("tahun", String(filter.year));
  }

  if (filter.terrain !== null) {
    query.set("medan", filter.terrain);
  }

  const text = query.toString();

  return text === "" ? "/trip" : `/trip?${text}`;
}
