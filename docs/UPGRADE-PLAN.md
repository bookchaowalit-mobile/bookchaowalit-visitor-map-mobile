# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working visitor map (clustered dots, range filter,
country ranking) with tested logic and honest CI; runs on sample data only.

## Backlog

- P0: Fetch real visits from the visitor-map/analytics backend (aggregate server-side;
  never ship raw IPs to the client) and keep `sampleVisits` as the offline/demo fallback.
- P1: Real basemap (react-native-maps or an SVG world outline) under the dots.
- P1: Country detail screen (tap a Top-countries row).
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

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — clusters are now interactive and screen-reader reachable; still sample data (backend P0 open).

- Tap a cluster: `cluster()` now returns a stable `id` and the full `cities` breakdown (tested); dots are buttons that open a "Cluster near …" card listing cities. Country detail screen still open (P1).
- Accessibility: dots were plain non-focusable Views; they are now focusable buttons with city/visit labels and selected state; range tabs read "Last 7 days" etc.; profile links get link roles.
- No local persistence added: the app holds no user-created data (sample analytics only).
- Advisories: `overrides.postcss ^8.5.28` clears the high-severity PostCSS advisory in Expo metro-config (minor bump). Remaining `image-size` (metro, bundler-only), `uuid` (via `xcode`) and `decode-uri-component` (via `query-string@7`) need an Expo SDK major upgrade; deliberately not auto-fixed.
- Verified: typecheck, lint, 9 vitest tests, Android `expo export` bundle.
