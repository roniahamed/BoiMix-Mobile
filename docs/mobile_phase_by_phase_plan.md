# BoiMix Mobile — Phase-by-Phase Implementation Plan

> This is the master implementation document. Every screen, every state, every edge case is documented here. An AI agent reading this document should be able to implement any screen without asking clarifying questions.

---

## Overview

| Phase | Name | Days | Deliverable |
|-------|------|------|-------------|
| 0 | Project Bootstrap | Day 1 | Working Expo app with API client, auth store, NativeWind |
| 1 | Auth Flow | Days 2–4 | Complete auth: register, OTP, login, Google, forgot password |
| 2 | Core Discovery | Days 5–9 | Home, Explore, Book Detail, Search, Near Me |
| 3 | Transactions & Cart | Days 10–13 | Cart, Checkout, Wishlist, Orders, Borrow, Exchange |
| 4 | Profile & Seller | Days 14–17 | Profile, Upload, Settings, Notifications, Chat |
| 5 | Polish & Play Store | Days 18–21 | Push notifications, offline, deep links, EAS build |

---

## Phase 0 — Project Bootstrap

### Goal

Initialize a fully configured Expo project with all dependencies, NativeWind, TypeScript strict mode, environment variables, Axios client with token interceptors, React Query provider, Zustand stores, and SecureStore wrapper. By the end of Phase 0, the app should compile without errors and render a blank home screen with working API connectivity.

---

### Task 0.1 — Initialize Expo Project

**Command:**
```bash
npx create-expo-app@latest BoiMix-Mobile --template expo-template-blank-typescript
cd /Users/roni/Desktop/BoiMix-Mobile
```

> [!IMPORTANT]
> The project must be created at `/Users/roni/Desktop/BoiMix-Mobile`. If the directory already exists, initialize inside it without overwriting existing files.

**Expected result:** `app.json`, `App.tsx`, `tsconfig.json`, `package.json` are created.

Immediately rename `App.tsx` → delete it. Expo Router will take over routing.

---

### Task 0.2 — Install All Dependencies

Install in one command to minimize lockfile churn:

```bash
npx expo install \
  expo-router \
  expo-secure-store \
  expo-image \
  expo-notifications \
  expo-location \
  expo-image-picker \
  expo-image-manipulator \
  expo-barcode-scanner \
  expo-web-browser \
  expo-linking \
  expo-font \
  expo-splash-screen \
  expo-constants \
  react-native-reanimated \
  react-native-gesture-handler \
  react-native-safe-area-context \
  react-native-screens \
  react-native-maps
```

```bash
npm install \
  nativewind \
  tailwindcss \
  zustand \
  @tanstack/react-query \
  axios \
  zod \
  @shopify/flash-list \
  @react-native-firebase/app \
  @react-native-firebase/auth \
  @react-native-firebase/messaging \
  @react-native-async-storage/async-storage \
  @react-native-community/netinfo
```

```bash
npm install --save-dev \
  jest \
  jest-expo \
  @testing-library/react-native \
  @testing-library/jest-native \
  @types/jest \
  eslint \
  eslint-config-expo \
  prettier
```

---

### Task 0.3 — Configure NativeWind

**`tailwind.config.js`** (create at project root):
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E84B1B',
          secondary: '#F5A623',
          dark: '#1A1A2E',
          light: '#F8F4F0',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Hind Siliguri', 'System'],
        mono: ['SpaceMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

**`global.css`** (create at project root):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`babel.config.js`** (update):
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**`metro.config.js`** (create):
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

---

### Task 0.4 — Configure Expo Router (`app/_layout.tsx`)

Create `app/_layout.tsx`:
```typescript
import '../global.css';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query/queryClient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

> [!IMPORTANT]
> `import '../global.css'` must be the FIRST import in this file. NativeWind processes it at build time and applies styles globally.

---

### Task 0.5 — Configure TypeScript

**`tsconfig.json`** (replace):
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

---

### Task 0.6 — Set Up Environment Variables

**`.env.development`** (create):
```
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api/v1
EXPO_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8001
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**`.env.production`** (create):
```
EXPO_PUBLIC_API_BASE_URL=https://api.boimix.com/api/v1
EXPO_PUBLIC_WS_BASE_URL=wss://api.boimix.com
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

**`constants/config.ts`** (create):
```typescript
export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080/api/v1',
  WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://127.0.0.1:8001',
} as const;
```

---

### Task 0.7 — Configure Axios Instance (`lib/api/client.ts`)

```typescript
import axios from 'axios';
import { CONFIG } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import { SecureStorage } from '@/lib/secure-storage';
import { router } from 'expo-router';

export const client = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: inject auth token
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response: handle 401 → refresh → retry
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStorage.get('boimix_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${CONFIG.API_BASE_URL}/auth/token/refresh`, {
          refresh: refreshToken,
        });

        await SecureStorage.set('boimix_access_token', data.access);
        useAuthStore.getState().setAccessToken(data.access);
        processQueue(null, data.access);

        originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logout();
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

### Task 0.8 — React Query Provider (`lib/query/queryClient.ts`)

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 24 * 60 * 60 * 1000,   // 24 hours
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

---

### Task 0.9 — Zustand Stores

**`stores/authStore.ts`**:
```typescript
import { create } from 'zustand';
import { SecureStorage } from '@/lib/secure-storage';
import { queryClient } from '@/lib/query/queryClient';
import type { AuthUser } from '@/types/user';

interface Tokens { access: string; refresh: string; }
interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAccessToken: (token: string) => void;
  setSession: (user: AuthUser, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  isHydrated: false,

  setAccessToken: (token) => set({ accessToken: token }),

  setSession: async (user, tokens) => {
    await SecureStorage.set('boimix_access_token', tokens.access);
    await SecureStorage.set('boimix_refresh_token', tokens.refresh);
    await SecureStorage.set('boimix_user', JSON.stringify(user));
    set({ isAuthenticated: true, user, accessToken: tokens.access });
  },

  logout: async () => {
    await SecureStorage.remove('boimix_access_token');
    await SecureStorage.remove('boimix_refresh_token');
    await SecureStorage.remove('boimix_user');
    queryClient.clear();
    set({ isAuthenticated: false, user: null, accessToken: null });
  },

  hydrate: async () => {
    const token = await SecureStorage.get('boimix_access_token');
    const userJson = await SecureStorage.get('boimix_user');
    if (token && userJson) {
      set({
        accessToken: token,
        user: JSON.parse(userJson) as AuthUser,
        isAuthenticated: true,
      });
    }
    set({ isHydrated: true });
  },
}));
```

Create stub files for other stores (implement in later phases):
- `stores/cartStore.ts` — `{ itemCount: 0 }`
- `stores/wishlistStore.ts` — `{ ids: Set<string> }`
- `stores/filterStore.ts` — `{ mode: null, condition: null, priceMin: 0, priceMax: 9999 }`
- `stores/notificationStore.ts` — `{ unreadCount: 0 }`
- `stores/offlineQueueStore.ts` — `{ queue: [] }`

---

### Task 0.10 — SecureStore Wrapper (`lib/secure-storage.ts`)

```typescript
import * as SecureStore from 'expo-secure-store';

// SecureStore has a 2048-byte value limit per key.
// For values that may exceed this (serialized user objects), use chunked storage.
const CHUNK_SIZE = 1800; // conservative limit with overhead

export const SecureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await SecureStorage.setChunked(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    // Remove main key and any chunks
    await SecureStore.deleteItemAsync(key);
    let i = 0;
    while (true) {
      const chunkKey = `${key}_chunk_${i}`;
      const chunk = await SecureStore.getItemAsync(chunkKey);
      if (!chunk) break;
      await SecureStore.deleteItemAsync(chunkKey);
      i++;
    }
  },

  async setChunked(key: string, value: string): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    // Store chunk count in main key
    await SecureStore.setItemAsync(key, `__chunked__:${chunks.length}`);
    for (let i = 0; i < chunks.length; i++) {
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
    }
  },

  async getChunked(key: string): Promise<string | null> {
    const meta = await SecureStore.getItemAsync(key);
    if (!meta?.startsWith('__chunked__:')) return meta;
    const count = parseInt(meta.split(':')[1], 10);
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (!chunk) return null;
      chunks.push(chunk);
    }
    return chunks.join('');
  },
};
```

