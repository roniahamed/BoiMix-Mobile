# BoiMix Mobile — Architecture Document

> **Status**: Active  
> **Platform**: Android (primary), iOS (future)  
> **Framework**: Expo Managed Workflow + Expo Router  

---

## 1. Project Overview and Goals

BoiMix is a Bangladesh-focused community-driven peer-to-peer book lending, exchange, and marketplace platform. The mobile application extends the existing web platform (Next.js) to provide a native Android/iOS experience for buyers, sellers, borrowers, and central library administrators.

### Goals

| Goal | Description |
|------|-------------|
| Feature Parity | Match the web platform's core user flows: discovery, buy, sell, borrow, exchange, chat |
| Performance | 60fps scrolling, <2s cold start, <500ms screen transitions |
| Offline Resilience | Show cached content when offline; queue mutations for reconnect |
| Bangladesh-first | Bangla language support, bKash/Nagad payment integration, low-data-usage optimization |
| Maintainability | Strict TypeScript, documented decisions, feature-based folder structure |

---

## 2. Tech Stack with Version Numbers

### Core

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | `~52.0.0` | Managed workflow, SDK, build tooling |
| `expo-router` | `~4.0.0` | File-based navigation (wraps React Navigation v7) |
| `react-native` | `0.76.x` | Core native framework |
| `react` | `18.3.x` | UI rendering |
| `typescript` | `~5.3.0` | Type safety |

### Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `nativewind` | `^4.0.0` | Tailwind syntax for React Native |
| `tailwindcss` | `^3.4.0` | CSS utility framework (config only, NativeWind consumes it) |

### State & Data

| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | `^5.0.0` | Client-side state management |
| `@tanstack/react-query` | `^5.0.0` | Server state, caching, background refetch |
| `axios` | `^1.7.0` | HTTP client |
| `zod` | `^3.23.0` | Schema validation for forms and API responses |

### Expo Modules

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-secure-store` | `~14.0.0` | Encrypted token storage (iOS Keychain / Android Keystore) |
| `expo-image` | `~2.0.0` | Performant image rendering with progressive loading |
| `expo-notifications` | `~0.29.0` | Push notification registration and handling |
| `expo-location` | `~18.0.0` | GPS and location permissions |
| `expo-image-picker` | `~16.0.0` | Camera/gallery access for uploads |
| `expo-image-manipulator` | `~13.0.0` | Image resize/compress before upload |
| `expo-barcode-scanner` | `~13.0.0` | ISBN scanning for book upload |
| `expo-web-browser` | `~14.0.0` | In-app browser for payment gateways |
| `expo-linking` | `~7.0.0` | Deep link configuration and handling |
| `expo-font` | `~13.0.0` | Custom font loading |
| `expo-splash-screen` | `~0.29.0` | Splash screen control |
| `expo-constants` | `~17.0.0` | App config access at runtime |

### Firebase

| Package | Version | Purpose |
|---------|---------|---------|
| `@react-native-firebase/app` | `^21.0.0` | Firebase core |
| `@react-native-firebase/auth` | `^21.0.0` | Google Sign-In via Firebase |
| `@react-native-firebase/messaging` | `^21.0.0` | FCM push notifications |

### Maps & Location

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-maps` | `1.18.x` | Google Maps / Apple Maps native component |

### UI & Animation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-reanimated` | `~3.16.0` | 60fps animations (runs on UI thread) |
| `react-native-gesture-handler` | `~2.20.0` | Native gesture recognition |
| `@shopify/flash-list` | `^1.7.0` | High-performance list replacement for FlatList |
| `react-native-safe-area-context` | `4.12.x` | Safe area insets for notch/nav bar |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | `^29.0.0` | Test runner |
| `@testing-library/react-native` | `^12.0.0` | Component testing utilities |
| `detox` | `^20.0.0` | E2E testing framework |
| `eslint` | `^8.0.0` | Linting |
| `prettier` | `^3.0.0` | Code formatting |

---

## 3. Full Folder Structure

