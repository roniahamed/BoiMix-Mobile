# BoiMix Mobile — Decision Log

> This log records every significant architectural and technology decision made for the BoiMix Mobile app. Each entry includes the decision, the alternatives considered, the rationale for the choice, and the date.
>
> **Before proposing an alternative** to any decision recorded here, read the rationale. If you still believe an alternative is better, add a new entry with the new decision and reference the old one.

---

## Decision Format

```
## DEC-NNN: Short title
- **Date**: YYYY-MM-DD
- **Status**: Accepted | Superseded by DEC-XXX | Under Review
- **Decided by**: [team / role]
- **Decision**: What was decided
- **Alternatives considered**: What else was on the table
- **Rationale**: Why this choice was made
- **Consequences**: What this means for the codebase
- **References**: Links to related docs, issues, or discussions
```

---

## DEC-001: Expo Managed Workflow over Bare React Native

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Mobile Team Lead
- **Decision**: Use Expo Managed Workflow (`expo` SDK ~52.0.0) as the project foundation.
- **Alternatives considered**:
  - Bare React Native (no Expo)
  - Expo Bare Workflow (Expo + native code access)
- **Rationale**:
  - Faster initial setup — no Xcode/Android Studio configuration for the managed layer.
  - EAS Build provides cloud-based APK/IPA generation without a Mac CI machine.
  - EAS Update provides over-the-air (OTA) JS bundle updates for hotfixes without Play Store review.
  - All required native modules (`expo-secure-store`, `expo-notifications`, `expo-location`, `expo-image-picker`, `expo-barcode-scanner`) are available as first-party Expo modules compatible with Managed Workflow.
  - `@react-native-firebase/app` is supported in Managed Workflow via config plugins (no ejection needed).
  - Team is already familiar with Expo from the web project's familiarity with Next.js-style tooling.
- **Consequences**:
  - Cannot use arbitrary native (C++/Java/Swift) modules without a config plugin or ejecting.
  - If a native module is needed that has no config plugin, we must eject — record as a new decision.
- **References**: `mobile_architecture.md` → Tech Stack

---

## DEC-002: Android First, iOS Later

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Product / Business
- **Decision**: Build and ship the Android app first. iOS support is deferred to a later phase.
- **Alternatives considered**:
  - Ship both platforms simultaneously
  - iOS first
- **Rationale**:
  - Bangladesh smartphone market is ~90% Android.
  - iOS requires Apple Developer Program (\$99/year) and a Mac for TestFlight — cost/complexity not justified at MVP.
  - Focusing on one platform reduces testing surface and speeds up the feedback loop.
  - The codebase is written cross-platform (no Android-only APIs), so iOS is easy to enable later.
- **Consequences**:
  - `app.json` configures only Android bundle identifier at MVP.
  - iOS-specific behaviors (Haptics, Apple Pay, iOS-specific permissions) are not implemented in Phase 1–5.
  - Every screen should still be tested in Expo Go on iOS to avoid obvious regressions.
- **References**: `mobile_phase_by_phase_plan.md` → Phase 5 (EAS Build)

---

## DEC-003: NativeWind v4 over React Native StyleSheet

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Use NativeWind v4 (Tailwind syntax) as the primary styling solution.
- **Alternatives considered**:
  - `StyleSheet.create` (React Native default)
  - Styled Components / Emotion
  - Tamagui
- **Rationale**:
  - The web frontend uses Tailwind CSS — NativeWind provides identical class names, reducing the mental model switch.
  - Faster development: utility-first classes reduce context switching between logic and style files.
  - NativeWind v4 compiles Tailwind to React Native `StyleSheet` at build time — no runtime overhead.
  - Design token consistency: `tailwind.config.js` is the single source of truth for colors, spacing, and typography across web and mobile (copy the custom extensions).
  - Tamagui was considered but its learning curve and compilation complexity outweigh benefits at this team size.
- **Consequences**:
  - `StyleSheet.create` is restricted to animations and shadows only (documented in `mobile_coding_standards.md`).
  - `tailwind.config.js` must be kept in sync with the web project's custom colors and tokens.
  - Developers must learn NativeWind's React Native constraints (no arbitrary CSS, no pseudo-classes on mobile).
- **References**: `mobile_architecture.md` → Tech Stack; `mobile_coding_standards.md` → Style Rules

---

## DEC-004: Expo Router over React Navigation (manual)

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Use Expo Router v4 (file-based routing) as the navigation framework.
- **Alternatives considered**:
  - React Navigation v7 (manual stack/tab configuration)
  - React Native Navigation (Wix)