---

### Task 0.11 — Constants Setup

**`constants/colors.ts`**:
```typescript
export const COLORS = {
  brand: { primary: '#E84B1B', secondary: '#F5A623', dark: '#1A1A2E', light: '#F8F4F0' },
  text: { primary: '#1A1A2E', secondary: '#6B7280', muted: '#9CA3AF' },
  status: { success: '#10B981', warning: '#F59E0B', error: '#EF4444', info: '#3B82F6' },
  background: { default: '#FFFFFF', secondary: '#F9FAFB' },
  border: { default: '#E5E7EB', light: '#F3F4F6' },
} as const;
```

**`constants/routes.ts`**:
```typescript
export const ROUTES = {
  HOME: '/',
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  ONBOARDING: '/(auth)/onboarding',
  VERIFY_OTP: '/(auth)/verify-otp',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
  RESET_PASSWORD: '/(auth)/reset-password',
  COMPLETE_PROFILE: '/(auth)/complete-profile',
  CHOOSE_LANGUAGE: '/(auth)/choose-language',
  TABS_HOME: '/(tabs)/',
  EXPLORE: '/(tabs)/explore',
  ORDERS: '/(tabs)/orders',
  PROFILE: '/(tabs)/profile',
  BOOK_DETAIL: (slug: string) => `/book/${slug}`,
  USER_PROFILE: (username: string) => `/user/${username}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  NEAR_ME: '/near-me',
  UPLOAD: '/upload',
} as const;
```

---

### Phase 0 — Acceptance Criteria

- [ ] `npx expo start` launches without compilation errors.
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`).
- [ ] NativeWind `className` works on a test `<View className="bg-brand-primary p-4">`.
- [ ] `CONFIG.API_BASE_URL` reads correctly from `.env.development`.
- [ ] Axios client sends a request to the backend and receives a response.
- [ ] `SecureStorage.set` / `SecureStorage.get` round-trips a string correctly.
- [ ] `useAuthStore.hydrate()` reads from SecureStore and populates the store.

---

## Phase 1 — Auth Flow

### Goal

Implement the complete authentication journey: splash check → onboarding → login (email + Google) → register → OTP → forgot/reset password → complete profile → language selection. All auth tokens stored exclusively in SecureStore. All errors shown in Bangla.

---

### Task 1.1 — Types

**`types/user.ts`**:
```typescript
export type UserRole = 'user' | 'seller' | 'admin' | 'librarian';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  roles: UserRole[];
  isOnboarded: boolean;
  hasPassword: boolean;
  hasAcceptedTerms: boolean;
  emailVerified: boolean;
}

export interface UserProfile extends AuthUser {
  bio: string | null;
  location: {
    label: string;
    lat: number;
    lng: number;
  } | null;
  stats: {
    totalBooks: number;
    totalExchanges: number;
    totalBorrows: number;
    totalSold: number;
    followers: number;
    following: number;
    rating: number;
    reviewCount: number;
  };
  badges: Array<{ id: string; name: string; iconUrl: string; earnedAt: string }>;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  memberSince: string;
  lastActive: string;
}
```

---

### Task 1.2 — Auth API Service (`lib/api/auth.ts`)

Implement all auth service functions:

| Function | Method | Endpoint | Body | Returns |
|----------|--------|----------|------|---------|
| `login(payload)` | POST | `/auth/login` | `{ email, password }` | `{ access, refresh, user: AuthUser }` |
| `register(payload)` | POST | `/auth/register` | `{ full_name, email, password }` | `{ message }` |
| `verifyOtp(payload)` | POST | `/auth/verify-otp` | `{ email, otp }` | `{ access, refresh, user: AuthUser }` |
| `forgotPassword(email)` | POST | `/auth/forgot-password` | `{ email }` | `{ message }` |
| `resetPassword(payload)` | POST | `/auth/reset-password` | `{ token, password }` | `{ message }` |
| `googleAuth(idToken)` | POST | `/auth/google` | `{ id_token: idToken }` | `{ access, refresh, user: AuthUser }` |
| `refreshToken(refresh)` | POST | `/auth/token/refresh` | `{ refresh }` | `{ access }` |

---

