# Technology Stack

**Project:** GymCoach AI — React Native AI fitness coaching app
**Researched:** 2026-03-01
**Overall confidence:** HIGH (official docs + verified releases for all core choices)

---

## Recommended Stack

### Mobile Client

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Expo SDK | 55 | React Native app framework | Latest stable (Feb 2026). New Architecture enabled by default. EAS Build + OTA updates included. Avoids native toolchain headaches. |
| React Native | 0.83 | Cross-platform mobile runtime | Bundled with Expo SDK 55. New Architecture (JSI) is default — required for MMKV v4 performance. |
| React | 19.2.0 | UI library | Bundled with Expo 55. |
| TypeScript | 5.x | Static typing | Expo templates ship TS by default. Required for AI response schema validation and safe API client typing. |
| Expo Router | 4.x | File-based navigation | Ships with Expo SDK 55. Handles tab layout, auth groups, deep linking natively. No setup required. |
| Zustand | 5.x | Client UI state management | Minimal boilerplate. Synchronous. Works perfectly as a complement to TanStack Query. Widely used in RN ecosystem. |
| TanStack Query | 5.x | Server state + caching | Industry standard for async server state in React. Handles loading/error states, cache invalidation, optimistic updates, background refetch — all the things you'd otherwise build manually. |
| react-native-mmkv | 4.1.2 | Persistent local storage | v4 uses Nitro Modules — synchronous JSI-based storage, ~30× faster than AsyncStorage. Required for offline exercise cache and auth token persistence. New Architecture compatible. |
| @shopify/flash-list | 2.x | Virtualized list rendering | Built for New Architecture. Eliminates blank cells during scroll via component recycling. Drop-in FlatList replacement. Required for exercise library (200–500 items). |
| expo-secure-store | latest | Secure credential storage | iOS Keychain + Android Encrypted SharedPreferences. Required for auth token storage — AsyncStorage is explicitly not safe for secrets per RN security docs. |
| zod | 3.x | Schema validation | Validates AI JSON responses on the client before rendering. Also used for onboarding form validation. |

### Backend API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 20 LTS | Runtime | LTS (supported until 2026-04-30), required by Expo toolchain (≥20.19.x). |
| Express | 5.x | HTTP server framework | Minimal, well-understood, huge ecosystem. Express 5 has async error handling built in — no express-async-errors hack needed. |
| TypeScript | 5.x | Static typing | Same language as the client. Shared types via a `packages/shared` module. |
| @supabase/supabase-js | 2.x | Supabase DB client (server-side) | Service role client for server-side DB writes. Never exposed to the client. |
| openai | 4.x | OpenAI API client | Official SDK. Also works for OpenRouter (OpenAI-compatible API). Supports streaming, structured outputs. |
| @google/generative-ai | 0.x | Gemini API client | Official Google AI SDK for Node. Required since Gemini has a different response shape from OpenAI. |
| zod | 3.x | Request/response validation | Validates AI responses against program schema before saving to DB. Validates incoming request bodies. |
| express-rate-limit | 7.x | Per-IP rate limiting | Base layer against abuse. Combine with per-user quota tracking in DB for AI endpoints. |
| jsonwebtoken | 9.x | JWT validation | Validates Supabase-issued JWTs using Supabase's public JWKS endpoint. |

### Auth & Database (BaaS)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | Cloud | User auth (email + OAuth) | Handles JWT issuance, refresh, session management. PKCE flow supported and recommended for mobile. Free tier supports 50K MAU. |
| Supabase Database (Postgres) | Cloud | Primary data store | Postgres with Row Level Security, managed hosting, auto-scaling on Pro tier. Direct Postgres — no ORM lock-in. |

### AI Providers (all via backend proxy)

