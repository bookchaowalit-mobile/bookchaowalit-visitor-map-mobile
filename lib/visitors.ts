/**
 * Pure visitor-map logic (no React Native imports) so it can be unit-tested.
 */

export interface Visit {
  country: string; // ISO 3166-1 alpha-2
  city: string;
  lat: number;
  lon: number;
  timestamp: number;
}

export interface CountryStat {
  country: string;
  count: number;
  share: number;
}

export type Range = "24h" | "7d" | "30d" | "all";

const RANGE_MS: Record<Exclude<Range, "all">, number> = {
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
};

const NAMES: Record<string, string> = {
  TH: "Thailand",
  US: "United States",
  JP: "Japan",
  GB: "United Kingdom",
  DE: "Germany",
  SG: "Singapore",
  AU: "Australia",
  BR: "Brazil",
  IN: "India",
  FR: "France",
};

export const countryName = (code: string) => NAMES[code.toUpperCase()] ?? code.toUpperCase();

/** Turns "TH" into the 🇹🇭 flag emoji; returns "" for invalid codes. */
export function flagEmoji(code: string): string {
  if (!/^[a-z]{2}$/i.test(code)) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function filterByRange(visits: Visit[], range: Range, now: number): Visit[] {
  if (range === "all") return visits;
  const since = now - RANGE_MS[range];
  return visits.filter((v) => v.timestamp > since && v.timestamp <= now);
}

/** "1 visit", "3 visits", "1 country", "2 countries". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Share (0..1) as a whole percentage that never lies at the edges: a real but
 * tiny share shows "<1%" (not "0%") and anything short of all shows at most "99%".
 */
export function formatShare(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return "0%";
  if (share >= 1) return "100%";
  const pct = Math.round(share * 100);
  if (pct < 1) return "<1%";
  return `${Math.min(99, pct)}%`;
}

/** Visits per country, most first (ties alphabetical), with share of total (0..1). */
export function aggregateByCountry(visits: Visit[]): CountryStat[] {
  const counts = new Map<string, number>();
  for (const v of visits) {
    const code = v.country.trim().toUpperCase();
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const total = visits.length;
  return [...counts.entries()]
    .map(([country, count]) => ({ country, count, share: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

/**
 * Equirectangular projection onto a width x height box (origin top-left).
 * Latitude is clamped to [-90, 90]; longitude wraps into [-180, 180).
 */
export function project(lat: number, lon: number, width: number, height: number): { x: number; y: number } {
  const clampedLat = Math.max(-90, Math.min(90, lat));
  const wrappedLon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return {
    x: ((wrappedLon + 180) / 360) * width,
    y: ((90 - clampedLat) / 180) * height,
  };
}

export interface Cluster {
  /** Stable grid-cell key, usable as a React key and for selection. */
  id: string;
  lat: number;
  lon: number;
  count: number;
  label: string;
  /** Cities in the cell, most visits first (ties alphabetical). */
  cities: { city: string; count: number }[];
}

/** Groups visits into lat/lon grid cells of `cellDegrees` to avoid overlapping dots. */
export function cluster(visits: Visit[], cellDegrees = 5): Cluster[] {
  const cells = new Map<string, { id: string; lat: number; lon: number; count: number; cities: Map<string, number> }>();
  for (const v of visits) {
    // A NaN coordinate would poison the cell average and render an invisible dot.
    if (!Number.isFinite(v.lat) || !Number.isFinite(v.lon)) continue;
    const lat = Math.max(-90, Math.min(90, v.lat));
    const lon = ((((v.lon + 180) % 360) + 360) % 360) - 180; // 190° and -170° are the same place
    const key = `${Math.floor(lat / cellDegrees)}:${Math.floor(lon / cellDegrees)}`;
    const cell = cells.get(key) ?? { id: key, lat: 0, lon: 0, count: 0, cities: new Map() };
    cell.lat += lat;
    cell.lon += lon;
    cell.count += 1;
    const city = v.city.trim() || "Unknown";
    cell.cities.set(city, (cell.cities.get(city) ?? 0) + 1);
    cells.set(key, cell);
  }
  return [...cells.values()]
    .map((c) => {
      const cities = [...c.cities.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([city, count]) => ({ city, count }));
      return { id: c.id, lat: c.lat / c.count, lon: c.lon / c.count, count: c.count, label: cities[0].city, cities };
    })
    .sort((a, b) => b.count - a.count);
}

/** Deterministic sample data (seeded LCG) for the demo screen. */
export function sampleVisits(now: number, count = 120, seed = 42): Visit[] {
  const cities: Omit<Visit, "timestamp">[] = [
    { country: "TH", city: "Bangkok", lat: 13.75, lon: 100.5 },
    { country: "TH", city: "Chiang Mai", lat: 18.79, lon: 98.98 },
    { country: "US", city: "San Francisco", lat: 37.77, lon: -122.42 },
    { country: "US", city: "New York", lat: 40.71, lon: -74.0 },
    { country: "JP", city: "Tokyo", lat: 35.68, lon: 139.69 },
    { country: "GB", city: "London", lat: 51.51, lon: -0.13 },
    { country: "DE", city: "Berlin", lat: 52.52, lon: 13.4 },
    { country: "SG", city: "Singapore", lat: 1.35, lon: 103.82 },
    { country: "AU", city: "Sydney", lat: -33.87, lon: 151.21 },
    { country: "BR", city: "São Paulo", lat: -23.55, lon: -46.63 },
  ];
  let state = seed >>> 0;
  const rand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  return Array.from({ length: count }, () => {
    // Skew towards the first cities so the ranking is interesting.
    const city = cities[Math.floor(rand() ** 2 * cities.length)];
    return { ...city, timestamp: now - Math.floor(rand() * 30 * 86_400_000) };
  });
}