### Task 1.3 — Validation Schemas (`utils/validationSchemas.ts`)

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'ইমেইল দিন').email('বৈধ ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষর').max(50, 'নাম সর্বোচ্চ ৫০ অক্ষর'),
  email: z.string().min(1, 'ইমেইল দিন').email('বৈধ ইমেইল দিন'),
  password: z
    .string()
    .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর')
    .regex(/[a-zA-Z]/, 'পাসওয়ার্ডে অক্ষর থাকতে হবে')
    .regex(/[0-9]/, 'পাসওয়ার্ডে সংখ্যা থাকতে হবে'),
  confirm_password: z.string(),
  terms_accepted: z.literal(true, { errorMap: () => ({ message: 'শর্তাবলী মেনে নিতে হবে' }) }),
}).refine((data) => data.password === data.confirm_password, {
  message: 'পাসওয়ার্ড মিলছে না',
  path: ['confirm_password'],
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP ৬ সংখ্যার হতে হবে').regex(/^\d+$/, 'শুধু সংখ্যা'),
});
```

---

### Screen 1.1 — Splash Screen (`app/index.tsx`)

**Purpose**: Entry point of the app. Checks auth state and redirects.

**UI Elements**:
- Centered BoiMix logo (SVG, 120×120)
- "BoiMix" wordmark text below logo
- Tagline: "বইয়ের দুনিয়ায় আপনাকে স্বাগতম" in Bangla

**Reanimated Animation**:
- Logo + tagline fade in from opacity 0 → 1 over 800ms with `withTiming`
- Animation starts immediately on mount
- Redirect happens AFTER animation completes (or after 1500ms max, whichever comes first)

**Logic Flow**:
1. On mount: call `useAuthStore.getState().hydrate()`
2. Check `accessToken` in hydrated store
3. If token exists: call `GET /me/profile`
   - 200 → `router.replace('/(tabs)/')`
   - 401 → Interceptor handles refresh → if success, `router.replace('/(tabs)/')`, if fail, `router.replace('/(auth)/login')`
4. If no token: check `AsyncStorage.getItem('onboarding_seen')`
   - `null` → `router.replace('/(auth)/onboarding')`
   - `'true'` → `router.replace('/(auth)/login')`

**Edge Cases**:
- **Network offline with valid token**: show splash, attempt profile fetch, on timeout (3s) go to tabs with `{ offline: true }` param so tabs show offline banner.
- **First launch, no token, no onboarding seen**: go to onboarding.
- **Corrupted SecureStore data** (parse error on user JSON): catch error, clear SecureStore, go to login.

**States**: Loading only (no error/empty states — redirect always happens).

---

### Screen 1.2 — Onboarding Screen (`app/(auth)/onboarding.tsx`)

**Purpose**: 3-slide introduction for first-time users.

**UI Elements**:
- Full-screen slides (100% width, 100% height)
- Each slide: illustration (centered, 60% width), title (bold, Bangla), subtitle (body, Bangla)
- Pagination dots: 3 dots at bottom, active dot is brand-primary, inactive is gray-300
- Skip button: top-right, text "এড়িয়ে যান"
- Next button: bottom-right, "পরবর্তী" for slides 1–2, "শুরু করুন" for slide 3

**Slide Content**:
| Slide | Illustration | Title | Subtitle |
|-------|-------------|-------|---------|
| 1 | `assets/images/onboarding/slide1.png` | বই আদান-প্রদান করুন | আপনার পছন্দের বই বিনিময় করুন পাশের বাড়ির বইপ্রেমীর সাথে |
| 2 | `assets/images/onboarding/slide2.png` | কাছের বইপ্রেমীদের খুঁজুন | আপনার আশেপাশে যারা বই ভালোবাসেন তাদের খুঁজে বের করুন |
| 3 | `assets/images/onboarding/slide3.png` | বইয়ের দুনিয়ায় আপনাকে স্বাগতম | ধার নিন, বিক্রি করুন, বিনিময় করুন — সব এক জায়গায় |

**Reanimated Slide Transition**: Horizontal slide with `useSharedValue` and `withSpring`.

**On completion (slide 3 "শুরু করুন" or Skip)**:
1. `AsyncStorage.setItem('onboarding_seen', 'true')`
2. `router.replace('/(auth)/login')`

**Edge Cases**:
- Back gesture disabled on Android (no `BackHandler` listener — Expo Router handles this via `gestureEnabled: false` in layout).
- Swipe gesture for slide navigation: use `PanGestureHandler` from `react-native-gesture-handler`.

---

### Screen 1.3 — Login Screen (`app/(auth)/login.tsx`)

**Purpose**: Email/password login and Google sign-in.

**UI Elements**:
- BoiMix logo (small, top)
- Heading: "স্বাগতম 👋"
- Subheading: "আপনার অ্যাকাউন্টে লগইন করুন"
- Email field (label: "ইমেইল", keyboardType: "email-address", autoCapitalize: "none", autoComplete: "email")
- Password field (label: "পাসওয়ার্ড", secureTextEntry, toggleable visibility icon)
- "পাসওয়ার্ড ভুলে গেছেন?" link (right-aligned, below password)
- Primary button: "লগইন করুন" (full width, brand-primary)
- Divider: "অথবা"
- Google button: Google icon + "Google দিয়ে লগইন করুন" (white, bordered)
- Footer: "অ্যাকাউন্ট নেই? " + "নিবন্ধন করুন" (link, brand-primary)

**Validation** (Zod, inline errors below each field):
- Email: required, valid email format
- Password: required, min 6 chars

**Form State Management**: Use `react-hook-form` with Zod resolver.

**On Submit (email/password)**:
1. Validate form (show inline errors if invalid)
2. Set `isLoading = true`, disable form
3. Call `authApi.login({ email, password })`
4. On success: `useAuthStore.getState().setSession(user, tokens)` → `router.replace('/(tabs)/')`
5. On error: set `isLoading = false`, show error

**Google Sign-In Flow**:
1. `GoogleSignin.signIn()` via `@react-native-firebase/auth`
2. Get `idToken` from result
3. Call `authApi.googleAuth(idToken)`
4. On success: `setSession` → redirect to tabs (or complete-profile if `!user.isOnboarded`)
5. User cancelled (`ERROR_USER_CANCELLED`): no action
6. Other error: show toast "Google সাইন ইন ব্যর্থ হয়েছে"

**Error States** (all in Bangla, shown as inline error or toast):
| HTTP Status | Code | Message |
|-------------|------|---------|
| 401 | `invalid_credentials` | "ইমেইল বা পাসওয়ার্ড ভুল" (inline) |
| 400 | `email_not_verified` | "ইমেইল ভেরিফাই করুন" + "পুনরায় পাঠান" button |
| 0 (network) | - | Toast: "ইন্টারনেট সংযোগ নেই" |
| 500 | - | Toast: "সার্ভার সমস্যা, পরে চেষ্টা করুন" |
| 429 | `rate_limited` | Toast: "অনেক চেষ্টা করা হয়েছে, ৫ মিনিট পর চেষ্টা করুন" |

**Loading State**: Button shows spinner, text changes to "লগইন হচ্ছে...", form is disabled.

---

### Screen 1.4 — Register Screen (`app/(auth)/register.tsx`)

**Purpose**: New user registration.

**UI Elements**:
- Back button (top-left)
- Heading: "নতুন অ্যাকাউন্ট তৈরি করুন"
- Full name field (label: "পূর্ণ নাম", autoComplete: "name")
- Email field
- Password field + strength indicator (Weak/Medium/Strong with color bar)
- Confirm password field
- Terms checkbox: "আমি [শর্তাবলী](link) পড়েছি এবং সম্মত আছি"
- Submit button: "নিবন্ধন করুন"
- Footer: "ইতিমধ্যে অ্যাকাউন্ড আছে? লগইন করুন"

**Password Strength Indicator**:
- Weak (< 8 chars or no letter/number): red bar, "দুর্বল"
- Medium (8+ chars, letter + number): orange bar, "মাঝারি"
- Strong (12+ chars, letter + number + special char): green bar, "শক্তিশালী"

**On Submit**:
1. Validate with `registerSchema`
2. Call `authApi.register({ full_name, email, password })`
3. On success: `router.push({ pathname: '/(auth)/verify-otp', params: { email } })`
4. On error:
   - `email_exists` (400 with field error `email`): show inline "এই ইমেইল আগে থেকেই নিবন্ধিত"
   - Network/server: toast

---

### Screen 1.5 — OTP Verify Screen (`app/(auth)/verify-otp.tsx`)

**Purpose**: Verify 6-digit OTP sent to email.

**Route Params**: `email` (string), `mode` (optional: `'register'` | `'reset'`, default `'register'`)

**UI Elements**:
- Back button
- Heading: "ইমেইল যাচাই করুন"
- Subtext: "আমরা {email} -এ একটি কোড পাঠিয়েছি"
- OTP Input: 6 separate `TextInput` cells (each 48×48, bordered, centered digit, keyboard: `numeric`)
  - On digit entry: auto-advance focus to next cell
  - On backspace in empty cell: focus previous cell
  - On paste: fill all 6 cells if clipboard has 6+ digits
- Resend button: "কোড পুনরায় পাঠান" (disabled for 60s countdown, shows countdown "৫৭ সেকেন্ড পরে পুনরায় পাঠান")
- Loading state: spinner overlay when verifying

**On 6th digit entered**: Auto-submit (call verifyOtp).

**On Submit**:
- `mode = 'register'`: POST `/auth/verify-otp → { access, refresh, user }`
  - If `user.isOnboarded = false`: `router.replace('/(auth)/complete-profile')`
  - If `user.isOnboarded = true`: `router.replace('/(tabs)/')`
- `mode = 'reset'`: POST `/auth/verify-otp?mode=reset → { reset_token }`
  - `router.replace({ pathname: '/(auth)/reset-password', params: { token: reset_token } })`

**Error States**:
| Situation | Display |
|-----------|---------|
| Wrong OTP | Shake animation on cells, "ভুল কোড দেওয়া হয়েছে (X/5 চেষ্টা বাকি)" |
| OTP expired | "কোডের মেয়াদ শেষ, নতুন কোড পাঠান" (resend button enabled immediately) |
| 5 wrong attempts | Lock all inputs, "আপনার অ্যাকাউন্ট সাময়িকভাবে লক হয়েছে, ১৫ মিনিট পরে চেষ্টা করুন" |

**Clipboard Detection**: On focus of first cell, check `Clipboard.getStringAsync()`. If it's a 6-digit number string, auto-fill all cells.

---

### Screen 1.6 — Forgot Password Screen (`app/(auth)/forgot-password.tsx`)

**Purpose**: Request password reset email.

**UI Elements**:
- Back button
- Heading: "পাসওয়ার্ড পুনরুদ্ধার"
- Subtext: "আপনার ইমেইল দিন, আমরা একটি কোড পাঠাব"
- Email field
- Submit button: "কোড পাঠান"
- Loading state: button spinner

**On Submit**:
1. Validate email
2. POST `/auth/forgot-password`
3. On success (200 OR 404 — intentionally generic for security): show generic toast "যদি এই ইমেইলে কোনো অ্যাকাউন্ড থাকে, আমরা একটি কোড পাঠাব" → `router.push({ pathname: '/(auth)/verify-otp', params: { email, mode: 'reset' } })`

**Edge Case**: Do NOT reveal whether the email exists (show same message for 200 and 404).

---

### Screen 1.7 — Reset Password Screen (`app/(auth)/reset-password.tsx`)

**Purpose**: Set a new password using the token from OTP verification.

**Route Params**: `token` (string)

**UI Elements**:
- Heading: "নতুন পাসওয়ার্ড তৈরি করুন"
- New password field + strength indicator
- Confirm password field
- Submit button: "পাসওয়ার্ড পরিবর্তন করুন"

**On Submit**:
1. Validate passwords match and meet strength
2. POST `/auth/reset-password { token, password }`
3. On success: `router.replace('/(auth)/login')` + show success toast "পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে"
4. On error (invalid/expired token): "লিঙ্কের মেয়াদ শেষ হয়ে গেছে, আবার চেষ্টা করুন" + back to login

---

### Screen 1.8 — Complete Profile Screen (`app/(auth)/complete-profile.tsx`)

**Purpose**: Post-registration profile completion (optional).

**UI Elements**:
- Heading: "আপনার প্রোফাইল সম্পন্ন করুন"
- Subtext: "এড়িয়ে যেতে পারেন, পরেও করা যাবে"
- Avatar picker: circular 100×100 container, tap to open `expo-image-picker`, shows preview after selection
- Bio field (optional): multiline, max 200 chars, char counter shown
- Location search: text input → debounced GET `/locations/search?q=` → dropdown list → select to store `{ label, lat, lng }`
- Skip button (top-right)
- Submit button: "সম্পন্ন করুন"

**Location Permission Flow**:
1. On location field focus: request `Location.requestForegroundPermissionsAsync()`
2. If granted: pre-fill with current location via `GET /locations/reverse?lat=&lng=`
3. If denied: allow manual text search only (no GPS pre-fill)
4. If denied on Android "Don't ask again": show "সেটিংস থেকে অনুমতি দিন" button linking to app settings

**Avatar Upload Flow**:
1. `ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1] })`
2. If image > 5MB (5,242,880 bytes): `compressImage(uri, { maxSize: 1024, format: 'webp' })`
3. POST `/media/uploads` as `multipart/form-data`
4. Store returned `url` in component state (shown in circular preview)
5. Upload happens on "সম্পন্ন করুন" submit, not immediately on selection
6. If upload fails: show "ফটো আপলোড ব্যর্থ হয়েছে, এড়িয়ে যান?" dialog

**On Submit**:
1. Upload avatar if selected (shows progress)
2. PATCH `/me/profile { bio, location, avatar_url }`
3. Update `authStore.user`
4. `router.replace('/(auth)/choose-language')`

**On Skip**: `router.replace('/(auth)/choose-language')` without API call.

---

### Screen 1.9 — Choose Language Screen (`app/(auth)/choose-language.tsx`)

**Purpose**: Initial language preference selection.

**UI Elements**:
- Heading: "আপনার ভাষা বেছে নিন / Choose your language"
- Two large buttons:
  - "বাংলা" (Bangla flag, larger font)
  - "English" (English text)

**On Select**:
1. `AsyncStorage.setItem('app_language', 'bn' | 'en')`
2. Apply to i18n context (if i18n library used)
3. `router.replace('/(tabs)/')`

**Edge Case**: If this screen is reached again (e.g., from settings language change), show current language as selected. Default if skipped: `'bn'`.

---

### Phase 1 — Acceptance Criteria

- [ ] Fresh install → onboarding 3 slides → register → OTP verify → complete profile → choose language → home tab (full happy path works)
- [ ] Login with correct credentials → navigates to home tab
- [ ] Login with wrong credentials → shows Bangla inline error "ইমেইল বা পাসওয়ার্ড ভুল"
- [ ] Token stored in SecureStore persists across app kill/restart → user stays logged in
- [ ] 401 response triggers refresh → retries original request → succeeds
- [ ] 401 after refresh failure → clears tokens → redirects to login
- [ ] Google sign-in produces auth token and navigates to tabs
- [ ] All form fields show inline Zod validation errors in Bangla
- [ ] OTP screen: paste 6 digits from clipboard → auto-fills all cells
- [ ] OTP screen: 5 wrong attempts → inputs lock + lockout message shown
- [ ] Forgot password → shows generic message regardless of whether email exists
- [ ] Reset password → redirects to login with success toast
- [ ] Complete profile: skip button navigates to language screen without API call
- [ ] Avatar picker: image >5MB is compressed before upload
- [ ] Location permission denied → manual text search fallback works

---

## Phase 2 — Core Discovery

### Goal

Implement the main content screens: Home tab with all book sections, Explore tab with search + filters + infinite scroll + map view, Book Detail screen, dedicated Search screen, and Near Me map view.

---

### Screen 2.1 — Home Tab (`app/(tabs)/index.tsx`)

**Purpose**: Main discovery feed.

**Header** (custom, not native header):
- Left: BoiMix logo (40px height)
- Center: Tappable search bar (gray, placeholder "বই খুঁজুন...") → navigates to `app/search.tsx` (does NOT perform search here)
- Right: Bell icon with unread notification count badge (from `notificationStore.unreadCount`)

**Pull-to-Refresh**: `RefreshControl` on outer `ScrollView` → refetch all section queries.

**Sections** (vertical scroll, `ScrollView` for the outer container, FlashList for each horizontal book list):

| Section | API Endpoint | Page Size | Display |
|---------|-------------|-----------|---------|
| Hero Banner | Static/CMS (future) | 5 items | Horizontal `FlatList`, auto-scroll every 4s |
| Quick Action Chips | Static | 4 items | Horizontal scrollable chips |
| Trending Books | `GET /books/?ordering=-rating&page_size=10` | 10 | Horizontal BookCard |
| New Arrivals | `GET /books/?ordering=-created_at&page_size=10` | 10 | Horizontal BookCard |
| Near Me | `GET /books/nearby?radius=10&lat=&lng=` | 8 | Horizontal BookCard (requires location) |
| For You | `GET /books/recommendations` (auth) or trending (unauth) | 8 | Horizontal BookCard |
| Central Library | `GET /books/?provider_type=library&page_size=8` | 8 | Horizontal BookCard |

**Quick Action Chips**:
| Chip | Label | Action |
|------|-------|--------|
| 📚 | বিক্রয় | Navigate to Explore with `mode=sell` pre-filter |
| 🔄 | বিনিময় | Navigate to Explore with `mode=exchange` |
| 📖 | ধার | Navigate to Explore with `mode=borrow` |
| 📍 | কাছের বই | Navigate to `app/near-me.tsx` |

**Hero Banner Auto-Scroll**: `FlatList` horizontal, `setInterval(4000)` to advance. Pause on `onScrollBeginDrag`. Resume on `onScrollEndDrag`. Show pagination dots below.

**Loading State (per section)**: 3–4 horizontal `BookCardSkeleton` components in a row.

**Error State (per section)**: "লোড হয়নি" text + "আবার চেষ্টা" button that calls `refetch()` for that specific query.

**Empty Section**: Hide the entire section (including its header) if `data.results.length === 0`.

**Near Me Edge Cases**:
- Location permission not yet requested: show section with "অনুমতি দিন" prompt button.
- Permission denied: hide Near Me section entirely, show a small banner: "কাছের বই দেখতে লোকেশন অনুমতি দিন" with settings link.
- Location unavailable (GPS off): show "লোকেশন সার্ভিস বন্ধ" message.

**Performance**: Each section's data is fetched independently (separate `useQuery` calls). Sections render as soon as their own data arrives — no waiting for all sections.

---

### Screen 2.2 — Explore Tab (`app/(tabs)/explore.tsx`)

**Purpose**: Search and filter all books.

**Search Bar**:
- Autofocused when tab is tapped (not on initial render of the app)
- Input debounced 300ms with `useDebounce` hook
- On value change: update URL query param `q` for shareable state
- Clear button (×) when input has text

**Mode Filter Chips** (horizontal scroll, single-select):
- সব | বিক্রয় | বিনিময় | ধার | কেন্দ্রীয় লাইব্রেরি
- Active chip: brand-primary background, white text
- Inactive: white background, gray border

**Advanced Filter Bottom Sheet** (triggered by filter icon button with badge showing active filter count):

| Filter | Type | Options |
|--------|------|---------|
| Category | Multi-select | From `GET /books/categories` |
| Condition | Single-select | নতুন / চমৎকার / ভালো / ঠিকঠাক / খারাপ |
| Price Range | Dual-handle slider | ৳0 – ৳5000 |
| Distance | Single-select chips | ১ কি.মি / ৫ / ১০ / ২০ / ৫০ কি.মি |
| Sort By | Single-select | রেটিং / নতুন / কম দাম / বেশি দাম / দূরত্ব |

Filter state lives in `filterStore` (Zustand). When filter sheet is dismissed with Apply, trigger new search.

**Results**:
- `FlashList` in 2-column grid layout
- Item: `BookCard` (variant="grid")
- `estimatedItemSize={240}`
- Infinite scroll: `useInfiniteQuery` for `GET /books/` or `GET /search/books/?q=`
- On end reached (`onEndReachedThreshold={0.5}`): call `fetchNextPage()`
- Footer: loading spinner when `isFetchingNextPage`, "আর বই নেই" when `!hasNextPage`

**Map View Toggle** (top-right icon button):
- Switches between grid list and full-screen map (`react-native-maps`)
- Map view: markers at book locations (use `ownerId` location)
- Cluster markers with `react-native-maps-clustering` when >5 markers in area
- Tap marker: show bottom sheet with book preview card

**Empty State**: "কোনো বই পাওয়া যায়নি" illustration + "ফিল্টার পরিষ্কার করুন" button.

**Edge Cases**:
- Filter count badge on filter button: count non-default active filters.
- Keyboard avoidance on Android: wrap in `KeyboardAvoidingView` with `behavior="height"`.
- Filter state persists across tab switches (Zustand store, not local state).
- Special characters in search query: encoded automatically by Axios `params` serialization.

---

### Screen 2.3 — Book Detail Screen (`app/book/[slug].tsx`)

**Purpose**: Full book detail view with purchase/borrow/exchange actions.

**Route Param**: `slug` (string)
**API**: `GET /books/{slug}`

**UI Sections** (vertical ScrollView):

**1. Image Gallery** (top):
- Horizontal `FlatList` of book photos (or single cover if only one)
- Pagination dots below
- Tap image: open full-screen zoom viewer (lightbox) using `react-native-image-zoom` or `expo-image` zoom support

**2. Book Info**:
- Title (bold, large)
- Author (link → `app/user/[authorSlug].tsx`)
- Condition badge (colored chip: নতুন/ভালো/etc.)
- Star rating (read-only 5-star display) + review count "({count}টি রিভিউ)"
- Tags (horizontal chip list)

**3. Availability Info** (conditional based on `availabilityMode`):
| Mode | Display |
|------|---------|
| `sell` | Price in BDT, original price struck through if discounted |
| `exchange` | "বিনিময়" badge + exchange preferences text |
| `borrow` | Borrow duration, deposit amount, daily/weekly rate |
| `library` | Library name, membership required info |

**4. Action Buttons** (conditional):
- If `book.ownerId === currentUser.id` OR `book.sellerId === currentUser.id`: show "সম্পাদনা করুন" button only
- If book is out of stock: disable action buttons, show "স্টক নেই" notice
- Otherwise (based on `availabilityMode`):
  - `sell`: "কার্টে যোগ করুন" (secondary) + "এখনই কিনুন" (primary)
  - `exchange`: "বিনিময়ের প্রস্তাব পাঠান"
  - `borrow`: "ধার নিন"

**5. PDF Preview Button** (if `book.hasPreviewPdf = true`):
- "বইয়ের ভেতরে দেখুন ({book.previewPdfPages} পৃষ্ঠা)" button
- Opens `expo-web-browser` with `previewPdfUrl`

**6. Description**: Collapsible text (clamped at 3 lines, "আরও দেখুন" expand button)

**7. Seller/Owner Card**:
- Avatar (40px), name, username, rating (stars + count), "X% সাড়া দেন", location, "অনুসরণ করুন" button
- Tap card → `app/user/[username].tsx`

**8. Q&A Section**:
- GET `/books/{slug}/questions?page_size=5`
- Each question: avatar + name + question text + answers
- "প্রশ্ন করুন" button (opens modal/bottom sheet with text input)
- POST `/books/{slug}/questions { question: text }`

**9. Reviews Section**:
- GET `/books/{slug}/reviews?page_size=5`
- Each review: avatar + name + stars + comment + date
- "সব রিভিউ দেখুন" → paginated review list screen (future phase)
- Empty: "এখনো কোনো রিভিউ নেই"

**10. More from Seller**:
- GET `/books/?seller_id={sellerId}&page_size=4&exclude={slug}`
- Horizontal FlashList of BookCards

**Loading State**: Skeleton placeholders for all sections.

**Error States**:
- 404: Full-screen "বই পাওয়া যায়নি 😔" + "ফিরে যান" button.
- Other errors: Retry button.

**Edge Cases**:
- Book has no images: show placeholder illustration instead of gallery.
- Very long description (>500 chars): collapsed by default.
- Review count is 0: show empty state message, not "0টি রিভিউ".
- Multiple images: gallery indicator shows "2/5" in top-right corner.

---

### Screen 2.4 — Search Screen (`app/search.tsx`)

**Purpose**: Dedicated search with history.

**UI Elements**:
- Autofocused search bar with back button
- When empty:
  - "সাম্প্রতিক খোঁজ" header
  - List of recent searches (AsyncStorage `search_history`, max 10, most recent first)
  - Each: clock icon + search term + ×(remove) button
  - "সব মুছুন" link
- When typing (debounced 200ms):
  - Suggestions from `GET /search/suggestions?q={q}` (book titles, author names)
  - Each suggestion: search icon + text; tap fills search bar + executes search
- When results loaded: same `FlashList` grid as Explore

**On Search Execute**:
1. Add term to `AsyncStorage` history (prepend, deduplicate, limit 10)
2. Navigate to Explore with `q` param pre-filled (or show results inline)

---

### Screen 2.5 — Near Me Map View (`app/near-me.tsx`)

**Purpose**: Map-based discovery of nearby books.

**UI Layout**:
- Full-screen `MapView` from `react-native-maps` (Google Maps on Android)
- Initial region: user's current location (or Dhaka center `{ lat: 23.8103, lng: 90.4125 }` if no permission)
- Book markers: custom marker with book cover thumbnail (50×50)
- Cluster when >5 books in viewport

**Bottom Sheet** (slides up from bottom, draggable):
- Height: 40% of screen
- Book list: `FlashList` of BookCards in horizontal mode
- Updates when map region changes (re-fetch nearby books for new viewport bounds)

**Location Flow**:
1. On mount: request location permission with rationale dialog
2. If granted: get current position, center map, fetch `/books/nearby?lat=&lng=&radius=10`
3. "আমার অবস্থানে যান" FAB button: re-centers map on current location

**Edge Cases**:
- Permission denied: show map centered on Dhaka, all books (no location filter), banner: "লোকেশন অনুমতি দিন কাছের বই দেখতে"
- Marker tap: show bottom sheet with single book detail card, "দেখুন" button → Book Detail
- Loading markers: show loading spinner on map center

---

### Phase 2 — Acceptance Criteria

- [ ] Home tab loads all sections with proper loading skeletons
- [ ] Pull-to-refresh refetches all home sections simultaneously
- [ ] Explore search with debounce (300ms) does not spam API
- [ ] Infinite scroll loads next page exactly when user reaches 50% from bottom
- [ ] BookCard shows correct badge for sell/exchange/borrow
- [ ] BookCard shows "স্টক নেই" badge and disabled cart button when isOutOfStock
- [ ] Book detail shows correct action buttons for each availabilityMode
- [ ] User cannot see buy/borrow actions on their own book (edit button shown instead)
- [ ] Book detail 404 → shows "বই পাওয়া যায়নি" full-screen state
- [ ] Filter selections in Explore persist when navigating to book detail and back
- [ ] Map view shows clustered markers for nearby books
- [ ] Recent searches persist across app restarts (AsyncStorage)
- [ ] All section loading/error/empty states render correctly

---

## Phase 3 — Transactions & Cart

### Goal

Implement the full purchase, borrow, and exchange transaction flows including cart, checkout with payment methods, wishlist, order history, and borrow/exchange specific flows.

---

### Screen 3.1 — Cart Screen (`app/cart.tsx`)

**API**: `GET /me/cart`
**Data shape**: `{ items: CartItem[], total: number, item_count: number }`

**UI Elements**:
- Header: "আমার কার্ট" + item count badge
- Items list (`FlashList`):
  - Each item: book cover (60×80), title, author, condition, price, quantity stepper (−/+), ×(remove), checkbox
  - Checkbox: selected items contribute to subtotal
  - Out-of-stock item: yellow warning banner "এই বই এখন পাওয়া যাচ্ছে না", checkbox disabled, grayed
  - Quantity > available stock: cap at max, show "শুধু X টি পাওয়া যাচ্ছে" tooltip
- Group by seller: seller name as section header
- Coupon section: text input + "প্রয়োগ করুন" button → POST `/coupons/validate { code, cart_items }` → show discount amount or error
- Order Summary: Subtotal, delivery fee, coupon discount (if applied), Total (bold)
- "চেকআউট করুন" button (disabled if no items selected)

**Empty State**: Book illustration + "কার্ট খালি আছে" + "বই খুঁজুন" button → Explore tab.

**Optimistic Updates**:
- Quantity change: immediately update `cartStore` count + local state. PATCH `/me/cart/items/{id} { quantity }`. On error: revert.
- Remove item: immediately remove from list with slide-out animation. DELETE `/me/cart/items/{id}`. On error: revert with toast.

**Edge Cases**:
- Navigating back from checkout without completing: cart still intact.
- Items from multiple sellers: each group shows seller name and delivery estimate.

---

### Screen 3.2 — Checkout Screen (`app/checkout.tsx`)

**Purpose**: Complete purchase.

**Navigation**: Receives selected cart item IDs from cart screen params.

**UI Sections**:

**1. Delivery Address**:
- If user has saved addresses: show list (radio select)
- "নতুন ঠিকানা যোগ করুন" (opens address modal)
- Required fields: full name, phone, district, thana, full address

**2. Delivery Method**:
- "হোম ডেলিভারি" (fee shown)
- "নিজে নিয়ে যাব" (pickup from seller's location, free)

**3. Order Summary**:
- Selected items list (non-editable, tap → opens book detail)
- Subtotal
- Delivery fee (depends on delivery method)
- Coupon discount (if applied from cart)
- **Total** (bold, large)

**4. Payment Method** (single-select):
| Method | Icon | Notes |
|--------|------|-------|
| bKash | bKash logo | Opens bKash payment gateway in `expo-web-browser` |
| Nagad | Nagad logo | Opens Nagad payment gateway |
| Credit/Debit Card | Card icon | Opens card payment gateway |
| Cash on Delivery | Cash icon | No redirect, COD note shown |

**On "অর্ডার করুন"**:
1. Validate address selected
2. Validate payment method selected
3. POST `/orders/` with `{ cart_item_ids, delivery_address, payment_method, delivery_method }`
4. If COD: navigate to order confirmation screen immediately
5. If bKash/Nagad/Card: open payment URL from response in `expo-web-browser` → handle return URL → check order status → navigate to confirmation
6. During processing: full-screen overlay "অর্ডার প্রক্রিয়াধীন..." (non-dismissable)

**Edge Cases**:
- Payment gateway URL opens in external browser: on return to app, check order status via `GET /orders/{id}`.
- Payment cancelled (gateway cancelled URL received): return to checkout, show "পেমেন্ট বাতিল করা হয়েছে" toast.
- Network fails during POST: DO NOT auto-retry. Show "পেমেন্টের অবস্থা অজানা। অর্ডার হিস্ট্রি চেক করুন" alert with link to orders.
- Address form validation: phone must be valid BD number (+880 or 01XXXXXXXXX).

---

### Screen 3.3 — Wishlist Screen (`app/wishlist.tsx`)

**API**: `GET /me/wishlist`

**UI Elements**:
- Header: "আমার উইশলিস্ট"
- Book list (`FlashList`, grid 2-column)
- Each item: `BookCard` + ×(remove) overlay button
- Long press: multi-select mode → bulk remove button

**Actions**:
- Remove: DELETE `/me/wishlist/items/{book_id}` + optimistic update (remove from list immediately)
- Add to cart: POST `/me/cart` for selected book

**Empty State**: Heart illustration + "উইশলিস্ট খালি" + "বই খুঁজুন" button.

**Sync**: Wishlist IDs in `wishlistStore` Zustand store are synced when this screen loads. BookCard heart buttons across the app use `wishlistStore.ids.has(bookId)` for instant state.

---

### Screen 3.4 — Orders Screen (`app/(tabs)/orders.tsx`)

**Purpose**: View all transaction history.

**UI**: Tab bar with 3 tabs (top, using `TabView` or segment control):

| Tab | Label | API | Status values |
|-----|-------|-----|--------------|
| 1 | কেনা বই | `GET /me/orders` | pending / confirmed / shipped / delivered / cancelled |
| 2 | ধার | `GET /me/borrow-orders` | pending / approved / active / returned / overdue |
| 3 | বিনিময় | `GET /me/exchanges` | pending / accepted / rejected / completed |

**Each Order Row**:
- Book cover thumbnail (40×56)
- Book title + author
- Status badge (color-coded)
- Date
- Total amount (for purchase orders)
- Tap → Order detail screen (future phase or modal)

**Status Badge Colors**:
| Status | Color |
|--------|-------|
| pending | orange |
| confirmed | blue |
| shipped | purple |
| delivered | green |
| cancelled | red |
| approved | blue |
| active | green |
| returned | gray |
| overdue | red (bold) |

**Overdue Borrow**: Show overdue days in red + fine amount: "X দিন অতিক্রান্ত, জরিমানা: ৳Y".

**Empty State per tab**: "কোনো [কেনা বই / ধার / বিনিময়] নেই" + relevant illustration.

---

### Screen 3.5 — Borrow Flow (`app/borrow/`)

**`app/borrow/cart.tsx`** — Borrow Cart:
- GET `/me/borrow-cart`
- Items: book cover, title, author, borrow duration options (1 week, 2 weeks, 1 month), deposit info
- "যোগ্যতা যাচাই করুন" button → POST `/me/borrow-cart/check-eligibility`
  - On fail: show reason (membership required, too many active borrows, etc.)
  - On pass: navigate to `app/borrow/checkout.tsx`

**`app/borrow/checkout.tsx`** — Borrow Checkout:
- Selected books, duration, delivery preference
- Deposit amount (refundable) prominently shown
- Refund policy info (expandable text)
- "ধার নিশ্চিত করুন" → POST `/borrow-orders/`

**Edge Cases**:
- Deposit required: show amount, "কীভাবে ফেরত পাবেন" explain link.
- Already has active borrow from same seller: "আপনি ইতিমধ্যে এই বিক্রেতার কাছ থেকে ধার নিয়েছেন" warning.
- Book not available for borrow (availabilityMode changed): show "এই বইটি এখন ধার নেওয়া যাচ্ছে না" and remove from borrow cart.

---

### Screen 3.6 — Exchange Flow (`app/exchange/`)

**`app/exchange/propose.tsx`** — Propose Exchange:
- Shows target book (the book user wants to exchange for)
- "আপনার কোন বই দিতে চান?" — list of user's listed books from `GET /me/library?mode=exchange`
- Select one own book → review exchange proposal summary
- "প্রস্তাব পাঠান" → POST `/exchanges/ { offered_book_id, requested_book_id }`
- On success: "প্রস্তাব পাঠানো হয়েছে" toast + navigate back

**Edge Cases**:
- User has no books listed: "আপনার কোনো বই তালিকায় নেই। প্রথমে একটি বই যোগ করুন।" with upload link.
- Both books must be available (not in another active exchange): validate client-side + show server error if race condition.

**`app/exchange/[id].tsx`** — Exchange Offer Detail:
- Shows offer: my book ↔ their book
- Accept / Reject buttons (for receiver)
- Status timeline
- POST `/exchanges/{id}/accept` or `/exchanges/{id}/reject`

---

### Phase 3 — Acceptance Criteria

- [ ] Add to cart from book detail works (cart count badge increments)
- [ ] Cart shows correct subtotal when quantity changes (optimistic update)
- [ ] Removing cart item removes it immediately with animation, reverts on error
- [ ] Checkout flow completes end-to-end with COD (order appears in Orders tab)
- [ ] Wishlist heart toggle is instant (Zustand optimistic) across all BookCard instances
- [ ] Wishlist persists across app restarts (server-side, re-fetched on app open)
- [ ] Orders tab shows three tabs with correct data from respective endpoints
- [ ] Overdue borrow shows red text with fine amount
- [ ] Borrow checkout validates eligibility before allowing submission
- [ ] Exchange proposal: if no books listed, shows prompt to upload first
- [ ] Payment gateway redirect opens in in-app browser (not external Chrome)

---

## Phase 4 — Profile & Seller Features

### Goal

Implement user profile (own + public), multi-step book upload with ISBN scanning, settings, notifications, and real-time WebSocket chat.

---

### Screen 4.1 — Profile Tab (`app/(tabs)/profile.tsx`)

**API**: `GET /me/profile`

**UI Sections**:

**1. Profile Header**:
- Cover photo (or brand gradient background)
- Avatar (80px, circular, tap to change)
- Name (bold), username (@username), "ভেরিফাইড" badge if verified
- Stats row: Library | বিনিময় | ধার | বিক্রয় | অনুসরণকারী | অনুসরণ করছি

**2. Badges**:
- Horizontal scroll of earned badge icons with labels
- Empty: "কোনো ব্যাজ নেই এখনো" (hide section if empty for new users)

**3. Quick Links** (list):
- 📦 আমার অর্ডার → Orders tab
- ❤️ উইশলিস্ট → Wishlist screen
- 📚 আমার লাইব্রেরি → library sub-screen
- ⚙️ সেটিংস → Settings screen
- 🚪 লগআউট (red text)

**4. My Listed Books** (last 4, with "সব দেখুন" link):
- 2-column `FlashList` of BookCards

**Avatar Change Flow**:
1. Tap avatar → bottom sheet: "গ্যালারি থেকে বেছে নিন" / "ক্যামেরা"
2. `ImagePicker` → compress → upload → PATCH `/me/profile { avatar_url }`
3. Optimistically update `authStore.user.avatarUrl`

**Logout**:
1. Confirm dialog: "লগআউট করতে চান?"
2. On confirm: `useAuthStore.getState().logout()` → `router.replace('/(auth)/login')`

**Edge Cases**:
- New user (all stats are 0): show onboarding prompt cards: "প্রথম বইটি যোগ করুন 📚".

---

### Screen 4.2 — Public User Profile (`app/user/[username].tsx`)

**API**: `GET /users/{username}/profile` (or `/me/profile` if username matches current user)

**Differences from own profile**:
- No edit/avatar change controls
- Follow / Unfollow button (POST `/users/{username}/follow`, DELETE `/users/{username}/follow`)
- Follow button: optimistic update (Zustand or local state)
- Message button → opens/creates conversation → `app/messages/{id}.tsx`

**Edge Cases**:
- If `username === currentUser.username`: redirect to `/(tabs)/profile`.
- Unknown username (404): full-screen "ব্যবহারকারী পাওয়া যায়নি" + back button.

---

### Screen 4.3 — Book Upload Screen (`app/upload/index.tsx`)

**Purpose**: Multi-step form to list a new book.

**Step Indicator**: Horizontal progress bar showing current step (1–6).

**Step 1 — ISBN Scan / Manual Entry**:
- Primary: "ISBN স্ক্যান করুন" button → `expo-barcode-scanner` overlay
  - On scan: GET `/books/isbn/{isbn}` → auto-fill step 2 fields
  - ISBN not found: show "বইটি পাওয়া যায়নি, ম্যানুয়ালি লিখুন" with prefilled ISBN
- Alternative: "ম্যানুয়ালি লিখুন" text button

**Step 2 — Book Details**:
| Field | Type | Validation |
|-------|------|-----------|
| Title | TextInput | Required, min 2 chars |
| Author | TextInput | Required |
| Publisher | TextInput | Optional |
| Year published | TextInput (numeric) | Optional, 4-digit year |
| Category | Select (from `/books/categories`) | Required |
| Language | Select (বাংলা / English / Other) | Required |
| Condition | Segmented control (নতুন/চমৎকার/ভালো/ঠিকঠাক/খারাপ) | Required |
| ISBN | TextInput | Optional |

**Step 3 — Availability & Pricing**:
| Field | Conditional |
|-------|-----------|
| Mode | Required: বিক্রয় / বিনিময় / ধার / সংগ্রহ |
| Price | Required if mode=sell |
| Original price | Optional (for showing discount) |
| Exchange preferences | Required if mode=exchange (text description of wanted books) |
| Borrow rate | Required if mode=borrow (per week in BDT) |
| Deposit required | if mode=borrow (BDT amount) |
| Quantity | Required, default 1 |

**Step 4 — Photos (up to 5)**:
- 5-slot image grid (first slot is "প্রচ্ছদ" = cover)
- Tap slot: `ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8 })`
- Selected images shown as thumbnails with ×(remove) overlays
- "ক্যামেরা" icon for taking photos directly
- Compress each to max 1200px WebP before upload
- Upload all simultaneously (Promise.all) on submit

**Step 5 — Location**:
- Shows user's saved location as default
- Option to change: location search (same as complete-profile)
- "আমার বর্তমান অবস্থান ব্যবহার করুন" (GPS)

**Step 6 — Review & Submit**:
- Summary of all entered information
- Expandable sections for each step
- "জমা দিন" (POST `/books/`) with multipart/form-data

**Draft Save**: `AsyncStorage.setItem('book_upload_draft', JSON.stringify(formValues))` after each step. On return to upload screen, ask "আগের ড্রাফট আছে, চালিয়ে যাবেন?"

**On Submit**:
1. Validate all required fields across all steps
2. Upload all images (show per-image upload progress)
3. POST `/books/` with form data
4. On success: "বই সফলভাবে যোগ করা হয়েছে 🎉" toast + navigate to profile
5. Clear draft from AsyncStorage

**Edge Cases**:
- Image compression fails: use original, log to Sentry (future).
- Network fails during image upload: show per-image retry button.
- User navigates back mid-upload: show "আপলোড চলছে, ছেড়ে যেতে চান?" dialog.
- User location not set: show prompt to add in step 5.
- ISBN scanner permission denied: show "ক্যামেরা অনুমতি দিন স্ক্যান করতে" + manual entry option.

---

### Screen 4.4 — Settings Screen (`app/settings.tsx`)

**Sections**:

**1. Profile** (links to edit forms):
- নাম ও বায়ো সম্পাদনা → modal/screen with name + bio fields
- ছবি পরিবর্তন → ImagePicker flow
- লোকেশন পরিবর্তন → location search

**2. Account**:
- পাসওয়ার্ড পরিবর্তন:
  - Fields: current password, new password, confirm
  - POST `/me/change-password { current_password, new_password }`
  - If user signed up via Google (no password): show "Google অ্যাকাউন্টে পাসওয়ার্ড নেই"
- ইমেইল যাচাই: if not verified, show resend button

**3. Notifications**:
- Toggle switches for each notification type (store preference in backend)
- "পুশ নোটিফিকেশন" master toggle

**4. Appearance**:
- Language: বাংলা / English toggle → updates AsyncStorage + i18n

**5. Privacy**:
- Privacy policy link
- Terms of service link

**6. Danger Zone** (red section):
- অ্যাকাউন্ট মুছে ফেলুন:
  - First dialog: "আপনি কি নিশ্চিত? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।"
  - Second dialog: type input "আমি নিশ্চিত" to confirm
  - On confirm: DELETE `/me/account` → logout → `router.replace('/(auth)/login')` + toast "অ্যাকাউন্ট মুছে ফেলা হয়েছে"

---

### Screen 4.5 — Notifications Screen (`app/notifications.tsx`)

**API**: `GET /me/notifications?page=1&page_size=20`

**UI**:
- "সব পড়া" button (top-right) → PATCH `/me/notifications/mark-all-read`
- `FlashList` grouped by date (Today, Yesterday, Earlier)
- Each notification row:
  - Icon (based on type — see table below)
  - Title + preview text (truncated 2 lines)
  - Relative time ("২ ঘণ্টা আগে")
  - Unread: bold + light blue background
  - Read: normal weight + white background

**Notification Icons**:
| Type | Icon | Label |
|------|------|-------|
| `borrow_request` | 📚 | ধার চাওয়া হয়েছে |
| `borrow_approved` | ✅ | ধার অনুমোদিত |
| `borrow_returned` | 🔄 | ধার ফেরত দেওয়া হয়েছে |
| `exchange_offer` | 🔄 | বিনিময়ের প্রস্তাব |
| `exchange_accepted` | ✅ | বিনিময় গৃহীত |
| `order` | 📦 | অর্ডার আপডেট |
| `review` | ⭐ | নতুন রিভিউ |
| `message` | 💬 | নতুন বার্তা |
| `wallet` | 💰 | ওয়ালেট আপডেট |
| `system` | 🔔 | সিস্টেম |

**On Tap**: 
1. Mark as read (PATCH `/me/notifications/{id}/read`) — optimistic
2. Navigate to `notification.action_url` (deep link parsed to screen route)

**Infinite Scroll**: `useInfiniteQuery` for pagination.

**Empty State**: "কোনো নোটিফিকেশন নেই" + bell illustration.

---

### Screen 4.6 — Messages / Chat (`app/messages/`)

**`app/messages/index.tsx`** — Conversation List:
- GET `/me/conversations`
- Each row: partner avatar, name, last message preview (truncated), timestamp, unread count badge
- Sorted by last message time (newest first)
- Tap row → `app/messages/[id].tsx`

**`app/messages/[id].tsx`** — Chat Room:

**Route Param**: `id` (conversation ID)

**WebSocket**: `ws://${WS_BASE_URL}/ws/chat/{id}/?token=${accessToken}`

