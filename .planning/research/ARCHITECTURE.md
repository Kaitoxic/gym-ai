# Architecture Research

**Domain:** React Native AI fitness coaching mobile app
**Researched:** 2026-03-01
**Confidence:** HIGH (mobile client patterns), MEDIUM (backend design for this specific multi-provider AI proxy shape)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT (React Native / Expo)          │
├────────────┬───────────────┬────────────────┬────────────────────┤
│  Screens   │  State Layer  │  Data Layer    │  Local Storage     │
│  (Expo     │  (Zustand     │  (TanStack     │  (MMKV)            │
│  Router)   │  stores)      │  Query)        │                    │
└─────┬──────┴───────┬───────┴───────┬────────┴──────────┬─────────┘
      │              │               │                   │
      │         HTTPS / JWT          │             On-device
      │              │               │             (offline)
      ▼              ▼               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND API  (Node / Express)                 │
├────────────┬───────────────┬────────────────┬────────────────────┤
│  Auth      │  AI Proxy     │  User Data     │  Exercise Library  │
│  Routes    │  Routes       │  Routes        │  Routes            │
│  (via      │  (key guard,  │  (CRUD for     │  (static JSON or   │
│  Supabase) │  streaming)   │  workouts,     │  seeded DB rows)   │
│            │               │  programs)     │                    │
└─────┬──────┴───────┬───────┴───────┬────────┴──────────┬─────────┘
      │              │               │                   │
      ▼              ▼               ▼                   ▼
┌─────────┐  ┌──────────────┐  ┌──────────┐       ┌──────────────┐
│Supabase │  │  AI Providers│  │ Postgres │       │  Bundled     │
│  Auth   │  │  OpenRouter  │  │ (via     │       │  Exercise    │
│  (JWT)  │  │  Gemini API  │  │Supabase  │       │  JSON seed   │
│         │  │  OpenAI API  │  │  DB)     │       │  data        │
└─────────┘  └──────────────┘  └──────────┘       └──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Expo Router (file-based) | Screen navigation, deep linking, tab layout | `app/` directory with `(tabs)/`, `(auth)/` groups |
| Zustand stores | Client-side UI state (active workout, onboarding form, AI model selection) | Lightweight, synchronous, no boilerplate |
| TanStack Query | Server state: fetch, cache, sync workouts/programs/exercises from backend | `useQuery` / `useMutation` with optimistic updates |
| MMKV | Persistent local storage: auth token cache, offline workout queue, exercise library snapshot | Synchronous JS interface via JSI — ~30× faster than AsyncStorage |
| Backend API (Express) | Auth relay, AI proxy (hides all keys), CRUD for user data, business logic | Single Node/Express app deployed on Railway or Fly.io |
| Supabase Auth | JWT issuance, email/password and OAuth login, session refresh | Used as auth-as-a-service; app backend validates JWTs |
| Supabase DB (Postgres) | Users, programs, workout sessions, completions, user preferences | Row Level Security enforces user ownership |
| AI Proxy routes | Receive model + prompt from client, select provider, forward to AI, stream back | One route per concern: `/ai/generate-program`, `/ai/adapt-session`, `/ai/meal-suggestion` |
| Exercise Library | Curated exercise data (name, muscles, instructions, image refs) | Seeded into DB at deploy; never changes at runtime; optionally bundled as JSON for offline |

---

## Recommended Project Structure

### Mobile Client (`gym-coach-app/`)