- **Rationale**:
  - File-based routing is identical in concept to Next.js's App Router — the team already knows this mental model.
  - Expo Router wraps React Navigation internally — the same performance, with less boilerplate.
  - Type-safe routes out of the box (no manual route type definitions).
  - Deep linking is configured automatically from the file structure.
  - Code splitting per route is automatic.
- **Consequences**:
  - All screens must live under `app/`. No `src/screens/` directory.
  - Route group conventions `(auth)`, `(tabs)` must be followed.
  - No barrel files (`index.ts`) in `app/` subdirectories — this conflicts with Expo Router's file scanning.
- **References**: `mobile_architecture.md` → Navigation Architecture

---

## DEC-005: `expo-secure-store` over `AsyncStorage` for Auth Tokens

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Security / Mobile Team
- **Decision**: Store access tokens and refresh tokens exclusively in `expo-secure-store`. Use `AsyncStorage` only for non-sensitive preference data (language, onboarding seen, recent searches).
- **Alternatives considered**:
  - `@react-native-async-storage/async-storage` for all storage
  - In-memory only (no persistence)
  - `react-native-keychain`
- **Rationale**:
  - `expo-secure-store` uses iOS Keychain and Android Keystore — both hardware-backed encrypted stores.
  - `AsyncStorage` is plaintext — tokens stored there can be read by any app with root access.
  - `react-native-keychain` offers similar security but is not a first-party Expo module (more maintenance burden).
  - In-memory only: users would have to log in on every app open — unacceptable UX.
- **Consequences**:
  - `expo-secure-store` has a 2048-byte value limit per key. Tokens that exceed this must be chunked (see `lib/secure-storage.ts`).
  - Developers must never use `AsyncStorage` for tokens — ESLint rule enforced.
  - On Android, SecureStore requires a device PIN/fingerprint to be set. Edge case: if no lock screen, SecureStore may fall back to unencrypted storage — document and monitor.
- **References**: `mobile_architecture.md` → Auth Flow; `mobile_coding_standards.md` → Authentication & Security; `lib/secure-storage.ts`

---

## DEC-006: FlashList over FlatList for Performance

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend / Performance
- **Decision**: Use `@shopify/flash-list` as the primary list component, replacing React Native's `FlatList` for all lists with more than 10 items.
- **Alternatives considered**:
  - `FlatList` (React Native built-in)
  - `RecyclerListView` (Flipkart)
  - `SectionList` (for grouped data)
- **Rationale**:
  - FlashList achieves ~10× less blank flash during fast scrolling vs FlatList by recycling native views, not React components.
  - Book cover images make list items expensive to re-render — FlashList's recycling strategy avoids this.
  - Official Shopify production usage proves reliability at scale.
  - Drop-in replacement for FlatList with the same API surface (`data`, `renderItem`, `keyExtractor`), plus `estimatedItemSize`.
  - `RecyclerListView` has a more complex API and requires fixed-size items.
- **Consequences**:
  - All `FlatList` usages in screen code must be replaced with `FlashList`.
  - `estimatedItemSize` is required — document sizes per component in `mobile_coding_standards.md`.
  - FlashList does not support all FlatList props — check compatibility when adding new list features.
- **References**: `mobile_architecture.md` → Performance Guidelines; `mobile_coding_standards.md` → Performance Rules

---

## DEC-007: React Query for Server State, Zustand for Client State

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Maintain a strict separation: TanStack React Query manages all data fetched from the API; Zustand manages client-only state (auth session, UI preferences, offline queue, optimistic counts).
- **Alternatives considered**:
  - Zustand for everything (manual fetch + cache)
  - Redux Toolkit Query
  - SWR
- **Rationale**:
  - React Query provides automatic background refetch, stale-while-revalidate, deduplication, and infinite scroll — features that would require significant manual implementation in Zustand.
  - Zustand handles synchronous, instantaneous state reads needed by the Axios interceptor (access token) — React Query's async nature makes it unsuitable for this.
  - Redux Toolkit Query has steeper boilerplate and is overkill for this team size.
  - SWR lacks `useInfiniteQuery` ergonomics that the explore screen requires.
  - The web frontend already uses React Query + Zustand — mobile mirrors this pattern exactly.
- **Consequences**:
  - Developers must consult the decision matrix in `mobile_coding_standards.md` → State Rules before choosing a storage mechanism.
  - Never copy API responses into Zustand — only derived values (IDs, counts).
- **References**: `mobile_architecture.md` → State Management; `mobile_coding_standards.md` → State Rules