**Message List** (`FlashList`, inverted for chat):
- Text messages: bubble layout (self: right, other: left)
- Image messages: tap to view full-screen
- System messages (centered text, gray)
- Loading more: scroll to top loads older messages (GET `/me/conversations/{id}/messages?before={oldest_id}`)

**Input Bar** (fixed bottom):
- Photo picker icon (left)
- Text input (multiline, max 500 chars)
- Send button (right, activates when input has text)

**Send Text Message**:
1. Append to list optimistically (with `pending` status indicator)
2. Send via WebSocket: `{ type: 'text_message', content: text, temp_id: uuid }`
3. Server broadcasts back with `message_id` → replace `temp_id` with real ID

**Send Image**:
1. ImagePicker → compress → POST `/media/uploads → { url }`
2. Send via WebSocket: `{ type: 'image_message', image_url: url }`

**WebSocket Status**:
- Connecting: "সংযোগ হচ্ছে..." gray status bar
- Connected: no indicator
- Disconnected: "সংযোগ বিচ্ছিন্ন" red status bar + automatic reconnect with exponential backoff (1s→2s→4s→8s→16s, max 5 attempts, then show manual reconnect button)

**Typing Indicator**:
- On input focus: send `{ type: 'typing_start' }` via WebSocket
- On input blur/send: send `{ type: 'typing_stop' }`
- Show animated 3-dot `TypingIndicator` when partner is typing

