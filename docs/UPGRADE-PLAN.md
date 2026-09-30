# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working visitor map (clustered dots, range filter,
country ranking) with tested logic and honest CI; runs on sample data only.

## Backlog

- P0: Fetch real visits from the visitor-map/analytics backend (aggregate server-side;
  never ship raw IPs to the client) and keep `sampleVisits` as the offline/demo fallback.
- P1: Real basemap (react-native-maps or an SVG world outline) under the dots.
- P1: Tap a cluster to show its cities; country detail screen.
- P1: Component tests for the map screen (jest-expo + @testing-library/react-native).
- P2: Pull-to-refresh and "last updated" timestamp.
- P2: Link the EAS project (`eas init`) so the preview build job can run.

## Done in this pass

- Fixed the app not bundling: aligned `expo-router`/`react-native`/`expo-constants`
  with SDK 53 and added missing `expo-font`, `expo-asset`, `query-string` deps.
- Map screen backed by pure `lib/visitors.ts` (range filter, country aggregation,
  grid clustering, equirectangular projection, flags, seeded sample data) with 8 vitest tests.
- CI runs `npm ci`, typecheck, lint, tests and an Android JS bundle without `|| true`;
  EAS job skips cleanly without `EXPO_TOKEN`; added `eas.json`, ESLint config, lockfile.