```
/Users/roni/Desktop/BoiMix-Mobile/
│
├── app/                          # Expo Router — every file = a route
│   ├── _layout.tsx               # Root layout: providers, fonts, theme
│   ├── index.tsx                 # Splash/entry — checks auth, redirects
│   ├── +not-found.tsx            # 404 fallback screen
│   │
│   ├── (auth)/                   # Auth group — no tabs, full screen
│   │   ├── _layout.tsx           # Auth layout (stack navigator)
│   │   ├── onboarding.tsx        # 3-slide onboarding carousel
│   │   ├── login.tsx             # Email + Google login
│   │   ├── register.tsx          # Registration form
│   │   ├── verify-otp.tsx        # OTP verification
│   │   ├── forgot-password.tsx   # Forgot password email entry
│   │   ├── reset-password.tsx    # New password entry (deep link)
│   │   ├── complete-profile.tsx  # Avatar, bio, location (post-register)
│   │   └── choose-language.tsx   # Bangla / English selector
│   │
│   ├── (tabs)/                   # Main tab navigator
│   │   ├── _layout.tsx           # Tab bar config (icons, labels)
│   │   ├── index.tsx             # Home tab
│   │   ├── explore.tsx           # Explore/search tab
│   │   ├── orders.tsx            # Orders (buy/borrow/exchange) tab
│   │   └── profile.tsx           # My profile tab
│   │
│   ├── book/
│   │   └── [slug].tsx            # Book detail screen
│   │
│   ├── user/
│   │   └── [username].tsx        # Public user profile
│   │
│   ├── upload/
│   │   └── index.tsx             # Multi-step book upload
│   │
│   ├── borrow/
│   │   ├── cart.tsx              # Borrow cart
│   │   └── checkout.tsx          # Borrow checkout
│   │
│   ├── exchange/
│   │   ├── propose.tsx           # Propose exchange offer
│   │   └── [id].tsx              # Exchange offer detail
│   │
│   ├── cart.tsx                  # Shopping cart
│   ├── checkout.tsx              # Checkout flow
│   ├── wishlist.tsx              # Wishlist
│   ├── notifications.tsx         # Notifications list
│   ├── settings.tsx              # App settings
│   ├── near-me.tsx               # Map view of nearby books
│   └── search.tsx                # Dedicated search screen
│
├── components/
│   ├── shared/                   # Reusable across features
│   │   ├── index.ts              # Barrel export
│   │   ├── BookCard.tsx          # Book card (grid/list/horizontal variants)
│   │   ├── BookCardSkeleton.tsx  # Loading skeleton for BookCard
│   │   ├── Avatar.tsx            # User avatar with fallback initials
│   │   ├── Badge.tsx             # Status/condition badge chip
│   │   ├── Button.tsx            # Primary/secondary/ghost button
│   │   ├── Input.tsx             # Controlled text input + error display
│   │   ├── OtpInput.tsx          # 6-cell OTP input
│   │   ├── BottomSheet.tsx       # Reusable bottom sheet (gesture-driven)
│   │   ├── EmptyState.tsx        # Illustration + message for empty lists
│   │   ├── ErrorState.tsx        # Error message + retry button
│   │   ├── LoadingOverlay.tsx    # Full-screen loading spinner
│   │   ├── OfflineBanner.tsx     # "অফলাইন" top banner
│   │   ├── StarRating.tsx        # Read-only star rating display
│   │   ├── PriceDisplay.tsx      # Formatted price with currency
│   │   ├── SectionHeader.tsx     # Section title + "see all" link
│   │   ├── Toast.tsx             # In-app toast notification
│   │   └── ConfirmDialog.tsx     # Confirmation modal
│   │
│   ├── home/                     # Home screen sub-components
│   │   ├── HeroBanner.tsx        # Auto-scrolling promotional banner
│   │   ├── QuickActionChips.tsx  # Sell/Exchange/Borrow/NearMe chips
│   │   └── BookSection.tsx       # Horizontal book list with header
│   │
│   ├── book/                     # Book-related sub-components
│   │   ├── ImageGallery.tsx      # Horizontal image viewer with zoom
│   │   ├── SellerCard.tsx        # Seller info block
│   │   ├── ActionButtons.tsx     # Context-aware buy/borrow/exchange buttons
│   │   ├── ReviewCard.tsx        # Individual review item
│   │   └── QASection.tsx         # Questions and answers section
│   │
│   ├── auth/                     # Auth screen sub-components
│   │   ├── OnboardingSlide.tsx   # Single onboarding slide
│   │   ├── SocialAuthButton.tsx  # Google sign-in button
│   │   └── PasswordStrength.tsx  # Password strength indicator
│   │
│   ├── chat/                     # Chat sub-components
│   │   ├── MessageBubble.tsx     # Individual chat message
│   │   ├── ConversationItem.tsx  # Conversation list row
│   │   └── TypingIndicator.tsx   # Animated typing dots
│   │
│   └── upload/                   # Upload form sub-components
│       ├── StepIndicator.tsx     # Multi-step progress bar
│       ├── ImagePickerGrid.tsx   # 5-image picker grid
│       └── IsbnScanner.tsx       # Barcode scanner overlay
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state + actions (wraps Zustand auth store)
│   ├── useBooks.ts               # Book query hooks (useBookDetail, useBookList)
│   ├── useLocation.ts            # Expo Location wrapper + permission handling
│   ├── useNotifications.ts       # Push notification setup + permission
│   ├── useWebSocket.ts           # WebSocket connection hook with reconnect
│   ├── useInfiniteBooks.ts       # Infinite scroll for book lists
│   ├── useCart.ts                # Cart operations (wraps React Query mutations)
│   ├── useWishlist.ts            # Wishlist operations
│   ├── useOfflineQueue.ts        # Queue mutations when offline, flush on reconnect
│   └── useNetworkStatus.ts       # @react-native-community/netinfo wrapper
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── endpoints.ts          # All endpoint URL constants
│   │   ├── auth.ts               # Auth service functions
│   │   ├── books.ts              # Books service functions
│   │   ├── me.ts                 # /me/* service functions
│   │   ├── orders.ts             # Orders service functions
│   │   ├── notifications.ts      # Notifications service functions
│   │   ├── messages.ts           # Conversations + messages
│   │   ├── media.ts              # Media upload service
│   │   ├── locations.ts          # Location search/reverse
│   │   └── index.ts              # Re-export all services
│   │
│   ├── query/
│   │   ├── queryClient.ts        # QueryClient configuration
│   │   └── keys.ts               # Query key factory (typed, hierarchical)
│   │
│   ├── secure-storage.ts         # expo-secure-store wrapper (chunked for large values)
│   ├── firebase.ts               # Firebase app initialization
│   └── ws.ts                     # WebSocket client factory
│
├── stores/                       # Zustand stores
│   ├── authStore.ts              # Auth: user, tokens, isAuthenticated, login/logout actions
│   ├── cartStore.ts              # Cart: item count, optimistic updates
│   ├── wishlistStore.ts          # Wishlist: local ID set for instant toggle feedback
│   ├── filterStore.ts            # Explore filters: mode, condition, price range, sort
│   ├── notificationStore.ts      # Unread count, in-app notification queue
│   └── offlineQueueStore.ts      # Queued mutations: { endpoint, method, body }[]
│
├── types/
│   ├── book.ts                   # BookCardBook, BookAvailabilityMode, BookCondition, etc.
│   ├── user.ts                   # AuthUser, UserProfile, etc.
│   ├── notification.ts           # NotificationType, Notification, etc.
│   ├── order.ts                  # Order, BorrowOrder, Exchange types
│   ├── message.ts                # Conversation, Message, WebSocketMessage types
│   ├── api.ts                    # Generic PaginatedResponse<T>, ApiError, etc.
│   └── index.ts                  # Re-export all types
│
├── constants/
│   ├── colors.ts                 # BoiMix brand palette (matches web Tailwind config)
│   ├── fonts.ts                  # Font family names
│   ├── spacing.ts                # Base spacing scale
│   ├── routes.ts                 # Route path constants (avoid magic strings)
│   └── config.ts                 # App-level config (pagination sizes, timeouts)
│
├── utils/
│   ├── formatDate.ts             # Bengali-aware date formatting
│   ├── formatPrice.ts            # BDT price formatting
│   ├── formatDistance.ts         # Meters → km display string
│   ├── compressImage.ts          # expo-image-manipulator wrapper
│   ├── validationSchemas.ts      # Zod schemas for all forms
│   ├── errorMessages.ts          # Bangla error message map
│   └── deepLink.ts               # Deep link URL builder/parser
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── splash.png
│   │   ├── icon.png
│   │   ├── adaptive-icon.png
│   │   └── onboarding/           # Onboarding slide illustrations
│   └── fonts/
│       └── (custom font files)
│
├── e2e/                          # Detox E2E tests
│   ├── login.test.ts
│   ├── buyBook.test.ts
│   └── uploadBook.test.ts
│
├── app.json                      # Expo app configuration
├── babel.config.js               # Babel + NativeWind config
├── tailwind.config.js            # Tailwind / NativeWind config
├── tsconfig.json                 # TypeScript configuration
├── global.css                    # NativeWind global CSS entry
├── .env.development              # Dev environment variables
├── .env.production               # Prod environment variables
├── eas.json                      # EAS build profiles
├── metro.config.js               # Metro bundler config
├── .eslintrc.js                  # ESLint config
├── .prettierrc                   # Prettier config
└── docs/                         # This folder
```

