import "server-only";

import type { GarageItem, MapTrip, PlannedTrip, Site, Stats, Trip, TripSummary } from "./types";

/** Cache tags. The backend revalidate job sends the same names. */
export type Tag = "trips" | "garage" | "site";

const API_URL = (process.env.API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

/** Fallback interval; content changes normally arrive through the revalidate webhook. */
const REVALIDATE_SECONDS = 3600;

class NotFound extends Error {}

async function request<T>(path: string, tags: Tag[]): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { tags, revalidate: REVALIDATE_SECONDS },
  });

  if (response.status === 404) {
    throw new NotFound(path);
  }

  if (!response.ok) {
    throw new Error(`API ${path} responded ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getSite(): Promise<Site> {
  return request<Site>("/site", ["site"]);
}

/** Published trips, chronological (trip number ascending). */
export function getTrips(): Promise<TripSummary[]> {
  return request<TripSummary[]>("/trips", ["trips"]);
}

export async function getTrip(slug: string): Promise<Trip | null> {
  try {
    return await request<Trip>(`/trips/${encodeURIComponent(slug)}`, ["trips"]);
  } catch (error) {
    if (error instanceof NotFound) {
      return null;
    }
    throw error;
  }
}

/** Published (numbered, chronological) then planned trips with route data. */
export function getMap(): Promise<MapTrip[]> {
  return request<MapTrip[]>("/map", ["trips"]);
}

export function getStats(): Promise<Stats> {
  return request<Stats>("/stats", ["trips"]);
}

export function getGarage(): Promise<GarageItem[]> {
  return request<GarageItem[]>("/garage", ["garage"]);
}

export function getNextRides(): Promise<PlannedTrip[]> {
  return request<PlannedTrip[]>("/next-rides", ["trips"]);
}