**Edge Cases**:
- Very long message: no truncation in chat, show full text
- Image message failed to load: show broken image placeholder + "আবার চেষ্টা করুন"
- WebSocket auth failed (token expired during chat): interceptor will refresh token; chat should reconnect with new token

---

### Phase 4 — Acceptance Criteria

- [ ] Book upload multi-step form completes (manual entry, 1 photo, COD) → book appears in profile library
- [ ] ISBN scanner opens camera, scans barcode, auto-fills book detail form
- [ ] Profile avatar change → uploads → updates immediately in header
- [ ] Follow/unfollow on public profile shows instant toggle (optimistic)
- [ ] Notifications load with correct icons and types
- [ ] Tap notification → marks as read + navigates to correct screen
- [ ] Mark all as read → all notifications show as read
- [ ] Chat: send a text message → appears in conversation (even if WS delivery delayed)
- [ ] Chat: WebSocket disconnect banner appears and reconnects within 30s
- [ ] Logout clears SecureStore + Zustand store + React Query cache → redirects to login
- [ ] Delete account: requires typing "আমি নিশ্চিত" to confirm

---

## Phase 5 — Polish & Play Store

### Goal

Push notifications, offline support, deep links, performance pass (FlashList everywhere, memoization), and EAS build for Play Store.