```
app/                          # Expo Router — file = route
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   └── onboarding/
│       ├── index.tsx         # Step 1 — goal/level
│       ├── body.tsx          # Step 2 — metrics
│       └── schedule.tsx      # Step 3 — days/equipment
├── (tabs)/
│   ├── _layout.tsx           # Bottom tab bar
│   ├── index.tsx             # Today's session
│   ├── program.tsx           # Full multi-week program
│   ├── library/
│   │   ├── index.tsx         # Exercise list
│   │   └── [id].tsx          # Exercise detail
│   ├── meals.tsx             # AI meal suggestion
│   └── settings.tsx          # Profile, AI model picker
└── _layout.tsx               # Root layout (auth guard)

src/
├── api/                      # Typed API client functions (fetch wrappers)
│   ├── auth.ts
│   ├── programs.ts
│   ├── workouts.ts
│   ├── exercises.ts
│   └── ai.ts
├── stores/                   # Zustand stores (client UI state)
│   ├── useAuthStore.ts       # Auth token, user info
│   ├── useWorkoutStore.ts    # Active session state
│   └── useSettingsStore.ts   # AI model preference
├── hooks/                    # TanStack Query hooks (server state)
│   ├── useProgram.ts
│   ├── useWorkouts.ts
│   └── useExercises.ts
├── components/
│   ├── ui/                   # Primitive components (Button, Card, etc.)
│   ├── workout/              # WorkoutCard, ExerciseRow, SetLogger
│   ├── program/              # WeekView, SessionCard
│   └── ai/                  # AILoadingState, ModelBadge
├── lib/
│   ├── storage.ts            # MMKV instance exports
│   ├── queryClient.ts        # TanStack QueryClient config
│   └── api.ts                # Base fetch with auth header injection
└── types/                    # Shared TypeScript types
    ├── user.ts
    ├── workout.ts
    └── ai.ts
```

### Backend API (`gym-coach-app-api/`)

```
src/
├── routes/
│   ├── auth.ts               # POST /auth/verify (validate Supabase JWT)
│   ├── programs.ts           # GET/POST /programs, GET /programs/:id
│   ├── workouts.ts           # GET/POST/PATCH /workouts
│   ├── exercises.ts          # GET /exercises, GET /exercises/:id
│   ├── completions.ts        # POST /completions (mark workout done/skipped)
│   └── ai/
│       ├── generate.ts       # POST /ai/generate-program
│       ├── adapt.ts          # POST /ai/adapt-session
│       └── meals.ts          # POST /ai/meal-suggestion
├── middleware/
│   ├── auth.ts               # JWT validation (Supabase public key)
│   ├── rateLimit.ts          # Per-user AI rate limiting
│   └── validateBody.ts       # Zod body validation
├── services/
│   ├── aiRouter.ts           # Provider selector (OpenRouter / Gemini / OpenAI)
│   ├── promptBuilder.ts      # Build prompts from user profile + context
│   └── db.ts                 # Supabase client (service role key)
└── index.ts                  # Express app entry
```

### Structure Rationale