---

## DEC-008: Firebase Auth SDK for Google Sign-In

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend / Backend Team
- **Decision**: Use `@react-native-firebase/auth` for Google Sign-In, sending the Firebase `idToken` to the backend's `POST /auth/google` endpoint.
- **Alternatives considered**:
  - `expo-auth-session` (pure Expo, no native Firebase SDK)
  - `@react-native-google-signin/google-signin`
  - Direct Google OAuth2 PKCE flow
- **Rationale**:
  - The web frontend uses Firebase Auth — the backend already validates Firebase ID tokens.
  - `@react-native-firebase/auth` is the most complete implementation with token refresh, session persistence, and reCAPTCHA support.
  - `expo-auth-session` works for Expo Go but requires additional setup for standalone apps and doesn't support all Firebase Auth features.
  - Direct PKCE flow would require reimplementing token validation on the backend.
- **Consequences**:
  - `google-services.json` (Android) must be placed in the project root and referenced in `app.json` via the Firebase config plugin.
  - `@react-native-firebase` requires a config plugin for Expo Managed Workflow — this is supported.
  - SHA-1 fingerprint of the debug and release keystore must be registered in Firebase Console.
- **References**: `mobile_architecture.md` → Auth Flow; `mobile_env_reference.md` → Firebase Variables

---

## DEC-009: Single App for Buyer + Seller (No Role Split)

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Product / Business
- **Decision**: Build one unified app that serves both book buyers/borrowers and book sellers/listers. No separate seller app.
- **Alternatives considered**:
  - Two separate apps (buyer app + seller app)
  - Role-based app switching within one binary
- **Rationale**:
  - Bangladesh's peer-to-peer model: every buyer is a potential seller and vice versa. Splitting apps would fragment the user base.
  - Reduces maintenance overhead at MVP stage.
  - The web platform uses the same unified approach.
  - User request explicitly asks for a single app.
- **Consequences**:
  - The "Upload Book" feature must be accessible from the profile tab (not a separate app).
  - Admin features remain in the web dashboard — they are not in this mobile app.
  - Role checks (`user.roles`) are used to conditionally show seller-specific features (book upload, exchange management).
- **References**: `mobile_phase_by_phase_plan.md` → Phase 4 (Book Upload)

---

## DEC-010: Zustand v5 (not v4)

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Use Zustand v5 (`^5.0.0`).
- **Alternatives considered**:
  - Zustand v4 (previous stable)
- **Rationale**:
  - Zustand v5 drops legacy APIs and has better TypeScript inference out of the box — the `create<State>()()` curried form is cleaner.
  - Smaller bundle size (dropped legacy compatibility code).
  - v5 is the current stable version for new projects.
  - The web frontend has already migrated to v5 — mobile mirrors this.
- **Consequences**:
  - v5 removes the `immer` middleware from the default export — if needed, install separately.
  - v5 changes the `persist` middleware API slightly — follow the v5 docs, not v4 examples found online.
- **References**: `mobile_architecture.md` → State Management

---

## DEC-011: NativeWind Global CSS Entry Point

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Create `global.css` at the project root and import it in `app/_layout.tsx` via `import '../global.css'` as required by NativeWind v4.
- **Rationale**: NativeWind v4 changed from a Babel transform to a CSS-based approach. The `global.css` file must contain `@tailwind base; @tailwind components; @tailwind utilities;` and be imported once at the root layout.
- **Consequences**: Forgetting this import silently breaks all NativeWind styles with no error message. Document clearly in Phase 0 bootstrap.

---

## DEC-012: Axios with Custom Interceptors over Fetch

- **Date**: 2026-11-21
- **Status**: Accepted
- **Decided by**: Frontend Team
- **Decision**: Use Axios (`^1.7.0`) as the HTTP client, not the native `fetch` API.
- **Alternatives considered**:
  - Native `fetch` (no dependency)
  - `wretch` (fetch wrapper)
- **Rationale**:
  - Axios request and response interceptors cleanly handle the auth token injection and 401 refresh logic without custom middleware.
  - Axios automatically JSON-serializes/deserializes bodies and throws on non-2xx responses.
  - The web frontend uses Axios — mobile mirrors this.
  - `fetch` requires manual retry logic implementation; `wretch` is less popular and has less community support.
- **Consequences**:
  - Add `axios` to dependencies.
  - The singleton `client` instance in `lib/api/client.ts` is the only place Axios is instantiated.

---

*Log last updated: 2026-11-21 (Phase 0)*
