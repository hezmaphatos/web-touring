import { geoMercator } from "d3-geo";
import { curveCatmullRom, line } from "d3-shape";
import type { LngLat } from "./route";

export const GHOST_WIDTH = 1000;
export const GHOST_HEIGHT = 260;

/**
 * Static SVG path of a route fitted into a GHOST_WIDTH × GHOST_HEIGHT box.
 * Rendered on the server for the faint route behind the previous/next links.
 */
export function ghostPath(coords: LngLat[]): string | null {
  if (coords.length < 2) {
    return null;
  }

  const projection = geoMercator().fitExtent(
    [
      [20, 20],
      [GHOST_WIDTH - 20, GHOST_HEIGHT - 20],
    ],
    { type: "LineString", coordinates: coords },
  );
  const points = coords.map((coord) => projection(coord) as [number, number]);

  return line<[number, number]>().curve(curveCatmullRom.alpha(0.5))(points);
}