---

## 4. Navigation Architecture

### Overview

Expo Router uses a file-based routing system identical in concept to Next.js's App Router. Each file in `app/` becomes a route. Route groups `(group)` share a layout without adding to the URL path.

### Tab Structure

```
(tabs)/
  ├── index.tsx        → "Home"    tab (🏠)
  ├── explore.tsx      → "Explore" tab (🔍)
  ├── orders.tsx       → "Orders"  tab (📦)
  └── profile.tsx      → "Profile" tab (👤)
```

The tab bar is configured in `app/(tabs)/_layout.tsx` using `<Tabs>` from `expo-router`.

### Auth Flow Routing

```
app/index.tsx (Splash)
  ├── Token in SecureStore?
  │     ├── YES → GET /me/profile
  │     │           ├── 200 → router.replace('/(tabs)/')
  │     │           ├── 401 → Refresh → retry → 200 → router.replace('/(tabs)/')
  │     │           └── 401 after refresh → router.replace('/(auth)/login')
  │     └── NO  → onboarding_seen in AsyncStorage?
  │                 ├── YES → router.replace('/(auth)/login')
  │                 └── NO  → router.replace('/(auth)/onboarding')
```

### Stack Navigation Inside Groups

- `(auth)/_layout.tsx`: Stack navigator, `headerShown: false` for all screens.
- `(tabs)/_layout.tsx`: Tab navigator. Each tab is its own stack that can push screens.
- Screens outside groups (`app/book/[slug].tsx`, `app/cart.tsx`, etc.) are pushed from any tab's stack.

