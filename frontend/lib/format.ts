import type { TripType } from "./types";

const integer = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dayMonthYear = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const TYPE_LABELS: Record<TripType, string> = {
  coast: "Pantai",
  highland: "Pegunungan",
  forest: "Hutan",
  city: "Kota",
};

/** CSS color of a trip's chapter (city trips use black). */
export const CHAPTER_COLORS: Record<TripType, string> = {
  coast: "var(--pantai)",
  highland: "var(--gunung)",
  forest: "var(--rimba)",
  city: "var(--hitam)",
};

export function formatNumber(value: number): string {
  return integer.format(value);
}

/** "612" or "612,5" (Indonesian decimal comma). */
export function formatKm(value: number): string {
  return oneDecimal.format(value);
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** "10–12 Jan 2025", "30 Mar – 2 Apr 2026", or a single day. Null when undated. */
export function formatDateRange(start: string | null, end: string | null): string | null {
  if (start === null) {
    return null;
  }

  const from = parseDate(start);

  if (end === null || end === start) {
    return dayMonthYear.format(from);
  }

  const to = parseDate(end);
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  const sameMonth = sameYear && from.getUTCMonth() === to.getUTCMonth();

  if (sameMonth) {
    return `${day.format(from)}–${dayMonthYear.format(to)}`;
  }

  return `${sameYear ? dayMonth.format(from) : dayMonthYear.format(from)} – ${dayMonthYear.format(to)}`;
}

export function formatMonthYear(value: string): string {
  return monthYear.format(parseDate(value));
}

/** Inclusive number of days, or null when undated. */
export function durationDays(start: string | null, end: string | null): number | null {
  if (start === null) {
    return null;
  }

  const to = end === null ? parseDate(start) : parseDate(end);

  return Math.round((to.getTime() - parseDate(start).getTime()) / 86_400_000) + 1;
}

/** Zero-padded odometer digits, at least five. */
export function odometerDigits(km: number, minDigits = 5): string {
  return Math.max(0, Math.floor(km)).toString().padStart(minDigits, "0");
}