- **`(auth)/` route group:** Expo Router nests these outside the tab bar; unauthenticated users land here, authenticated users skip it
- **`(tabs)/`:** Bottom tab navigation — Today, Program, Library, Meals, Settings
- **`src/api/`:** Typed fetch wrappers live here, not in components — keeps components dumb
- **`src/stores/`:** Zustand for *client UI* state only (what's currently selected, token cache). No server data here — that belongs in TanStack Query cache
- **`src/hooks/`:** TanStack Query hooks as the single source of truth for *server state*. Never fetch in components directly
- **`routes/ai/`:** AI routes are separate files per concern — easier to add rate limiting, streaming, or caching per endpoint independently

---

## Architectural Patterns

### Pattern 1: AI Proxy — Backend as Key Vault

**What:** The React Native client NEVER holds AI provider API keys. All AI calls go to the backend via `/ai/*` routes. The backend selects the appropriate provider based on the user's stored model preference, builds the prompt, calls the AI API with the secret key, and streams or returns the response.

**When to use:** Always, for every AI interaction — no exceptions.

**Trade-offs:** Adds one network hop. Worth it: keys are safe, usage can be rate-limited per user, provider can be switched without client update.

**Example:**
```typescript
// Backend: src/services/aiRouter.ts
type Provider = 'openrouter' | 'gemini' | 'openai'

export async function callAI(
  provider: Provider,
  model: string,
  messages: ChatMessage[],
  stream: boolean = false
) {
  switch (provider) {
    case 'openrouter':
      return callOpenRouter(model, messages, stream)
    case 'gemini':
      return callGemini(model, messages, stream)
    case 'openai':
      return callOpenAI(model, messages, stream)
  }
}

// All keys pulled from process.env — never from the request
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!
const GEMINI_KEY = process.env.GOOGLE_API_KEY!
const OPENAI_KEY = process.env.OPENAI_API_KEY!
```

---

### Pattern 2: Batch AI Calls, Not Real-Time

**What:** Program generation and meal suggestions are **batch calls** — the user taps "Generate Program", waits 5–15 seconds, gets the result. They are NOT streamed character-by-character in the final v1.

**When to use:** Any AI call where the output is a structured JSON object (a program, a meal plan). Stream only for conversational or adaptive session responses where partial text is readable.

**Trade-offs:** Streaming is more complex to implement (SSE on backend, chunked parsing on client). Batch is simpler for structured JSON. Acceptable UX with a clear loading state.

**Example (batch — program generation):**
```typescript
// Client: src/api/ai.ts
export async function generateProgram(userProfile: UserProfile) {
  const res = await apiClient.post('/ai/generate-program', { userProfile })
  return res.data as TrainingProgram
}

// Client: src/hooks/useGenerateProgram.ts
export function useGenerateProgram() {
  return useMutation({
    mutationFn: generateProgram,
    onSuccess: (program) => {
      queryClient.setQueryData(['program', 'active'], program)
    },
  })
}
```

**Example (streaming — session adaptation, optional v1.1):**
```typescript
// Backend: POST /ai/adapt-session — uses Server-Sent Events
res.setHeader('Content-Type', 'text/event-stream')
const stream = await callAI(provider, model, messages, true)
for await (const chunk of stream) {
  res.write(`data: ${chunk}\n\n`)
}
res.end()
```

---

### Pattern 3: Exercise Library as Seeded Static Data

**What:** The exercise library (~200–500 exercises) is seeded into the database at deployment and treated as read-only reference data. The client fetches it once, caches it in MMKV, and uses it indefinitely offline.

**When to use:** Any reference dataset that doesn't change per-user and changes infrequently.

**Trade-offs:** Slightly larger initial load. But enables offline use, fast lookups, and no per-request DB cost.

**Example:**
```typescript
// Client: src/hooks/useExercises.ts
export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 1 week — library rarely changes
    gcTime: Infinity,                     // Keep in cache forever
  })
}

// On first load, also persist to MMKV for offline:
// src/lib/exerciseCache.ts
export function seedOfflineLibrary(exercises: Exercise[]) {
  storage.set('exercises', JSON.stringify(exercises))
}
export function getOfflineLibrary(): Exercise[] | null {
  const raw = storage.getString('exercises')
  return raw ? JSON.parse(raw) : null
}
```

---

### Pattern 4: Zustand + TanStack Query — Two-Layer State

**What:** Maintain a strict boundary: **Zustand** owns *ephemeral UI state* (active workout timer, onboarding form values, which AI model is selected). **TanStack Query** owns *server-mirrored state* (programs, workouts, exercises from the API).

**When to use:** Always. Mixing these two leads to stale data bugs and over-complex reducers.

**Trade-offs:** Two libraries to learn. But each solves a distinct problem; the combination is clean and well-established in the React Native community.

**Example:**
```typescript
// Zustand: ephemeral UI state
export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSessionId: null,
  completedExercises: [],
  startSession: (id) => set({ activeSessionId: id }),
  markExerciseDone: (exerciseId) =>
    set((s) => ({ completedExercises: [...s.completedExercises, exerciseId] })),
}))

// TanStack Query: server state
export function useActiveProgram() {
  return useQuery({
    queryKey: ['program', 'active'],
    queryFn: () => api.get('/programs/active'),
  })
}
```

---

## Data Flow

### Primary Flow: Program Generation

```
User completes onboarding
    ↓
[Onboarding screens] → POST profile to /users (Supabase DB via backend)
    ↓
User taps "Generate My Program"
    ↓
[Client] → POST /ai/generate-program { userId }
    ↓
[Backend] → validates JWT → fetches user profile from DB
    ↓
[Backend] → promptBuilder.buildProgramPrompt(profile)
    ↓
[Backend] → aiRouter.callAI(provider, model, prompt)
    ↓
[AI Provider] → returns structured JSON TrainingProgram
    ↓
[Backend] → parses + validates JSON → saves program to DB
    ↓
[Backend] → returns saved program to client
    ↓
[Client] → TanStack Query cache updated → screen renders program
```

### Secondary Flow: Daily Session (Offline-capable)

```
User opens Today screen
    ↓
[Client] → useQuery(['workouts', 'today']) → served from TanStack Query cache
    ↓ (if cache miss or stale)
[Client] → GET /workouts?date=today → fetches from backend
    ↓
User taps "Mark Done"
    ↓
[Client] → Zustand marks exercise complete locally (immediate UI feedback)
    ↓
[Client] → useMutation → POST /completions { workoutId, status: 'done' }
    ↓ (if offline)
[Client] → queues to MMKV offline queue → retries when online
    ↓
[Backend] → updates DB → returns updated workout
    ↓
[Client] → TanStack Query invalidates ['workouts', 'today']
```

### Auth Flow

```
User logs in
    ↓
[Client] → Supabase Auth SDK (email/password or OAuth)
    ↓
Supabase issues JWT → stored in Zustand authStore + MMKV (persisted)
    ↓
Every API call → Authorization: Bearer <jwt> header injected by api.ts
    ↓
[Backend] → validates JWT against Supabase public key
    ↓ (if invalid)
[Backend] → 401 → client redirects to login
```

### State Management

```
MMKV (disk)
    ↓ (hydrate on startup)
Zustand stores (auth, settings, offline queue)
    ↓ (subscribe)
React components ←→ TanStack Query cache (server state)
    ↓ (mutations)
Backend API → Supabase DB
```

---

## Database Schema

### Core Tables (Supabase Postgres)

```sql
-- Users (extends Supabase auth.users)
users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  goal        TEXT,               -- 'muscle_gain' | 'weight_loss' | 'endurance' | 'maintenance'
  fitness_level TEXT,             -- 'beginner' | 'intermediate' | 'advanced'
  injury_notes TEXT,
  available_days INT[],           -- [1,3,5] = Mon, Wed, Fri
  equipment   TEXT[],             -- ['barbell', 'dumbbells', 'bodyweight']
  body_weight FLOAT,
  body_height FLOAT,
  ai_provider TEXT,               -- preferred: 'openrouter' | 'gemini' | 'openai'
  ai_model    TEXT,               -- e.g., 'openai/gpt-4o', 'google/gemini-2.0-flash'
  created_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Training Programs (AI-generated, one active per user)
programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT,               -- 'Push/Pull/Legs 12-Week Program'
  weeks       INT,
  status      TEXT,               -- 'active' | 'archived' | 'draft'
  raw_ai_json JSONB,              -- Full AI response, for debugging/regeneration
  created_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Workout Sessions (one per training day in the program)
workout_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID REFERENCES programs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id),
  week_number INT,
  day_number  INT,
  scheduled_date DATE,
  title       TEXT,               -- 'Day 1 — Upper Body Push'
  exercises   JSONB,              -- [{ exercise_id, sets, reps, rest_seconds, notes }]
  status      TEXT,               -- 'pending' | 'done' | 'skipped' | 'adapted'
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
)

-- Exercise Library (seeded, read-only reference data)
exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE,        -- 'barbell-bench-press'
  name        TEXT,               -- 'Barbell Bench Press'
  muscle_groups TEXT[],           -- ['chest', 'triceps', 'anterior-deltoid']
  equipment   TEXT[],             -- ['barbell', 'bench']
  instructions TEXT[],            -- Step-by-step cues
  difficulty  TEXT,               -- 'beginner' | 'intermediate' | 'advanced'
  image_url   TEXT,
  video_url   TEXT
)

-- Meal Suggestions (AI-generated, lightweight)
meal_suggestions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  workout_session_id UUID REFERENCES workout_sessions(id),
  content     JSONB,              -- { breakfast, lunch, dinner, snacks, macros }
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
```

**Row Level Security:** All tables except `exercises` enforce `user_id = auth.uid()` via RLS policies. `exercises` is public read-only.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | Client SDK for login/register; backend validates JWT via public key | Client never calls DB directly — all goes through backend API |
| OpenRouter | Backend HTTP POST to `https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer` | OpenAI-compatible API; supports all major models via one endpoint |
| Google Gemini API | Backend HTTP POST to Google AI Studio endpoint | Use `@google/generative-ai` Node SDK |
| OpenAI API | Backend HTTP POST to `https://api.openai.com/v1/chat/completions` | Use `openai` Node SDK |
| Supabase DB | Backend only, via `@supabase/supabase-js` with service role key | Client NEVER has service role key |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Mobile Client ↔ Backend API | HTTPS REST + JWT | All API calls include `Authorization: Bearer <supabase_jwt>` |
| Backend ↔ Supabase Auth | JWT validation (JWKS) | Backend fetches Supabase public key once, caches it |
| Backend ↔ Supabase DB | Service role client (bypasses RLS) | Backend enforces its own authorization before writing |
| Backend ↔ AI Providers | HTTPS REST (OpenAI-compatible for all three) | OpenRouter and OpenAI use identical API shape; Gemini uses Google SDK |
| TanStack Query ↔ Zustand | React context / explicit calls | Query mutations can call Zustand actions on success (e.g., clear active session) |
| MMKV ↔ Zustand | Persist middleware | Zustand auth/settings stores use MMKV as persistence layer |

---

## Build Order (Phase Dependencies)

The following dependency graph determines the order phases must be built:

```
1. Backend Foundation
   ├── Express app scaffolding
   ├── Supabase project (Auth + DB)
   └── JWT middleware

       ↓ (required by everything)

2. Auth Flow (Mobile)
   ├── Login / Register screens
   ├── Supabase Auth SDK integration
   └── authStore (Zustand + MMKV persist)

       ↓ (gated: must be logged in to see anything)

3. Onboarding + User Profile
   ├── Multi-step onboarding screens
   ├── POST /users endpoint (backend)
   └── User profile schema (DB)

       ↓ (profile needed for AI context)

4. Exercise Library
   ├── exercises table seeded
   ├── GET /exercises endpoint
   ├── Library screens (list + detail)
   └── MMKV offline cache

       ↓ (AI references exercise slugs)

5. AI: Program Generation
   ├── POST /ai/generate-program (backend)
   ├── promptBuilder (uses profile + exercise library)
   ├── aiRouter (OpenRouter / Gemini / OpenAI)
   ├── programs + workout_sessions tables
   └── Program screen + Today screen (mobile)

       ↓ (sessions must exist before completion tracking)

6. Workout Completion Tracking
   ├── POST /completions endpoint
   ├── Optimistic UI (Zustand)
   └── Offline queue (MMKV)

       ↓ (optional enrichment after core loop works)

7. AI: Session Adaptation + Meal Suggestions
   ├── POST /ai/adapt-session
   ├── POST /ai/meal-suggestion
   └── Meals screen (mobile)

8. Settings: AI Model Picker
   ├── GET /models (list available)
   ├── PATCH /users/ai-preference
   └── Settings screen (mobile)
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 users | Monorepo: single Express app + Supabase free tier is sufficient. No caching needed. |
| 500–10K users | Add Redis for AI response caching (same prompt → same cached response for 24h). Rate limit AI endpoints per user. Consider Supabase Pro tier for connection pooling. |
| 10K+ users | Separate AI proxy into its own service. Add a queue (BullMQ) for program generation (async job instead of blocking HTTP). CDN for exercise images. |

### Scaling Priorities

1. **First bottleneck:** AI API cost and latency — add prompt caching via Redis keyed on `hash(userId + profileHash)`; same user profile should reuse the same program skeleton
2. **Second bottleneck:** Supabase connection pool — move to Supabase Pro with PgBouncer or use a dedicated Postgres with `pg` connection pooling at the backend level

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side AI Keys

**What people do:** Put the OpenRouter/Gemini/OpenAI key directly in the React Native bundle (via `.env` file read by Metro).
**Why it's wrong:** React Native bundles are trivially extractable. The key will be scraped within days of shipping, leading to unexpected costs and API key bans.
**Do this instead:** All AI calls go through your backend. The backend holds the keys in environment variables. The client only sends a JWT and the model/prompt — never touches an AI provider directly.

---

### Anti-Pattern 2: Supabase Client Directly in the App

**What people do:** Use the Supabase client SDK in the mobile app with the service role key to write directly to the database.
**Why it's wrong:** The service role key bypasses Row Level Security entirely. It must never be in client code. The anon key is acceptable for Supabase Auth, but all data mutations should go through your Express backend for business logic enforcement.
**Do this instead:** Use Supabase Auth SDK on the client (anon key is fine here — it's public). All database reads/writes go through your Express API with JWT validation. Express uses the service role key server-side.

---

### Anti-Pattern 3: Storing Server State in Zustand

**What people do:** Fetch programs/workouts in a Zustand action and store them in a Zustand slice. Re-fetch manually by calling store actions.
**Why it's wrong:** You end up re-implementing stale detection, background refresh, error states, loading states, and cache invalidation that TanStack Query does automatically and correctly.
**Do this instead:** Zustand is for *UI state* (what tab is active, onboarding step, active session timer). TanStack Query is for *server state* (any data that lives in the database). The boundary is: if it came from an HTTP call, it belongs in TanStack Query.

---

### Anti-Pattern 4: Generating Workouts as Ad-Hoc Strings

**What people do:** Ask the AI to return a workout as free-form markdown text, then try to parse it in the client.
**Why it's wrong:** AI output format is non-deterministic. Parsing free-form text is fragile and breaks on model updates. The result can't be stored structurally in the database.
**Do this instead:** Use structured output / JSON mode. Pass a JSON schema in the system prompt. Validate the AI response against the schema server-side (using Zod) before saving to DB. Fail gracefully and retry if validation fails.

**Example:**
```typescript
// Backend: src/services/promptBuilder.ts
const PROGRAM_SCHEMA = `
Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "weeks": number,
  "sessions": [{
    "week": number,
    "day": number,
    "title": "string",
    "exercises": [{
      "exercise_slug": "string",
      "sets": number,
      "reps": "string",
      "rest_seconds": number,
      "notes": "string"
    }]
  }]
}
`
```

---

## Sources

- **Expo Router (file-based routing):** https://docs.expo.dev/router/introduction/ — version SDK 55, updated Feb 26, 2026 — HIGH confidence
- **react-native-mmkv (v4, Nitro Modules):** https://github.com/mrousavy/react-native-mmkv — v4.1.2, released Jan 28, 2026 — HIGH confidence (8.2k stars, official repo)
- **TanStack Query (server state):** https://tanstack.com/query/latest — HIGH confidence (official docs)
- **Supabase Auth:** https://supabase.com/docs/guides/auth — HIGH confidence (official docs)
- **OpenRouter API:** https://openrouter.ai/docs — HIGH confidence (official docs, OpenAI-compatible shape confirmed)
- **React Native architecture patterns (Zustand + TanStack Query split):** MEDIUM confidence — well-established community pattern but no single canonical source; verified against multiple open-source RN app structures

---

*Architecture research for: React Native AI fitness coaching app (GymCoach AI)*
*Researched: 2026-03-01*