---

### Task 5.1 — Push Notifications (`hooks/useNotifications.ts`)

**Permission Request Timing**: Ask on first meaningful user action (after login), NOT on app open. Suggested: after first home tab render, delayed 3 seconds.

**Registration Flow**:
1. `Notifications.requestPermissionsAsync()`
2. If granted: `Notifications.getExpoPushTokenAsync()` and `messaging().getToken()` (FCM)
3. Compare with stored `AsyncStorage.getItem('fcm_token')`
4. If different: PATCH `/me/profile { fcm_token }` + store new token

**Re-registration**: On every app foreground (`AppState.addEventListener('change', 'active')`), check if token has changed.

**Foreground Handler**:
```
addNotificationReceivedListener → 
  update notificationStore.unreadCount + 1 →
  show in-app toast (custom, not system banner)
```

**Background Handler** (registered outside React component, in `app/_layout.tsx`):
```
addNotificationResponseReceivedListener → 
  parse notification data →
  router.push(notificationToRoute(data))
```

**Permission Denied Flow**: Show banner in Profile tab: "নোটিফিকেশন চালু করুন" with settings link.

---

### Task 5.2 — Offline Support

**NetInfo Hook** (`hooks/useNetworkStatus.ts`):
```typescript
import NetInfo from '@react-native-community/netinfo';
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => setIsConnected(state.isConnected ?? true));
    return unsubscribe;
  }, []);
  return { isConnected };
};
```

