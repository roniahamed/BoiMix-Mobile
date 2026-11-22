# BoiMix Mobile — Testing Standards

> **Do not create or run test cases unless explicitly instructed by the user.** This document defines the testing philosophy, structure, mock strategy, and test case descriptions for future implementation.

---

## 1. What to Test

### Must Test (High Priority)

| Category | What | Why |
|----------|------|-----|
| Custom hooks | Every hook in `hooks/` | Hooks contain business logic shared across screens |
| API service functions | Every function in `lib/api/` | Core data layer — bugs here affect all screens |
| Utility functions | Every function in `utils/` | Pure functions, easy to test, high reuse |
| Zustand stores | Every action and computed value | State mutations that affect many components |
| Complex components | `BookCard`, `OtpInput`, `BottomSheet` | High reuse, many edge cases |
| Navigation flows | Auth redirect, deep link handling | Critical user journey |
| Form validation | All Zod schemas in `utils/validationSchemas.ts` | User-facing errors |

### Should Test (Medium Priority)

| Category | What |
|----------|------|
| Screen-level integration | Home tab with mocked React Query |
| Infinite scroll | `useInfiniteQuery` pagination in explore |
| WebSocket hook | Connection, reconnect, message handling |
| Offline queue | Queue, flush, retry logic |

### Skip (Low Priority / Deferred)

| Category | Reason |
|----------|--------|
| Pure display components (`Avatar`, `Badge`) | Minimal logic; visual regression testing via Detox |
| Third-party module wrappers | Test that wrapper is called, not the library itself |
| Expo Router navigation primitives | Expo's own test suite covers this |

---

## 2. Test File Location

Co-locate test files next to the source file inside a `__tests__/` subdirectory:

```
hooks/
  useAuth.ts
  __tests__/
    useAuth.test.ts

components/shared/
  BookCard.tsx
  __tests__/
    BookCard.test.tsx

lib/api/
  books.ts
  __tests__/
    books.test.ts

utils/
  validationSchemas.ts
  __tests__/
    validationSchemas.test.ts
```

**Do not** create a top-level `__tests__/` folder at the project root (except for E2E config files).

---

## 3. Naming Convention

| Source File | Test File |
|-------------|-----------|
| `BookCard.tsx` | `BookCard.test.tsx` |
| `useAuth.ts` | `useAuth.test.ts` |
| `books.ts` (API service) | `books.test.ts` |
| `formatPrice.ts` | `formatPrice.test.ts` |
| `authStore.ts` | `authStore.test.ts` |
| `validationSchemas.ts` | `validationSchemas.test.ts` |

Test describe blocks mirror the source file name:

```typescript
describe('BookCard', () => {
  describe('when book is out of stock', () => {
    it('renders stock badge', () => { ... });
    it('disables cart button', () => { ... });
  });
});
```

---

## 4. Unit Testing Setup

### Framework

- **Test runner**: Jest (configured via `jest.config.js` with `jest-expo` preset)
- **Component testing**: `@testing-library/react-native`
- **Hook testing**: `@testing-library/react-hooks` (or `renderHook` from `@testing-library/react-native` v12+)
- **Assertion library**: Jest built-in (`expect`) + `@testing-library/jest-native` for DOM-like matchers

### Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

---

## 5. Mock Strategy

### Mock Axios (not the entire module)

```typescript
// In each test file that tests API functions:
jest.mock('@/lib/api/client', () => ({
  client: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { client } from '@/lib/api/client';
const mockGet = client.get as jest.MockedFunction<typeof client.get>;
```

### Mock expo-secure-store

```typescript
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock_token');
```

### Mock expo-notifications

```typescript
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));
```

### Mock expo-router

```typescript
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn().mockReturnValue({}),
  usePathname: jest.fn().mockReturnValue('/'),
}));
```

### Mock React Query

Wrap test components in a fresh `QueryClient` to prevent state leakage:

```typescript
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    logger: { log: console.log, warn: console.warn, error: () => {} },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

const { result } = renderHook(() => useBooks(), { wrapper });
```

