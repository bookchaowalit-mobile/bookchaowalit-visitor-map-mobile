import { describe, expect, it } from "vitest";
import {
  type Visit,
  aggregateByCountry,
  cluster,
  countryName,
  filterByRange,
  flagEmoji,
  project,
  sampleVisits,
} from "../visitors";

const NOW = Date.UTC(2026, 5, 1);
const DAY = 86_400_000;
const v = (country: string, city: string, lat: number, lon: number, ago = 0): Visit => ({
  country,
  city,
  lat,
  lon,
  timestamp: NOW - ago,
});

describe("aggregateByCountry", () => {
  it("counts, sorts and computes shares", () => {
    const stats = aggregateByCountry([v("th", "Bangkok", 13, 100), v("TH", "Bangkok", 13, 100), v("US", "NY", 40, -74), v("JP", "Tokyo", 35, 139)]);
    expect(stats).toEqual([
      { country: "TH", count: 2, share: 0.5 },
      { country: "JP", count: 1, share: 0.25 },
      { country: "US", count: 1, share: 0.25 },
    ]);
  });

  it("handles no visits", () => {
    expect(aggregateByCountry([])).toEqual([]);
  });
});

describe("filterByRange", () => {
  const visits = [v("TH", "a", 0, 0, 1000), v("TH", "b", 0, 0, 3 * DAY), v("TH", "c", 0, 0, 20 * DAY), v("TH", "future", 0, 0, -DAY)];
  it("keeps visits inside the window", () => {
    expect(filterByRange(visits, "24h", NOW).map((x) => x.city)).toEqual(["a"]);
    expect(filterByRange(visits, "7d", NOW).map((x) => x.city)).toEqual(["a", "b"]);
    expect(filterByRange(visits, "30d", NOW)).toHaveLength(3);
    expect(filterByRange(visits, "all", NOW)).toHaveLength(4);
  });
});

describe("project", () => {
  it("maps corners and centre", () => {
    expect(project(90, -180, 360, 180)).toEqual({ x: 0, y: 0 });
    expect(project(0, 0, 360, 180)).toEqual({ x: 180, y: 90 });
    expect(project(-90, 179, 360, 180)).toEqual({ x: 359, y: 180 });
  });

  it("clamps latitude and wraps longitude", () => {
    expect(project(120, 190, 360, 180)).toEqual({ x: 10, y: 0 });
  });
});

describe("cluster", () => {
  it("merges nearby visits and labels by most common city", () => {
    const clusters = cluster([v("TH", "Bangkok", 13.7, 100.5), v("TH", "Bangkok", 13.8, 100.6), v("TH", "Nonthaburi", 13.9, 100.5), v("JP", "Tokyo", 35.7, 139.7)]);
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toMatchObject({ count: 3, label: "Bangkok" });
    expect(clusters[0].lat).toBeCloseTo(13.8);
  });
});

describe("helpers", () => {
  it("names countries and builds flags", () => {
    expect(countryName("th")).toBe("Thailand");
    expect(countryName("zz")).toBe("ZZ");
    expect(flagEmoji("TH")).toBe("🇹🇭");
    expect(flagEmoji("THA")).toBe("");
  });

  it("generates deterministic sample data within 30 days", () => {
    const a = sampleVisits(NOW, 50);
    expect(a).toEqual(sampleVisits(NOW, 50));
    expect(a).toHaveLength(50);
    expect(a.every((x) => x.timestamp <= NOW && x.timestamp > NOW - 30 * DAY)).toBe(true);
  });
});