**Offline Banner** (`components/shared/OfflineBanner.tsx`):
- Fixed top bar: "📡 অফলাইন — ক্যাশ করা তথ্য দেখানো হচ্ছে"
- Background: `#FEF3C7` (yellow-100), text: `#92400E` (yellow-800)
- Shows when `!isConnected`

**Queued Mutations** (wishlist, notification read):
- When offline and user toggles wishlist: apply optimistic update + store in `offlineQueueStore`
- When reconnected: flush queue in order, discard duplicates

**Mutations that Block Offline** (payments, order placement, chat send):
- Show toast: "এই কাজের জন্য ইন্টারনেট সংযোগ প্রয়োজন"

---

### Task 5.3 — Deep Links

**`app.json` Scheme Configuration**:
```json
{
  "expo": {
    "scheme": "boimix",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "boimix" }, { "scheme": "https", "host": "boimix.com" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Route Mapping** (`utils/deepLink.ts`):
| URL | Screen |
|-----|--------|
| `boimix://book/{slug}` | `app/book/[slug].tsx` |
| `boimix://user/{username}` | `app/user/[username].tsx` |
| `boimix://order/{id}` | orders tab + detail |
| `boimix://notification` | `app/notifications.tsx` |
| `boimix://messages/{id}` | `app/messages/[id].tsx` |