| Provider | Use Case | Why |
|----------|----------|-----|
| OpenRouter | Default multi-model gateway | Covers GPT-5, Claude 3.x, Llama 3, Mistral, and 200+ models via a single OpenAI-compatible API. User can switch models without backend changes. |
| Google Gemini API | Gemini 2.0 Flash / Pro | Google's own API endpoint. Better rate limits for Gemini models than going through OpenRouter. Requires separate `@google/generative-ai` SDK (different response shape). |
| OpenAI | GPT-5, GPT-5 mini | Direct OpenAI API for users who want the flagship model. Supports Structured Outputs (`strict: true`) for guaranteed JSON schema compliance. |

### Infrastructure & Deployment

| Technology | Purpose | Why |
|------------|---------|-----|
| Railway | Backend API hosting | Zero-DevOps PaaS. Auto-deploys from GitHub. Supports Node/Express natively. Free tier includes 500 hours/month. Scales with usage. Preferred over Heroku (pricing) and Fly.io (more setup). |
| Supabase Cloud | Auth + DB hosting | Managed Postgres + Auth. Free tier: 50K MAU, 500MB DB. Pro: $25/month when needed. |
| EAS Build | Mobile app builds | Expo Application Services. Cloud builds for iOS and Android. Eliminates need for local Xcode/Android Studio for CI. |
| EAS Update | OTA updates | Push JS bundle updates without App Store review. Critical for quick fixes post-launch. |
| GitHub Actions | CI/CD | Runs tests, linting, and EAS builds on PR. Standard, free for public repos. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @d11/react-native-fast-image | 1.x | Image loading with caching | Exercise images in the library. Provides memory + disk cache; plain `<Image>` reloads on every scroll pass. |
| expo-auth-session | latest | OAuth auth flows | For Google/Apple OAuth on mobile. Use PKCE flow (`responseType: "code"`) — implicit flow is deprecated per Expo + Supabase docs. |
| @tanstack/react-query-devtools | 5.x | Query debugging | Dev-only. Inspect cache state, queries, mutations. Remove from production build. |
| react-hook-form | 7.x | Form state management | Onboarding multi-step form. Works well with Zod resolver for validation. No unnecessary re-renders. |
| date-fns | 3.x | Date utilities | Scheduling workouts, computing "today's session", formatting dates in history view. Lightweight (tree-shakable). |
| @react-native-async-storage/async-storage | 2.x | Non-sensitive async storage | Use ONLY for non-sensitive data (UI preferences, cached exercise IDs). NEVER for auth tokens. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Navigation | Expo Router | React Navigation | Expo Router is file-based (less boilerplate), ships with SDK 55, handles deep links and auth groups cleanly. React Navigation still valid but requires more configuration. |
| State management | Zustand + TanStack Query | Redux Toolkit + RTK Query | Redux is heavier, more boilerplate, and less ergonomic for React Native in 2026. RTK Query is solid but TanStack Query has better caching primitives and community traction. |
| Local storage | MMKV | AsyncStorage | AsyncStorage is asynchronous (causes waterfalls), unencrypted (unsafe for tokens), and 30× slower than MMKV per benchmarks. MMKV is the clear winner for RN in 2026. |
| Local storage | MMKV | WatermelonDB | WatermelonDB is excellent for complex relational offline data (e.g., offline-first apps). For this project, MMKV is sufficient — the only offline data is the exercise library cache and the completion queue. WatermelonDB would add complexity without benefit. |
| List rendering | FlashList | FlatList | FlatList causes blank cells and jank at 200+ items on Android without significant tuning. FlashList v2 (Feb 2026) solves this natively with New Architecture support. |
| Backend | Express + Railway | NestJS + Railway | NestJS adds boilerplate and opinionated structure that's overkill for this project's backend scope. Express is lighter and faster to iterate. |
| Backend | Express + Railway | Supabase Edge Functions | Edge Functions work well for simple operations but have cold starts, limited CPU, and no persistent connections — not ideal for AI streaming proxy that may need 15+ second connections. |
| Database | Supabase Postgres | Firebase Firestore | Postgres is relational — the training program data (programs → sessions → exercises) fits a relational schema perfectly. Firestore would require denormalization and loses the ability to query across tables. |
| Auth | Supabase Auth | Clerk | Both are excellent. Supabase Auth is included in the Supabase tier you're already paying for, and the SDK integration with Supabase DB is seamless (RLS uses `auth.uid()`). Clerk would add a separate billing tier. |
| Image caching | react-native-fast-image | expo-image | expo-image (Expo's first-party image component, SDK 55) now includes built-in caching and is preferred for Expo-managed projects. Either works; expo-image has better Expo SDK integration and avoids a native dependency. **Prefer `expo-image` for Expo-managed workflow.** |

---

## Installation

### Mobile Client Bootstrap

```bash
# Create project
npx create-expo-app gym-coach-app --template tabs

# Install core state + data
npx expo install @tanstack/react-query zustand react-native-mmkv

# Install list + images
npx expo install @shopify/flash-list expo-image

# Install auth + security
npx expo install expo-auth-session expo-secure-store expo-crypto

# Install forms + validation
npm install react-hook-form zod @hookform/resolvers
```

### Backend Bootstrap

```bash
mkdir gym-coach-app-api && cd gym-coach-app-api
npm init -y

# Runtime
npm install express @supabase/supabase-js openai @google/generative-ai

# Validation + security
npm install zod jsonwebtoken express-rate-limit helmet cors

# Dev
npm install -D typescript ts-node nodemon @types/express @types/node @types/jsonwebtoken
```

---

## Key Version Rationale

| Decision | Rationale |
|----------|-----------|
| Expo SDK 55 (not 54) | SDK 55 targets RN 0.83, which enables New Architecture by default. MMKV v4 and FlashList v2 both require New Architecture for full performance. Starting on 54 and upgrading later is painful. |
| MMKV v4 (Nitro, not v3 TurboModules) | v4 is a full rewrite using Nitro Modules. Faster, works on old architecture as a fallback (RN < 0.82), and fixes duplicate symbol issues that plagued v3. v4.1.2 is the current stable. |
| TanStack Query v5 (not v4) | v5 has a unified API (no `isLoading`/`isFetching` split), better TypeScript types, and `infiniteQuery` improvements. No reason to start on v4 in 2026. |
| Express 5 (not 4) | Express 5 handles async errors natively in route handlers — no `try/catch` wrappers or `express-async-errors` needed. Officially stable as of late 2024. |
| Railway (not Fly.io) | Both are excellent. Railway has a simpler DX for Node/Express (zero config detection) and a more generous free tier for a greenfield project. Switch to Fly.io later if needed. |

---

## Sources

- **Expo SDK 55 release / version table:** https://docs.expo.dev/versions/latest/ — accessed 2026-03-01 — HIGH confidence
- **react-native-mmkv v4.1.2:** https://github.com/mrousavy/react-native-mmkv/releases — released 2026-01-28 — HIGH confidence
- **TanStack Query v5:** https://tanstack.com/query/latest/docs/framework/react/installation — current stable — HIGH confidence
- **Expo Router docs:** https://docs.expo.dev/router/introduction/ — SDK 55 compatible — HIGH confidence
- **Supabase Auth mobile PKCE:** https://supabase.com/docs/guides/auth/sessions — HIGH confidence (official docs)
- **expo-image (first-party image component):** https://docs.expo.dev/versions/latest/sdk/image/ — included in SDK 55 — HIGH confidence
- **Express 5:** https://expressjs.com/en/5x/api.html — stable, async error handling built in — MEDIUM confidence (stable but less ecosystem tooling than Express 4 at time of research)
- **Railway pricing / free tier:** https://railway.com — MEDIUM confidence (pricing subject to change)
- **OpenRouter API (OpenAI-compatible):** https://openrouter.ai/docs — HIGH confidence (confirmed in PITFALLS.md research)

---

*Stack research for: React Native AI fitness coaching app (GymCoach AI)*
*Researched: 2026-03-01*