### Mock Zustand Stores

Reset store state between tests to prevent test pollution:

```typescript
beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    accessToken: null,
  });
});
```

### Mock AsyncStorage

```typescript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

---

## 6. Test Case Descriptions by Phase

> These descriptions define **what** to test. They are written to be unambiguous enough for an AI agent to implement them directly.

---

### Phase 0 — Bootstrap

#### `lib/secure-storage.ts`

- **TC-001**: `get(key)` calls `SecureStore.getItemAsync` with the given key and returns the value.
- **TC-002**: `set(key, value)` calls `SecureStore.setItemAsync` with key and value.
- **TC-003**: `remove(key)` calls `SecureStore.deleteItemAsync` with the key.
- **TC-004**: `setChunked(key, value)` splits a string longer than 2048 bytes into multiple keys (`key_chunk_0`, `key_chunk_1`, etc.) and stores each.
- **TC-005**: `getChunked(key)` reassembles chunked values by reading all chunk keys and concatenating them.
- **TC-006**: `get(key)` returns `null` when the key does not exist (SecureStore returns `null`).

#### `lib/api/client.ts`

- **TC-007**: The request interceptor reads `accessToken` from `authStore` and sets `Authorization: Bearer <token>` header.
- **TC-008**: When a 401 response is received and `_retry` is false, the interceptor calls `POST /auth/token/refresh` with the stored refresh token.
- **TC-009**: After a successful token refresh, the interceptor retries the original request with the new access token.
- **TC-010**: When token refresh returns 401, the interceptor calls `authStore.logout()` and navigates to `/(auth)/login`.
- **TC-011**: When `_retry` is already true (second 401), the interceptor does not retry again and rejects with the original error.

#### `utils/validationSchemas.ts` — Login Schema

- **TC-012**: Valid email and password ≥ 6 chars passes validation.
- **TC-013**: Empty email fails with "বৈধ ইমেইল দিন".
- **TC-014**: Invalid email format (`notanemail`) fails.
- **TC-015**: Password less than 6 chars fails with min-length message.

#### `utils/validationSchemas.ts` — Register Schema

- **TC-016**: Full name < 2 chars fails.
- **TC-017**: Full name > 50 chars fails.
- **TC-018**: Password without a number fails strength check.
- **TC-019**: `confirmPassword` not matching `password` fails.
- **TC-020**: `termsAccepted = false` fails with "শর্তাবলী মেনে নিতে হবে".

---

### Phase 1 — Auth Flow

#### `hooks/useAuth.ts`

- **TC-021**: `hydrate()` calls `SecureStorage.get('boimix_access_token')` and `SecureStorage.get('boimix_user')` and sets `authStore` state.
- **TC-022**: `hydrate()` with no stored token leaves `isAuthenticated = false`.
- **TC-023**: `login(email, password)` calls `authApi.login`, stores tokens in SecureStore, and sets `isAuthenticated = true`.
- **TC-024**: `logout()` calls `SecureStorage.remove` for both token keys, calls `queryClient.clear()`, and sets `isAuthenticated = false`.

#### `lib/api/auth.ts`

- **TC-025**: `login({ email, password })` sends POST to `/auth/login` with the correct body and returns `{ user, access, refresh }`.
- **TC-026**: `register(payload)` sends POST to `/auth/register`.
- **TC-027**: `verifyOtp({ email, otp })` sends POST to `/auth/verify-otp`.
- **TC-028**: `refreshToken(refresh)` sends POST to `/auth/token/refresh` with `{ refresh }` body.
- **TC-029**: `googleAuth(idToken)` sends POST to `/auth/google` with `{ id_token: idToken }`.

#### `components/shared/OtpInput.tsx`

- **TC-030**: Renders 6 input cells.
- **TC-031**: Typing a digit in cell N automatically focuses cell N+1.
- **TC-032**: Backspace in an empty cell focuses cell N-1.
- **TC-033**: Pasting a 6-digit string fills all cells and calls `onComplete` callback.
- **TC-034**: `onComplete` is called with the full 6-digit string when all cells are filled.
- **TC-035**: `onComplete` is NOT called when fewer than 6 digits are entered.

#### Splash Screen (`app/index.tsx`)

- **TC-036**: When `boimix_access_token` exists and `GET /me/profile` returns 200, `router.replace('/(tabs)/')` is called.
- **TC-037**: When no token exists and `onboarding_seen = false`, `router.replace('/(auth)/onboarding')` is called.
- **TC-038**: When no token exists and `onboarding_seen = true`, `router.replace('/(auth)/login')` is called.
- **TC-039**: When token exists but `/me/profile` returns 401, the token refresh is attempted.
- **TC-040**: When token refresh fails, `router.replace('/(auth)/login')` is called.

---

### Phase 2 — Core Discovery

#### `lib/api/books.ts`

- **TC-041**: `list(params)` sends GET to `/books/` with params as query string.
- **TC-042**: `getBySlug(slug)` sends GET to `/books/${slug}`.
- **TC-043**: `nearby({ lat, lng, radius })` sends GET to `/books/nearby` with correct params.
- **TC-044**: `search(q, params)` sends GET to `/search/books/?q=${q}`.

#### `hooks/useInfiniteBooks.ts`

- **TC-045**: First render fetches page 1.
- **TC-046**: `fetchNextPage()` appends page 2 results to existing data.
- **TC-047**: When API returns `next: null`, `hasNextPage` is false.
- **TC-048**: All pages' `results` arrays are flattened for display.

#### `components/shared/BookCard.tsx`

- **TC-049**: Renders book title and author.
- **TC-050**: When `availabilityMode = 'sell'`, renders price.
- **TC-051**: When `availabilityMode = 'borrow'`, renders "ধার" badge.
- **TC-052**: When `availabilityMode = 'exchange'`, renders "বিনিময়" badge.
- **TC-053**: When `isOutOfStock = true`, renders "স্টক নেই" badge and the cart button is disabled.
- **TC-054**: When `coverUrl` is null, renders a placeholder image (not null/undefined).
- **TC-055**: When `isWishlisted = true`, the wishlist icon is in its active/filled state.
- **TC-056**: Pressing the card calls `onPress` with the book's slug.
- **TC-057**: Pressing the wishlist icon calls `onWishlistToggle` with the book's ID.
- **TC-058**: Title longer than 2 lines is truncated (verify `numberOfLines={2}` prop).
- **TC-059**: When `price` is 0 or undefined, displays "বিনামূল্যে".
- **TC-060**: When `distance > 50000` meters, displays "দূরে" label.

#### `utils/formatPrice.ts`

- **TC-061**: `formatPrice(150)` returns "৳১৫০".
- **TC-062**: `formatPrice(0)` returns "বিনামূল্যে".
- **TC-063**: `formatPrice(undefined)` returns "বিনামূল্যে".
- **TC-064**: `formatPrice(1500)` formats with thousand separator "৳১,৫০০".

---

### Phase 3 — Transactions & Cart

#### `hooks/useCart.ts`

- **TC-065**: `addToCart(bookId, quantity)` sends POST to `/me/cart` and invalidates `queryKeys.me.cart()`.
- **TC-066**: `removeFromCart(itemId)` sends DELETE and applies optimistic update.
- **TC-067**: If `removeFromCart` fails, the optimistic update is rolled back.
- **TC-068**: `updateQuantity(itemId, qty)` sends PATCH and updates `cartStore` count optimistically.
- **TC-069**: Cart item count in `cartStore` reflects the number of items in the cart.

#### `hooks/useWishlist.ts`

- **TC-070**: `toggleWishlist(bookId)` immediately updates `wishlistStore` IDs set.
- **TC-071**: If book ID is in `wishlistStore`, sends DELETE to `/me/wishlist/items/${bookId}`.
- **TC-072**: If book ID is not in `wishlistStore`, sends POST to `/me/wishlist/items`.
- **TC-073**: If the API call fails, the `wishlistStore` toggle is reversed.

#### `lib/api/orders.ts`

- **TC-074**: `getMyOrders()` sends GET to `/me/orders`.
- **TC-075**: `getBorrowOrders()` sends GET to `/me/borrow-orders`.
- **TC-076**: `getExchanges()` sends GET to `/me/exchanges`.

---

### Phase 4 — Profile & Seller Features

#### `hooks/useWebSocket.ts`

- **TC-077**: On mount, creates a WebSocket connection to the correct URL with token query param.
- **TC-078**: On unmount, closes the WebSocket connection.
- **TC-079**: When `readyState` is CLOSED, schedules a reconnect with exponential backoff.
- **TC-080**: After a reconnect attempt succeeds, the message handler is reattached.
- **TC-081**: After 5 consecutive failed reconnects, an "সংযোগ ব্যর্থ" error is set in the hook's state.
- **TC-082**: Sending a message when `readyState !== OPEN` queues the message and sends it after reconnect.
- **TC-083**: The ping interval sends `{ type: 'ping' }` every 30 seconds.
- **TC-084**: The ping interval is cleared on unmount.

#### `lib/api/me.ts`

- **TC-085**: `getProfile()` sends GET to `/me/profile`.
- **TC-086**: `updateProfile(payload)` sends PATCH to `/me/profile` with the payload.
- **TC-087**: `updateAvatar(url)` sends PATCH to `/me/profile` with `{ avatar_url: url }`.
- **TC-088**: `markNotificationRead(id)` sends PATCH to `/me/notifications/${id}/read`.

#### `utils/compressImage.ts`

- **TC-089**: Given a URI of an image > 1200px wide, returns a compressed URI ≤ 1200px wide.
- **TC-090**: The compressed output is in WebP format.
- **TC-091**: If compression fails (mocked to throw), returns the original URI.

#### `lib/api/media.ts`

- **TC-092**: `uploadMedia(uri, type)` sends POST to `/media/uploads` as `multipart/form-data` with `Content-Type: multipart/form-data`.
- **TC-093**: Returns `{ url: string }` on success.

---

### Phase 5 — Polish & Push Notifications

#### `hooks/useNotifications.ts`

- **TC-094**: `requestPermission()` calls `Notifications.requestPermissionsAsync()`.
- **TC-095**: When permission is granted, calls `Notifications.getExpoPushTokenAsync()`.
- **TC-096**: After getting the token, calls `meApi.updateProfile({ fcm_token })`.
- **TC-097**: When permission is denied, does not call `updateProfile` and sets `permissionDenied = true`.
- **TC-098**: `addNotificationReceivedListener` is called on mount and cleaned up on unmount.
- **TC-099**: When a notification arrives with `type = 'message'`, updates `notificationStore.unreadCount`.

#### `hooks/useOfflineQueue.ts`

- **TC-100**: When `NetInfo.isConnected = false`, mutations are added to `offlineQueueStore` instead of sent.
- **TC-101**: When `NetInfo.isConnected` changes from false to true, all queued mutations are flushed in order.
- **TC-102**: After a queued mutation succeeds, it is removed from the queue.
- **TC-103**: If a flushed mutation fails (network error again), it is re-added to the front of the queue.
- **TC-104**: Mutations marked as `noQueue: true` (payments) are not queued when offline and show an error immediately.

---

## 7. E2E Tests (Detox)

Detox test files live in `e2e/`. Each file describes a full user journey through the real app UI.

### E2E-001: Full Login and Home Load (`e2e/login.test.ts`)

1. Launch app on fresh install.
2. Expect onboarding screen to be visible (3 slides present).
3. Tap "Get Started" button.
4. Expect login screen to appear.
5. Tap email field, type a valid test user email.
6. Tap password field, type the correct password.
7. Tap "লগইন করুন" button.
8. Expect loading spinner to appear on button.
9. Expect home tab to become visible (tab bar appears).
10. Expect at least one book card to be visible in the Trending section.

### E2E-002: Login with Wrong Credentials (`e2e/login.test.ts`)

1. Launch app, skip onboarding.
2. Enter wrong email/password combination.
3. Tap login button.
4. Expect inline error message "ইমেইল বা পাসওয়ার্ড ভুল" to appear.
5. Expect to remain on login screen.

### E2E-003: Buy a Book with COD (`e2e/buyBook.test.ts`)

1. Log in as test buyer.
2. Navigate to Explore tab.
3. Search for a known test book title.
4. Tap the first result.
5. Expect book detail screen to appear.
6. Tap "কার্টে যোগ করুন" button.
7. Expect cart icon badge to increment.
8. Navigate to cart (from tab or header button).
9. Expect the book to appear in cart.
10. Tap "চেকআউট করুন".
11. Select "Cash on Delivery" payment method.
12. Tap "অর্ডার করুন".
13. Expect order confirmation screen to appear with order ID.
14. Navigate to Orders tab.
15. Expect the new order to appear in the list with "অপেক্ষামাণ" status.

### E2E-004: Upload a Book (`e2e/uploadBook.test.ts`)

1. Log in as test seller.
2. Navigate to Profile tab.
3. Tap "বই যোগ করুন" button.
4. Expect upload multi-step form to appear (Step 1).
5. Skip ISBN scanner, tap "ম্যানুয়ালি লিখুন".
6. Fill in book title, author, publisher.
7. Tap "পরবর্তী" to go to Step 2.
8. Select condition "ভালো (Good)".
9. Select availability mode "বিক্রয়".
10. Enter price "150".
11. Tap "পরবর্তী" to go to Step 3 (Photos).
12. Tap "ফটো যোগ করুন" (or skip for test).
13. Tap "পরবর্তী" through location step.
14. Tap "জমা দিন" on the review step.
15. Expect success toast "বই যোগ করা হয়েছে".
16. Navigate to Profile → My Library.
17. Expect the uploaded book to appear in the library list.

### E2E-005: Register, Verify OTP, Complete Profile (`e2e/registration.test.ts`)

1. Launch app, tap "নিবন্ধন করুন" on login screen.
2. Fill name, email (unique test email), password, confirm password.
3. Accept terms checkbox.
4. Tap "নিবন্ধন করুন".
5. Expect OTP screen to appear with the email displayed.
6. Enter a valid test OTP (pre-seeded in backend test environment).
7. Expect complete profile screen to appear.
8. Skip avatar and location.
9. Tap "সম্পন্ন করুন" or "এড়িয়ে যান".
10. Expect language selection screen to appear.
11. Tap "বাংলা".
12. Expect home tab to appear.

### E2E-006: Offline Home Screen (`e2e/offline.test.ts`)

1. Log in and load home screen (allow cache to populate).
2. Enable airplane mode (via Detox device API).
3. Kill and relaunch the app.
4. Expect offline banner ("অফলাইন") to appear.
5. Expect home sections to show cached book data (not empty, not error).
6. Disable airplane mode.
7. Expect offline banner to disappear.
8. Expect data to silently refresh.

---

## 8. Test Helpers and Factories

Create test factories to generate consistent mock data:

### `__tests__/factories/book.ts`
```typescript
// Factory function signature (do not implement until tests are requested)
export const makeBookCardBook = (overrides?: Partial<BookCardBook>): BookCardBook
```

### `__tests__/factories/user.ts`
```typescript
export const makeAuthUser = (overrides?: Partial<AuthUser>): AuthUser
export const makeUserProfile = (overrides?: Partial<UserProfile>): UserProfile
```

### `__tests__/factories/notification.ts`
```typescript
export const makeNotification = (type: NotificationType, overrides?: object): Notification
```

---

## 9. Coverage Targets

| Layer | Minimum Coverage |
|-------|-----------------|
| `lib/api/` | 90% |
| `hooks/` | 85% |
| `utils/` | 95% |
| `stores/` | 80% |
| `components/shared/` | 70% |
| Screens | 50% (integration via E2E) |

Coverage is measured by Jest. Run with `jest --coverage`. Do not report coverage until tests are requested.

---

*Document version: 1.0 — Phase 0*
