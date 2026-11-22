# BoiMix Mobile — Coding Standards

> These standards are non-negotiable. All code merged into this repository must comply fully. Reviewers must reject non-compliant code.

---

## 1. TypeScript Rules

### Strict Mode

The `tsconfig.json` must have `"strict": true`. This enables all of:
- `strictNullChecks`
- `noImplicitAny`
- `strictFunctionTypes`
- `strictPropertyInitialization`
- `strictBindCallApply`

### No `any`

```typescript
// ❌ BAD
const handleResponse = (data: any) => { ... };

// ✅ GOOD — use unknown and narrow
const handleResponse = (data: unknown) => {
  if (!isApiResponse(data)) throw new Error('Unexpected shape');
  ...
};

// ✅ GOOD — define a type
const handleResponse = (data: BookListResponse) => { ... };
```

### No Non-Null Assertions Without Comment

```typescript
// ❌ BAD
const name = user!.name;

// ✅ GOOD — only when guaranteed, with reason
// user is guaranteed non-null here because this component is inside AuthGuard
const name = user!.name;
```

### Proper Generic Typing for API Responses

```typescript
// types/api.ts
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  code: string;
  field?: string;
  details?: Record<string, string[]>;
}
```

All `useQuery` and `useMutation` calls must be explicitly typed:

```typescript
// ✅ GOOD
const { data } = useQuery<PaginatedResponse<BookCardBook>, ApiError>({
  queryKey: queryKeys.books.list(params),
  queryFn: () => booksApi.list(params),
});
```

### Zod for Form Values

```typescript
// ✅ GOOD — single source of truth
const loginSchema = z.object({
  email: z.string().email('বৈধ ইমেইল দিন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'),
});
type LoginFormValues = z.infer<typeof loginSchema>;
// Do NOT define a separate LoginFormValues interface
```

### Discriminated Unions for Status

```typescript
// ✅ GOOD
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type BorrowStatus = 'pending' | 'approved' | 'active' | 'returned' | 'overdue';

// Use in switch — TypeScript will enforce exhaustiveness
const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case 'pending': return 'অপেক্ষামাণ';
    case 'confirmed': return 'নিশ্চিত';
    case 'shipped': return 'পাঠানো হয়েছে';
    case 'delivered': return 'পৌঁছেছে';
    case 'cancelled': return 'বাতিল';
  }
};
```

---

## 2. File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React component | PascalCase | `BookCard.tsx`, `HeroBanner.tsx` |
| Screen file (Expo Router) | kebab-case (framework enforced) | `verify-otp.tsx`, `[slug].tsx` |
| Custom hook | camelCase, `use` prefix | `useAuth.ts`, `useInfiniteBooks.ts` |
| Utility function | camelCase | `formatPrice.ts`, `compressImage.ts` |
| Type file | camelCase | `book.ts`, `user.ts` |
| API service file | camelCase | `books.ts`, `me.ts` |
| Store file | camelCase, `Store` suffix | `authStore.ts`, `cartStore.ts` |
| Constant file | camelCase | `colors.ts`, `routes.ts` |
| Test file | Same name + `.test.` | `BookCard.test.tsx`, `useAuth.test.ts` |

---

## 3. Folder Structure Rules

### Feature-Based, Not Type-Based

```
// ❌ BAD — type-based (puts all components together regardless of feature)
components/
  BookCard.tsx
  UserAvatar.tsx
  HeroBanner.tsx
  MessageBubble.tsx

// ✅ GOOD — feature-based with shared layer
components/
  shared/        ← used in 3+ features
    BookCard.tsx
    Avatar.tsx
  home/          ← used only in home feature
    HeroBanner.tsx
  chat/          ← used only in chat feature
    MessageBubble.tsx
```

### No Barrel Files in Screen Folders

```typescript
// ❌ BAD — do not create this in app/(auth)/index.ts
export { default as Login } from './login';
export { default as Register } from './register';

// ✅ GOOD — Expo Router needs direct file access, no barrels in app/
// Just use direct imports when needed from other files
```

Barrel files (`index.ts`) ARE allowed in:
- `components/shared/index.ts`
- `lib/api/index.ts`
- `types/index.ts`
- `constants/index.ts`

### One Component Per File

