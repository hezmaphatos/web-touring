import metrics from "./archivo-900.json";

const advances = metrics.advances as Record<string, number>;

/**
 * Width of a line of Archivo 900 (wdth 100) in em, from the font's real advance widths.
 * Lets the server size a fit-to-width headline before any JavaScript runs.
 */
export function emWidth(text: string, letterSpacingEm = 0): number {
  let units = 0;
  let count = 0;

  for (const char of text) {
    units += advances[char] ?? metrics.fallback;
    count += 1;
  }

  return units / metrics.unitsPerEm + letterSpacingEm * count;
}
