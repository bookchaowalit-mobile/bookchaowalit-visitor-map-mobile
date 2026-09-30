import { useMemo, useState } from "react";
import { type LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  type Range,
  aggregateByCountry,
  cluster,
  countryName,
  filterByRange,
  flagEmoji,
  project,
  sampleVisits,
} from "../../lib/visitors";

const NOW = Date.now();
const VISITS = sampleVisits(NOW);
const RANGES: Range[] = ["24h", "7d", "30d", "all"];

export default function MapScreen() {
  const [range, setRange] = useState<Range>("7d");
  const [width, setWidth] = useState(0);
  const height = width / 2;

  const visits = useMemo(() => filterByRange(VISITS, range, NOW), [range]);
  const stats = useMemo(() => aggregateByCountry(visits), [visits]);
  const clusters = useMemo(() => cluster(visits), [visits]);
  const max = clusters[0]?.count ?? 1;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.chips} accessibilityRole="tablist">
        {RANGES.map((r) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: r === range }}
            key={r}
            onPress={() => setRange(r)}
            style={[styles.chip, r === range && styles.chipActive]}
          >
            <Text style={[styles.chipText, r === range && styles.chipTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.summary}>
        {visits.length} visits from {stats.length} countries (sample data)
      </Text>

      <View
        accessibilityLabel={`World map with ${clusters.length} visitor clusters`}
        onLayout={onLayout}
        style={[styles.map, { height: height || 160 }]}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={`h${f}`} style={[styles.gridH, { top: `${f * 100}%` }]} />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <View key={`v${f}`} style={[styles.gridV, { left: `${f * 100}%` }]} />
        ))}
        {width > 0 &&
          clusters.map((c) => {
            const { x, y } = project(c.lat, c.lon, width, height);
            const size = 8 + 16 * Math.sqrt(c.count / max);
            return (
              <View
                accessibilityLabel={`${c.label}: ${c.count} visits`}
                key={`${c.lat}:${c.lon}`}
                style={[styles.dot, { width: size, height: size, borderRadius: size / 2, left: x - size / 2, top: y - size / 2 }]}
              />
            );
          })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top countries</Text>
        {stats.length === 0 && <Text style={styles.empty}>No visits in this range.</Text>}
        {stats.map((s) => (
          <View key={s.country} style={styles.statRow}>
            <Text style={styles.country}>
              {flagEmoji(s.country)} {countryName(s.country)}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${Math.round(s.share * 100)}%` }]} />
            </View>
            <Text style={styles.count}>
              {s.count} · {Math.round(s.share * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 16, gap: 12 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: "#2F6DB5", paddingHorizontal: 12, paddingVertical: 4 },
  chipActive: { backgroundColor: "#2F6DB5" },
  chipText: { color: "#2F6DB5" },
  chipTextActive: { color: "#fff" },
  summary: { color: "#333", fontWeight: "600" },
  map: { backgroundColor: "#DCE8F5", borderRadius: 12, overflow: "hidden" },
  gridH: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "#9DB6D3" },
  gridV: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "#9DB6D3" },
  dot: { position: "absolute", backgroundColor: "rgba(198, 40, 40, 0.7)", borderWidth: 1, borderColor: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  empty: { color: "#666" },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  country: { width: 130, color: "#222" },
  barTrack: { flex: 1, height: 8, backgroundColor: "#EEE", borderRadius: 4, overflow: "hidden" },
  bar: { height: 8, backgroundColor: "#2F6DB5" },
  count: { width: 70, textAlign: "right", color: "#555", fontVariant: ["tabular-nums"] },
});