### Deep Link Scheme

```
boimix://book/{slug}       → app/book/[slug].tsx
boimix://user/{username}   → app/user/[username].tsx
boimix://order/{id}        → pushed onto current tab stack
boimix://notification      → app/notifications.tsx
```

---

## 5. Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Cold Start                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Read SecureStore     │
                    │  'access_token'       │
                    │  'refresh_token'      │
                    └───────────┬──────────┘
                                │
              ┌─────────────────▼──────────────────┐
              │        Token found?                 │
              └────────┬──────────────┬─────────────┘
                    YES│              │NO
          ┌────────────▼─────┐  ┌────▼──────────────┐
          │  GET /me/profile  │  │  Show Onboarding   │
          └────────────┬─────┘  │  or Login Screen   │
                       │        └───────────────────--┘
         ┌─────────────▼──────────────┐
         │      Response status?       │
         └──┬──────────┬──────────────┘
           200         401
           │            │
    ┌──────▼───┐  ┌─────▼────────────────────┐
    │  Go to   │  │  POST /auth/token/refresh  │
    │  (tabs)/ │  │  with refresh_token        │
    └──────────┘  └─────┬──────────────┬───────┘
                       200             401
                        │               │
               ┌────────▼─────┐  ┌──────▼──────────┐
               │  Retry orig. │  │  Clear tokens    │
               │  request     │  │  Go to login     │
               └────────┬─────┘  └──────────────────┘
                       200
                        │
               ┌────────▼─────┐
               │  Go to       │
               │  (tabs)/     │
               └──────────────┘