```typescript
// ❌ BAD
export const BookCard = () => { ... };
export const BookCardSkeleton = () => { ... }; // separate file!

// ✅ GOOD — in BookCard.tsx only:
export const BookCard = () => { ... };
// BookCardSkeleton lives in BookCardSkeleton.tsx
```

The only exception: static sub-types attached to a component namespace are allowed:
```typescript
// BookCard.tsx
export const BookCard = (props: Props) => { ... };
BookCard.displayName = 'BookCard'; // allowed
```

---

## 4. Component Rules

### Props Interface

Every component with props must have a typed `Props` interface at the top of the file:

```typescript
// ✅ GOOD
interface Props {
  book: BookCardBook;
  variant?: 'grid' | 'horizontal' | 'list';
  onPress: (slug: string) => void;
  onWishlistToggle?: (bookId: string) => void;
}

export const BookCard = ({ book, variant = 'grid', onPress, onWishlistToggle }: Props) => {
  ...
};
```

### 200-Line Limit

If a component exceeds 200 lines, split it. Extract:
- Repeated UI blocks into named sub-components
- Complex logic into a custom hook (`useBookCard.ts`)
- Static content (arrays, maps) into constants files

### No Inline Logic in JSX

```typescript
// ❌ BAD
<Text>{book.price > 0 ? `৳${book.price.toLocaleString('bn-BD')}` : 'বিনামূল্যে'}</Text>

// ✅ GOOD — use utility function
<Text>{formatPrice(book.price)}</Text>
```

### Conditional Rendering

```typescript
// ❌ BAD — falsy number 0 renders as "0"
{items.length && <ItemList items={items} />}

// ✅ GOOD — explicit boolean
{items.length > 0 && <ItemList items={items} />}

// ✅ GOOD — ternary for empty state
{items.length > 0 ? <ItemList items={items} /> : <EmptyState message="কোনো আইটেম নেই" />}
```

### Handle All Three States in Every Screen

Every screen that fetches data must handle:

```typescript
const MyScreen = () => {
  const { data, isLoading, isError, refetch } = useQuery({ ... });

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data || data.results.length === 0) return <EmptyState />;

  return <MainContent data={data} />;
};
```

No screen may leave any of these three states unhandled.

---

## 5. Hook Rules

### Location and Naming

- All custom hooks live in `hooks/`.
- Hooks must be prefixed with `use`: `useAuth`, `useLocation`, `useWebSocket`.
- Hooks that wrap a Zustand store action are named `use<StoreName>`: `useAuthActions`, `useCartActions`.

### No API Calls in Components

```typescript
// ❌ BAD — axios directly in component
const MyScreen = () => {
  useEffect(() => {
    axios.get('/books/').then(setBooks);
  }, []);
};

// ✅ GOOD — API call through React Query hook
const MyScreen = () => {
  const { data: books } = useQuery({
    queryKey: queryKeys.books.list({}),
    queryFn: booksApi.list,
  });
};
```

### Return Shape

Custom hooks return an object (not an array) unless the hook is a simple value-setter pair like `useState`:

```typescript
// ✅ GOOD — named return values
const useLocation = () => {
  return { location, isLoading, error, requestPermission };
};

// ✅ ACCEPTABLE — only for state-setter pairs
const [value, setValue] = useState('');
```

### JSDoc for Public Hooks

Every hook exported from `hooks/` must have a JSDoc comment:

```typescript
/**
 * Provides current user auth state and login/logout actions.
 * Hydrates from SecureStore on first call.
 * @returns {{ user, isAuthenticated, login, logout, isLoading }}
 */
export const useAuth = () => { ... };
```

---

## 6. API Layer Rules

### All API Calls Through `lib/api/`

```typescript
// ❌ BAD — direct axios in a hook
import axios from 'axios';
const data = await axios.get('/books/');

// ❌ BAD — direct client import in component
import { client } from '@/lib/api/client';
const data = await client.get('/books/');

// ✅ GOOD — through service layer
import { booksApi } from '@/lib/api/books';
const data = await booksApi.list(params);
```

### Service Function Shape

Each API service function must:
1. Accept typed parameters
2. Return a typed Promise
3. Have a JSDoc comment explaining the endpoint

