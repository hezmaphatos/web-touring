import type { FeatureCollection, MultiLineString } from "geojson";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

/** Province shapes (Natural Earth 10m admin-1, Indonesia), coastline and province borders. */
export interface LandData {
  provinces: FeatureCollection;
  coast: MultiLineString;
  borders: MultiLineString;
}

/** Java provinces (ISO 3166-2), used for framing when there is nothing to fit yet. */
export const JAVA_PROVINCES = ["ID-BT", "ID-JK", "ID-JB", "ID-JT", "ID-YO", "ID-JI"];

let pending: Promise<LandData> | null = null;

/** Loads and converts the TopoJSON once per page session. */
export function loadLand(): Promise<LandData> {
  pending ??= fetch("/geo/indonesia-admin1.topo.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Map data responded ${response.status}`);
      }
      return response.json() as Promise<Topology>;
    })
    .then((topology) => {
      const provinces = topology.objects.provinces as GeometryCollection;

      return {
        provinces: feature(topology, provinces) as FeatureCollection,
        coast: mesh(topology, provinces, (a, b) => a === b),
        borders: mesh(topology, provinces, (a, b) => a !== b),
      };
    })
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });

  return pending;
}
