# BoiMix Mobile Agent Instructions

This file is the highest-priority working agreement for anyone or anything modifying the BoiMix Mobile app. It applies to every AI agent, automated tool, and human contributor working on this codebase.

---

## Must Read First

Before writing any mobile code, changing any screen, or touching any configuration, read **all** of the following documents in `docs/`:

| # | File | Purpose |
|---|------|---------|
| 1 | `mobile_architecture.md` | Project structure, tech stack, folder layout, navigation, API layer, state management |
| 2 | `mobile_phase_by_phase_plan.md` | Detailed implementation plan — all screens, all states, all edge cases |
| 3 | `mobile_coding_standards.md` | TypeScript rules, naming conventions, component rules, style rules |
| 4 | `mobile_testing_standards.md` | Testing philosophy, what to test, how to mock, E2E strategy |
| 5 | `mobile_decision_log.md` | Recorded architectural decisions with rationale — read before proposing alternatives |
| 6 | `mobile_env_reference.md` | All environment variables, their values, and security rules |

> **Do not start implementation until all must-read documents have been reviewed.**

---

## Hard Rules for Mobile Development

### Platform & Framework

- **Expo Managed Workflow only.** Do not eject to bare workflow without an explicit user decision recorded in `mobile_decision_log.md`.
- **Android first.** All features must work and be tested on Android before iOS is considered.
- **Expo Router for all navigation.** Do not introduce `react-navigation` manually — Expo Router wraps it.
- **NativeWind v4 for all styling.** No `StyleSheet.create` for layout or spacing. `StyleSheet` is only allowed for animation transforms and shadows that NativeWind cannot express.
- **TypeScript strict mode is non-negotiable.** The compiler must pass with zero errors and zero warnings before any code is considered complete.

### Authentication & Security

- **Always use `expo-secure-store` for token storage.** Never use `AsyncStorage`, `localStorage`, `document.cookie`, `sessionStorage`, or any in-memory-only store for access tokens or refresh tokens.
- **Never log tokens, passwords, or personal data** to `console.log`, crash reporters, or analytics.
- **Never put secrets in `EXPO_PUBLIC_` env vars.** These are bundled into the binary and readable by anyone who decompiles the APK. Use EAS Secrets for build-time secrets.
- **Never hardcode API keys, tokens, or credentials** anywhere in source code.
- Tokens must be cleared from SecureStore on logout and on 401-after-refresh failures.

### API & Networking

- **All API calls go through `lib/api/client.ts`.** No component or hook may import `axios` directly.
- **All API endpoint functions live in `lib/api/` service files.** Components and hooks call these functions — never raw `axios.get(...)` calls.
- **Never construct URL strings inline.** All endpoints are constants in `lib/api/endpoints.ts`.
- **Handle all three states for every network call:** loading, error, empty/success. No screen may render without handling all three.
- The Axios interceptor handles 401 → token refresh → retry automatically. Do not implement manual refresh logic in individual screens.

### State Management

- **Server state → React Query.** Any data that comes from the API belongs in React Query (`useQuery`, `useInfiniteQuery`, `useMutation`).
- **Client-only UI state → Zustand.** Cart counts, auth state, filter selections, language preference, offline queue.
- **Do not duplicate server state in Zustand.** Do not copy API responses into Zustand stores — React Query is the cache.

### TypeScript

- `strict: true` in `tsconfig.json` — no exceptions.
- **No `any` types.** Use `unknown` and narrow, or define a proper type/interface.
- **No unused imports.** The ESLint `no-unused-vars` rule is set to error.
- **No non-null assertions (`!`)** unless accompanied by a comment explaining why the value is guaranteed non-null.
- All API response shapes must have typed interfaces in `types/`.
- Use `z.infer<typeof schema>` for Zod-validated form values — do not define a separate type manually.

### Component Rules

