# Visitor Map — Mobile

React Native mobile app (Expo) for **Visitor Map**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **Visitor map** (Map tab): plots visits on an equirectangular world grid, with
  nearby visits clustered into dots sized by volume, a 24h / 7d / 30d / all range
  filter, and a top-countries table with flags, counts and share bars. It uses
  deterministic sample data until the analytics backend is connected.
- Aggregation, clustering and projection live in `lib/visitors.ts` (pure
  TypeScript, unit-tested).

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Getting Started

```bash
npm install
npx expo start
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (eslint-config-expo)
npm test            # vitest unit tests for lib/
npx expo export --platform android --output-dir dist   # JS bundle smoke check
```

CI (`.github/workflows/build.yml`) runs all of the above with `npm ci`; failures
are not masked. The EAS preview build only runs on `main` when the `EXPO_TOKEN`
secret is configured (run `eas init` once to link the project).

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/visitor-map-frontend](https://github.com/bookchaowalit-website/visitor-map-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