Token Storage (expo-secure-store):
  Key: 'boimix_access_token'   → JWT access token
  Key: 'boimix_refresh_token'  → JWT refresh token
  Key: 'boimix_user'           → Serialized AuthUser JSON

Zustand authStore mirrors SecureStore on hydration:
  { isAuthenticated, user, accessToken }
  — authStore is the in-memory source of truth during session
  — SecureStore is the persistent source of truth across launches
```

### Token Refresh Interceptor (lib/api/client.ts)

```typescript
// Pseudocode — see lib/api/client.ts for implementation
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = await SecureStorage.get('boimix_refresh_token');
        const { data } = await axios.post('/auth/token/refresh', { refresh: refreshToken });
        await SecureStorage.set('boimix_access_token', data.access);
        authStore.getState().setAccessToken(data.access);
        error.config.headers['Authorization'] = `Bearer ${data.access}`;
        return axiosInstance(error.config);
      } catch {
        authStore.getState().logout(); // clears SecureStore + store
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. API Layer Design

### Axios Instance (`lib/api/client.ts`)

```typescript
// Configuration snapshot
const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL, // http://127.0.0.1:8080/api/v1
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
```

**Request interceptor:** Reads `accessToken` from `authStore` and injects `Authorization: Bearer <token>` on every request.

**Response interceptor:** Handles 401 → refresh → retry (see section 5). Also handles network errors, transforming them into consistent `ApiError` objects.

### Endpoint Constants (`lib/api/endpoints.ts`)

All URLs are defined as constants. No magic strings anywhere else.

```typescript
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE: '/auth/google',
    REFRESH: '/auth/token/refresh',
  },
  BOOKS: {
    LIST: '/books/',
    DETAIL: (slug: string) => `/books/${slug}`,
    NEARBY: '/books/nearby',
    TRENDING: '/books/trending',
    CATEGORIES: '/books/categories',
    ISBN: (isbn: string) => `/books/isbn/${isbn}`,
  },
  SEARCH: {
    BOOKS: '/search/books/',
    SUGGESTIONS: '/search/suggestions',
  },
  ME: {
    PROFILE: '/me/profile',
    LIBRARY: '/me/library',
    WISHLIST_ITEMS: '/me/wishlist/items',
    CART: '/me/cart',
    BORROW_CART: '/me/borrow-cart',
    ORDERS: '/me/orders',
    BORROW_ORDERS: '/me/borrow-orders',
    EXCHANGES: '/me/exchanges',
    NOTIFICATIONS: '/me/notifications',
    NOTIFICATION_READ: (id: string) => `/me/notifications/${id}/read`,
    CONVERSATIONS: '/me/conversations',
    CONVERSATION_MESSAGES: (id: string) => `/me/conversations/${id}/messages`,
  },
  MEDIA: {
    UPLOADS: '/media/uploads',
  },
  LOCATIONS: {
    SEARCH: '/locations/search',
    REVERSE: '/locations/reverse',
  },
};
```

### React Query Configuration (`lib/query/queryClient.ts`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 24 * 60 * 60 * 1000,  // 24 hours (offline cache)
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,   // Mobile: refetch on app foreground instead
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0, // Never auto-retry mutations (payment safety)
    },
  },
});
```

### Query Key Factory (`lib/query/keys.ts`)

```typescript
export const queryKeys = {
  books: {
    all: ['books'] as const,
    list: (params: BookListParams) => ['books', 'list', params] as const,
    detail: (slug: string) => ['books', 'detail', slug] as const,
    nearby: (coords: Coords) => ['books', 'nearby', coords] as const,
    trending: () => ['books', 'trending'] as const,
  },
  me: {
    profile: () => ['me', 'profile'] as const,
    library: () => ['me', 'library'] as const,
    wishlist: () => ['me', 'wishlist'] as const,
    cart: () => ['me', 'cart'] as const,
    orders: () => ['me', 'orders'] as const,
    notifications: () => ['me', 'notifications'] as const,
    conversations: () => ['me', 'conversations'] as const,
    messages: (conversationId: string) => ['me', 'messages', conversationId] as const,
  },
};
```

---

## 7. State Management

### Principle: Server State vs Client State

| Data | Store | Reason |
|------|-------|--------|
| Book lists, details | React Query | Server-owned, changes on server |
| User profile | React Query | Server-owned |
| Orders, notifications | React Query | Server-owned |
| Auth tokens, user object | Zustand (authStore) | Needs immediate synchronous access across app (interceptors) |
| Cart item count | Zustand (cartStore) | Needed in tab badge; optimistic updates |
| Wishlist IDs | Zustand (wishlistStore) | Instant heart-toggle feedback |
| Explore filters | Zustand (filterStore) | Persists user filter selections across navigations |
| Offline mutation queue | Zustand (offlineQueueStore) | Client-side queue, not server state |
| Unread notification count | Zustand (notificationStore) | Needed in tab badge; updated via WebSocket |

### Zustand Store Pattern

All stores follow a consistent pattern:

```typescript
// Example: authStore.ts
interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  // Actions
  login: (user: AuthUser, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  hydrate: () => Promise<void>; // load from SecureStore on app start
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandSecureStorage), // custom SecureStore adapter
      partialize: (state) => ({ user: state.user }), // only persist user object; tokens persist separately
    }
  )
);
```

---

## 8. Push Notification Architecture

### Registration Flow

```
App foreground (not on first open) →
  Request permission via expo-notifications →
  Get Expo Push Token AND FCM token →
  PATCH /me/profile { fcm_token: '<token>' } →
  Store token in AsyncStorage for change detection