```typescript
// lib/api/books.ts

/**
 * Fetch paginated book list with optional filters.
 * GET /books/
 */
export const list = async (params: BookListParams): Promise<PaginatedResponse<BookCardBook>> => {
  const { data } = await client.get<PaginatedResponse<BookCardBook>>(ENDPOINTS.BOOKS.LIST, { params });
  return data;
};

/**
 * Fetch single book by slug.
 * GET /books/{slug}
 */
export const getBySlug = async (slug: string): Promise<BookDetail> => {
  const { data } = await client.get<BookDetail>(ENDPOINTS.BOOKS.DETAIL(slug));
  return data;
};
```

### Error Handling in Service Layer

Service functions do NOT catch errors — they let them propagate to React Query, which handles them. The Axios interceptor normalizes error shapes.

```typescript
// ❌ BAD — swallowing errors
export const list = async () => {
  try {
    const { data } = await client.get('/books/');
    return data;
  } catch {
    return []; // ← caller has no idea an error occurred
  }
};

// ✅ GOOD — let it throw
export const list = async (params: BookListParams) => {
  const { data } = await client.get(ENDPOINTS.BOOKS.LIST, { params });
  return data;
};
```

---

## 7. State Rules

### Decision Matrix

| Question | Answer |
|----------|--------|
| Does it come from the server? | React Query |
| Does it need to persist across app restarts (not auth)? | Zustand with AsyncStorage persistence |
| Is it auth-related? | Zustand (authStore) + SecureStore |
| Is it UI-only (modal open, tab selected)? | `useState` local state |
| Is it shared between unrelated components? | Zustand |
| Can it be derived from existing state? | `useMemo`, not stored |

### Zustand Store Rules

- Stores must NOT perform async operations directly — async belongs in hooks or service layers.
- Store actions that need async (like `login`) receive the result as a parameter and handle only state mutation:

```typescript
// ✅ GOOD
// In hook:
const login = async (email: string, password: string) => {
  const { user, tokens } = await authApi.login({ email, password });
  await authStore.getState().setSession(user, tokens); // authStore handles storage
};

// In authStore:
setSession: async (user, tokens) => {
  await SecureStorage.set('boimix_access_token', tokens.access);
  await SecureStorage.set('boimix_refresh_token', tokens.refresh);
  set({ user, accessToken: tokens.access, isAuthenticated: true });
}
```

---

## 8. Style Rules

### NativeWind Only for Layout

```typescript
// ❌ BAD — StyleSheet for layout
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
});
<View style={styles.container}>

// ✅ GOOD — NativeWind className
<View className="flex-1 p-4 bg-white">
```

### StyleSheet ONLY for Animations and Shadows

```typescript
// ✅ ACCEPTABLE
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
```

### Design Token Consistency

Use only values from `constants/colors.ts` and `tailwind.config.js`. Do not hardcode hex colors:

```typescript
// ❌ BAD
<View className="bg-[#E84B1B]">

// ✅ GOOD — defined in tailwind.config.js as custom color
<View className="bg-brand-primary">
```

### Responsive Design

Use NativeWind's `Platform`-aware classes and Expo's `useWindowDimensions` for truly responsive layouts:

```typescript
// ✅ GOOD
<View className={`p-4 ${Platform.OS === 'ios' ? 'pt-safe' : ''}`}>

const { width } = useWindowDimensions();
const numColumns = width > 600 ? 3 : 2; // tablet vs phone
```

---

## 9. Error Handling Rules

### Every Screen Must Handle

1. **Loading state**: skeleton placeholders or spinner
2. **Error state**: `<ErrorState message="লোড হয়নি" onRetry={refetch} />`
3. **Empty state**: `<EmptyState message="..." />` with contextual illustration
4. **Network offline state**: `<OfflineBanner />` shown globally

### Bangla Error Messages

All user-facing error messages must be in Bangla. Use `utils/errorMessages.ts`:

```typescript
// utils/errorMessages.ts
export const ERROR_MESSAGES: Record<string, string> = {
  'invalid_credentials': 'ইমেইল বা পাসওয়ার্ড ভুল',
  'email_not_verified': 'ইমেইল ভেরিফাই করুন',
  'network_error': 'ইন্টারনেট সংযোগ নেই',
  'server_error': 'সার্ভার সমস্যা, পরে চেষ্টা করুন',
  'rate_limited': 'অনেক চেষ্টা করা হয়েছে, ৫ মিনিট পর চেষ্টা করুন',
  'email_exists': 'এই ইমেইল আগে থেকেই নিবন্ধিত',
  'otp_expired': 'কোডের মেয়াদ শেষ, নতুন কোড পাঠান',
  'not_found': 'পাওয়া যায়নি',
};

export const getErrorMessage = (error: ApiError): string => {
  return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES['server_error'];
};
```

### Try-Catch in Event Handlers

```typescript
// ✅ GOOD
const handleSubmit = async (values: LoginFormValues) => {
  try {
    setIsLoading(true);
    await login(values.email, values.password);
    router.replace('/(tabs)/');
  } catch (error) {
    const apiError = error as ApiError;
    showToast(getErrorMessage(apiError), 'error');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 10. Performance Rules

### `React.memo`

Wrap a component in `React.memo` **only when**:
- It is rendered inside a `FlashList` or `FlatList`, AND
- Its parent re-renders frequently (e.g., the list container updates scroll position).

Do not blindly wrap every component.

### `useCallback`

Use `useCallback` for functions passed as props to `React.memo` components:

```typescript
// ✅ GOOD — prevents BookCard re-render on parent state change
const handleBookPress = useCallback((slug: string) => {
  router.push(`/book/${slug}`);
}, []);

<FlashList
  data={books}
  renderItem={({ item }) => <BookCard book={item} onPress={handleBookPress} />}
  estimatedItemSize={240}
/>
```

### `useMemo`

Use `useMemo` for:
- Filtered/sorted arrays (triggered by user filter changes)
- Derived display values that need heavy computation

Do NOT use `useMemo` for:
- Simple property access (`useMemo(() => obj.name, [obj])` — not needed)
- JSX elements (premature optimization)

### FlashList vs FlatList

| Use Case | Component |
|----------|-----------|
| Book lists (home sections, explore results, library) | `FlashList` |
| Horizontal promo banners (≤10 items) | `FlatList` |
| Chat messages | `FlashList` (inverted) |
| Short static lists (≤5 items) | `ScrollView` + map |

Always provide `estimatedItemSize` to `FlashList`:
- Book grid card: `240`
- Book list row: `120`
- Chat message: `60`
- Notification item: `80`

---

## 11. Import Order

Enforce with ESLint `import/order` rule. Order:

```typescript
// 1. React and React Native core
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';

// 2. Expo modules
import { Image } from 'expo-image';
import { router } from 'expo-router';

// 3. Third-party packages
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';

// 4. Local — lib/ and hooks/
import { booksApi } from '@/lib/api/books';
import { useAuth } from '@/hooks/useAuth';

// 5. Local — components/
import { BookCard } from '@/components/shared';
import { EmptyState } from '@/components/shared';

// 6. Local — stores/, types/, constants/, utils/
import { useFilterStore } from '@/stores/filterStore';
import type { BookCardBook } from '@/types/book';
import { queryKeys } from '@/lib/query/keys';

// 7. Relative imports (same directory)
import { BookSection } from './BookSection';
```

---

## 12. Comment Rules

### JSDoc for Exported Hooks and API Functions

Every hook exported from `hooks/` and every function exported from `lib/api/` must have JSDoc:

```typescript
/**
 * Infinite query for the explore/search book list.
 * Supports filter params and search query.
 * @param params - Filter and sort parameters
 * @returns Infinite query result with pages of BookCardBook arrays
 */
export const useInfiniteBooks = (params: BookListParams) => { ... };
```

### No Comments for Obvious Code

```typescript
// ❌ BAD — restating what the code clearly says
// Set the loading state to true
setIsLoading(true);

// ✅ GOOD — explains non-obvious behavior
// SecureStore has 2048 byte limit; chunk large tokens across multiple keys
await SecureStorage.setChunked('boimix_access_token', token);
```

### TODO Comments

Format: `// TODO(username): description — Phase N`

```typescript
// TODO(dev): Add Google Books API fallback for ISBN lookup — Phase 4
```

---

*Document version: 1.0 — Phase 0*