- Each screen lives in its own folder: `app/(tabs)/home/index.tsx`, not `app/(tabs)/home.tsx` for complex screens.
- Shared, reusable components live in `components/shared/`.
- Feature-specific sub-components live next to their parent screen folder.
- No component file may exceed 200 lines. Extract sub-components when approaching this limit.
- All components that accept props must have a typed `Props` interface defined at the top of the file.

### Code Quality

- **KISS** — always choose the simplest solution that works.
- **DRY** — if logic is used in two places, extract it into a shared utility or hook.
- **SRP** — each function, hook, and component does exactly one thing.
- **YAGNI** — do not add functionality that is not in the current phase plan.
- **Small functions** — if a function is longer than 30 lines, split it.
- **No side effects in render** — never call API or mutate state directly in a component body.
- **Meaningful names** — `daysSinceLastUpdate`, not `d`; `fetchBooksBySlug`, not `getData`.

### File & Module Structure

- Never create barrel files (`index.ts` re-exporting everything) inside screen folders — this causes circular dependency issues with Expo Router.
- Barrel files are allowed in `components/shared/index.ts`, `lib/api/index.ts`, `types/index.ts`.
- One component per file. No multiple exported components from a single file (except when the second export is a named sub-component type like `BookCard.Skeleton`).

---

## Working Rules

| Scenario | Rule |
|----------|------|
| Task touches navigation structure | Update `mobile_architecture.md` → Navigation Architecture section |
| Task adds or changes an API endpoint | Update `lib/api/endpoints.ts` and the relevant service file; note it in `mobile_decision_log.md` if it deviates from the backend docs |
| Task adds a new screen | Add to `mobile_phase_by_phase_plan.md` and create an acceptance criteria entry |
| Task changes env variable usage | Update `mobile_env_reference.md` |
| Task reveals an architectural decision | Record it in `mobile_decision_log.md` immediately |
| Task changes public API shape (request/response) | Coordinate with backend team and update types in `types/` |
| Task modifies `app.json` | Document the change and reason in `mobile_decision_log.md` |

---

## Testing Rules

- **Do not create or run test cases unless explicitly asked by the user.**
- When tests are requested, use **Jest + React Native Testing Library** for unit and integration tests.
- **Detox** is the E2E test framework. Detox tests are defined in `e2e/` at the project root.
- Every custom hook must have a corresponding test file in a `__tests__/` folder next to it.
- Every API service function must be unit tested with Axios mocked.
- Do not mock the entire module — mock at the function level.
- Test files are named `ComponentName.test.tsx` for components, `useHookName.test.ts` for hooks.

---

## Strict Operational Boundaries (NON-NEGOTIABLE)

- **NEVER touch VPS or remote servers.** Do not execute `ssh`, `scp`, `rsync`, remote `docker`, or any command that connects to a remote host.
- **NEVER execute Git operations.** Do not run `git add`, `git commit`, `git push`, `git merge`, `git checkout`, `git rebase`, or any variant. All version control is strictly reserved for the USER.
- **NEVER run EAS build or publish commands** (`eas build`, `eas submit`, `eas update`) unless explicitly instructed by the user.
- **Local files only.** Only edit, inspect, and test code inside:
  - `/Users/roni/Desktop/BoiMix-Mobile/`
  - `/Users/roni/Desktop/BoiMix-Backend/` (read-only reference, never modify)
  - `/Users/roni/Desktop/BoiMix-frontend/` (read-only reference, never modify)

---

## Enforcement Expectations

- Pull requests that ignore these rules must be blocked by reviewers.
- Code that uses `any`, skips error states, or stores tokens in AsyncStorage must be rejected.
- Backend schema changes that are not reflected in `types/` must not be merged.
- Agents that skip reading `mobile_architecture.md` before coding will produce incorrect file structures and navigation patterns.

---

*Last updated: Phase 0 — Project Bootstrap*
*Maintainer: BoiMix Mobile Team*