```

### FCM Token Refresh

On every app foreground event, compare stored FCM token with current. If changed, re-register with backend.

### Notification Handling

| App State | Handler | Action |
|-----------|---------|--------|
| Foreground | `Notifications.addNotificationReceivedListener` | Show in-app toast, update badge count in Zustand |
| Background / Killed | FCM handles display | On tap, `Notifications.addNotificationResponseReceivedListener` fires when app opens |
| Tap from background | `addNotificationResponseReceivedListener` | Parse `notification.request.content.data`, navigate to deep link |

### Notification → Deep Link Mapping

```typescript
const notificationToRoute = (data: NotificationPayload): string => {
  switch (data.type) {
    case 'borrow_request':  return `/book/${data.bookSlug}`;
    case 'exchange_offer':  return `/exchange/${data.exchangeId}`;
    case 'order':           return `/orders/${data.orderId}`;
    case 'message':         return `/messages/${data.conversationId}`;
    default:                return '/notifications';
  }
};
```

---

## 9. WebSocket / Chat Architecture

### Connection Management (`hooks/useWebSocket.ts`)

```
Connect to: ws://${EXPO_PUBLIC_WS_BASE_URL}/ws/chat/{conversation_id}/
  ?token=${accessToken}  (query param auth for WS)
```

The `useWebSocket` hook manages:
- Opening connection on screen mount
- Closing connection on screen unmount (cleanup)
- Reconnect with exponential backoff (1s → 2s → 4s → 8s, max 30s)
- Sending `{ type: 'ping' }` every 30s to keep connection alive
- Dispatching received messages to React Query cache (for persistence) and local state (for instant render)

### Message Flow

```
User types → presses Send →
  WebSocket.send({ type: 'message', content: text, conversation_id }) →
  Optimistic: immediately append message to local list →
  Server broadcasts back → deduplicate by message ID