Expo Router handles deep links automatically via the `linking` configuration. Register the scheme in `app.json` and Expo Router maps the URL to the file-based route.

---

### Task 5.4 — Performance Pass

| Task | Action |
|------|--------|
| Replace all FlatList | Audit all screens, replace with FlashList |
| Memoize BookCard | Wrap in `React.memo`, verify with React DevTools profiler |
| Memoize renderItem | Use `useCallback` for all renderItem props |
| Remove unnecessary re-renders | Audit with React DevTools; common culprit: Zustand selector too broad |
| Image optimization | Verify all `expo-image` usages have explicit `width`/`height` and `contentFit` |
| Bundle analysis | `expo export --dump-sourcemap` + analyze bundle size |

---

### Task 5.5 — EAS Build & Play Store

**`eas.json`** (create):
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

**`app.json` Required Fields**:
```json
{
  "expo": {
    "name": "BoiMix",
    "slug": "boimix",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "splash": { "image": "./assets/images/splash.png", "resizeMode": "contain", "backgroundColor": "#E84B1B" },
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/images/adaptive-icon.png", "backgroundColor": "#E84B1B" },
      "package": "com.boimix.app",
      "googleServicesFile": "./google-services.json",
      "permissions": ["ACCESS_FINE_LOCATION", "CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "RECEIVE_BOOT_COMPLETED", "VIBRATE"]
    }
  }
}
```

**Build Commands** (DO NOT run — provide to user):
```bash
# Development APK (for testing on device)
eas build --platform android --profile development

# Preview APK (internal testing)
eas build --platform android --profile preview

# Production AAB (Play Store)
eas build --platform android --profile production
```

---

### Phase 5 — Acceptance Criteria

- [ ] App receives and displays push notification while in foreground (in-app toast)
- [ ] Tapping background notification navigates to correct screen
- [ ] FCM token registered with backend on first launch after login
- [ ] "অফলাইন" banner appears when network is disconnected
- [ ] Cached home data shows when offline (React Query staleTime)
- [ ] Wishlist toggle works offline (queued) and syncs on reconnect
- [ ] Payment checkout blocked offline with Bangla error
- [ ] Deep link `boimix://book/{slug}` opens correct book detail screen
- [ ] No visible jank on explore grid scroll (verify 60fps with profiler)
- [ ] `eas build --profile production` completes without error
- [ ] App icon and splash screen display correctly on Android
- [ ] `.aab` file is under 150MB

---

*Document version: 1.0 — All Phases Pre-defined*
*Total estimated development time: 21 days*
