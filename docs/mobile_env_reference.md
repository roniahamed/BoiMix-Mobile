# BoiMix Mobile — Environment Variable Reference

> **Security Rule**: Never commit `.env.*` files to version control. Never use `EXPO_PUBLIC_` prefix for secrets — these values are compiled into the JavaScript bundle and readable by anyone who downloads the APK.

---

## Environment Files

| File | Used When | Gitignored |
|------|-----------|------------|
| `.env.development` | `expo start` (local dev) | ✅ Yes |
| `.env.production` | `eas build --profile production` | ✅ Yes |
| `.env.preview` | `eas build --profile preview` | ✅ Yes |
| `.env.example` | Reference template for new developers | ❌ No (committed) |

---

## Variable Reference

### API Configuration

| Variable | Development Value | Production Value | Required | Notes |
|----------|------------------|-----------------|----------|-------|
| `EXPO_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8080/api/v1` | `https://api.boimix.com/api/v1` | ✅ Yes | Base URL for all Axios requests. Must NOT have a trailing slash. |
| `EXPO_PUBLIC_WS_BASE_URL` | `ws://127.0.0.1:8001` | `wss://api.boimix.com` | ✅ Yes | WebSocket base. Chat connects to `${WS_BASE_URL}/ws/chat/{id}/`. |

> [!IMPORTANT]
> Expo requires the `EXPO_PUBLIC_` prefix for variables that should be accessible in JS/TS code. Variables without this prefix are NOT available in the app bundle — they can only be used in Expo config files (`app.config.ts`).

---

### Firebase Configuration

All Firebase variables are `EXPO_PUBLIC_` because they are API keys intended for client-side use (they are restricted by Firebase security rules and SHA-1 app signing, NOT by being secret).

| Variable | Required | Notes |
|----------|----------|-------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Web API key from Firebase Console → Project Settings → General |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Format: `<project-id>.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Format: `<project-id>.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Used by FCM |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | ✅ Yes | Web app ID from Firebase Console |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | ❌ No | Only needed if using Google Analytics for Firebase |

> [!NOTE]
> For React Native Firebase (`@react-native-firebase`), these variables are also defined in `google-services.json` (Android) and `GoogleService-Info.plist` (iOS). These native config files are referenced by the Firebase config plugin in `app.json`. The `EXPO_PUBLIC_FIREBASE_*` env vars are for direct Firebase Web SDK usage (if needed).

---

### EAS Build

| Variable | Used By | Notes |
|----------|---------|-------|
| `EAS_BUILD_PROFILE` | EAS CLI | Set automatically by EAS; values: `development`, `preview`, `production` |

---

### Google Maps

| Variable | Required | Notes |
|----------|----------|-------|
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ Yes (for Maps) | Required by `react-native-maps` on Android. Restrict to your app's SHA-1 in Google Cloud Console. |

---

## `.env.example` (Committed Template)

```bash
# .env.example
# Copy this file to .env.development and fill in real values.
# NEVER commit .env.development or .env.production.

# API
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api/v1
EXPO_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8001

# Firebase (client-safe — restricted by security rules)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## `.env.development` (Local Dev — Not Committed)

```bash
# .env.development

EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api/v1
EXPO_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8001

EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=boimix-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=boimix-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=boimix-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## `.env.production` (Production — Not Committed)

```bash
# .env.production

EXPO_PUBLIC_API_BASE_URL=https://api.boimix.com/api/v1
EXPO_PUBLIC_WS_BASE_URL=wss://api.boimix.com

EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=boimix.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=boimix
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=boimix.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
EXPO_PUBLIC_FIREBASE_APP_ID=1:987654321:android:xyz789

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## EAS Secrets (For Build-Time Use Only)

The following are stored as EAS Secrets (via `eas secret:create`) and are NEVER in source files or env files:

| Secret Name | Purpose |
|-------------|---------|
| `ANDROID_KEYSTORE_PASSWORD` | Android release keystore password |
| `ANDROID_KEY_ALIAS` | Android key alias |
| `ANDROID_KEY_PASSWORD` | Android key password |
| `GOOGLE_SERVICES_JSON_BASE64` | Base64-encoded `google-services.json` for CI builds |

To set an EAS secret:
```bash
eas secret:create --scope project --name ANDROID_KEYSTORE_PASSWORD --value "your_password"
```

---

## Accessing Variables in Code

```typescript
// ✅ GOOD — EXPO_PUBLIC_ variables are available via process.env
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

// ✅ GOOD — Wrapped in a constant (recommended pattern)
// constants/config.ts
export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080/api/v1',
  WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://127.0.0.1:8001',
} as const;
```

> [!CAUTION]
> Never interpolate `EXPO_PUBLIC_` variables directly into SQL queries, shell commands, or HTML attributes. They are configuration values, not data. Treat them as trusted constants.

---

## Security Rules Summary

| Rule | Detail |
|------|--------|
| ❌ Never commit `.env.*` | Add `.env.*` to `.gitignore`. Only `.env.example` is committed. |
| ❌ Never put secrets in `EXPO_PUBLIC_` | APK can be decompiled; `EXPO_PUBLIC_` values are plaintext in the bundle. |
| ❌ Never hardcode credentials | No passwords, tokens, or API keys in source code — ever. |
| ✅ Use EAS Secrets for signing keys | Keystore passwords, key aliases go in EAS Secrets only. |
| ✅ Restrict Google Maps API key | In Google Cloud Console, restrict the key to your app's package name + SHA-1. |
| ✅ Restrict Firebase API key | Firebase security rules protect the data; the key itself is restricted by domain/app. |

---

## `.gitignore` Additions Required

```
# Environment files
.env
.env.*
!.env.example

# Firebase native config (contain project secrets — distribute via EAS secrets)
google-services.json
GoogleService-Info.plist
```

---

*Document version: 1.0 — Phase 0*