```

### Image Messages

```
User selects image → expo-image-picker →
  Compress with expo-image-manipulator (max 1024px, WebP) →
  POST /media/uploads → { url } →
  WebSocket.send({ type: 'message', content_type: 'image', image_url: url })
```

---

## 10. Image Handling Strategy

- Use `expo-image` (not React Native's `Image`) everywhere for progressive loading, blur-hash placeholders, and disk caching.
- All book cover URLs come from Cloudinary: append `/w_300,h_400,c_fill,f_auto,q_auto` transformation params for optimized thumbnails.
- For user avatars: append `/w_100,h_100,c_fill,f_auto,q_auto`.
- Fallback: if `coverUrl` is null/undefined, render a local placeholder illustration asset.
- For uploads: `expo-image-manipulator` resizes to max 1200px on longest side and converts to WebP before uploading to `/media/uploads`.

---

## 11. Offline Strategy

### React Query Cache

With `gcTime: 24hr`, React Query keeps all fetched data in memory and AsyncStorage-backed cache for 24 hours. When the network is unavailable:
- `useQuery` hooks return `{ data: cachedData, isStale: true }` immediately.
- Display an `OfflineBanner` when `NetInfo.isConnected === false`.

### Mutation Queuing

Mutations that can be safely queued (wishlist toggle, notification mark-read):
1. `useOfflineQueue` hook intercepts the mutation.
2. Applies optimistic update to Zustand store immediately.
3. Stores mutation descriptor `{ endpoint, method, body, timestamp }` in `offlineQueueStore`.
4. `useNetworkStatus` watches for reconnect → flushes queue in order.

Mutations that must NOT be queued (payments, order placement):
- Block with toast: "ইন্টারনেট সংযোগ নেই। পেমেন্টের জন্য সংযোগ প্রয়োজন।"

---

## 12. Performance Guidelines

### Lists

- **Always use `FlashList`** from `@shopify/flash-list` instead of `FlatList` for any list of more than 10 items.
- Provide `estimatedItemSize` prop (BookCard: 240 for grid, 120 for list row).
- Do not use `ScrollView` + `.map()` for more than 5 items.
- For horizontal banners with ≤10 items, `FlatList` is acceptable.

### Memoization

- Wrap `BookCard` with `React.memo` — it renders many times in lists.
- Use `useCallback` for event handlers passed as props to `React.memo` components.
- Use `useMemo` for derived values that require non-trivial computation (filtered/sorted arrays).
- **Do not** wrap every component in `memo` — only those that provably re-render unnecessarily.

### Image Performance

- Always specify `width` and `height` on `expo-image` components (prevents layout shift).
- Use `contentFit="cover"` for book covers, `contentFit="contain"` for illustrations.
- Use `placeholder={{ blurhash: '...' }}` on book covers.

### Animation

- All animations must use `react-native-reanimated` (runs on UI thread, no JS bridge).
- Never use `Animated` from React Native core in new code.
- Skeleton loaders use `reanimated` shimmer animation.

---

## 13. Error Boundary Strategy

```
app/_layout.tsx
  └── <ErrorBoundary fallback={<AppCrashScreen />}>
        └── <Stack>  (all routes)
              └── Individual screen error boundaries (via React Query's isError state)
```

- Global: `app/_layout.tsx` wraps everything in a React `ErrorBoundary`. Shows a "অ্যাপটি ক্র্যাশ করেছে, পুনরায় চালু করুন" screen with restart button.
- Per-screen: Every screen handles its own `isError` state from `useQuery` with an `<ErrorState onRetry={refetch} />` component. No screen shows a blank white screen.
- Unexpected errors in event handlers: wrapped in try/catch, shown as toast.

---

## 14. TypeScript Configuration

```json
// tsconfig.json
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
  }
}
```

Path aliases allow `import { BookCard } from '@/components/shared'` instead of relative paths.

All imports from React Native / Expo modules must use their typed exports — never use `@ts-ignore` to suppress type errors.

---

*Document version: 1.0 — Phase 0*
