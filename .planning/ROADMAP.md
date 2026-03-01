# Roadmap: GymCoach AI

## Overview

GymCoach AI ships in 9 phases, ordered by a strict dependency chain: the backend proxy and infrastructure must exist before any AI feature, auth must exist before any user-specific screen, the exercise library must be seeded before the AI can generate programs grounded in real exercises, and the core coaching loop (generate → do → mark done) must complete before enhancements like session adaptation, nutrition, and model switching are layered on top. The result is a sequence where every phase delivers a coherent, verifiable capability — not a horizontal layer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Foundation + AI Proxy** - Express backend, Supabase project, AI proxy layer, per-user quota enforcement
- [ ] **Phase 2: Authentication (Mobile Client)** - Login, register, OAuth, persistent session, password reset
- [ ] **Phase 3: Onboarding + User Profile** - Multi-step onboarding, profile data model, profile storage in cloud
- [ ] **Phase 4: Exercise Library** - Seeded exercise database, library screens, search/filter, offline cache
- [ ] **Phase 5: AI Program Generation** - AI-generated multi-week programs, program screen, adjustment prompts
- [ ] **Phase 6: Workout Completion Tracking** - Mark workouts done/skipped, history view, cloud sync
- [ ] **Phase 7: On-Demand Session Adaptation** - Constraint-driven session generation adapted to current conditions
- [ ] **Phase 8: Nutrition AI** - Macro targets, meal suggestions, profile-reactive nutrition guidance
- [ ] **Phase 9: AI Model Settings** - Provider picker, model picker, default model, usage indicator

## Phase Details

### Phase 1: Backend Foundation + AI Proxy
**Goal**: A secure, deployed backend exists that proxies all AI requests through server-side API keys and enforces per-user quotas — so no user can ever access AI directly or cost-blow without limit
**Depends on**: Nothing (first phase)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04
**Success Criteria** (what must be TRUE):
  1. An AI request sent from a mobile client reaches the backend proxy and returns a valid response — the client bundle contains zero API keys
  2. A user exceeding their per-request quota receives a clear error from the backend without triggering an upstream AI call
  3. User profile data (created in a later phase) can be written to and read from Supabase PostgreSQL without data loss
  4. Exercise library data can be seeded server-side and served via a GET /exercises endpoint with client-side MMKV caching for offline use
  5. The backend is deployed (Railway or equivalent) and reachable from a physical device on mobile data
**Plans**: 4 plans

Plans:
- [x] 01-01: Express app scaffolding, Railway deployment, environment config
- [x] 01-02: Supabase project setup — Auth schema, user profiles table, quota tracking table
- [x] 01-03: AI proxy layer — provider abstraction, JWT middleware, per-user quota enforcement
- [x] 01-04: Exercise library seed endpoint + MMKV offline cache integration

### Phase 2: Authentication (Mobile Client)
**Goal**: Users can create accounts, log in, stay logged in across sessions, and recover access — all required before any user-specific screen can be built
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can create a new account with email and password and land on the app's first screen
  2. User can log in with email and password and be recognized as the same user on a different device
  3. User closes and reopens the app and remains logged in (session persists across restarts)
  4. User taps "Forgot password" and receives an email link that resets their password
  5. User can sign in with their Google or Apple account via OAuth and land on the app's first screen
**Plans**: 4 plans

Plans:
- [ ] 02-01: Supabase Auth SDK integration, authStore (Zustand + MMKV persist), JWT header injection in API client
- [ ] 02-02: Login + Register screens with validation, error handling
- [ ] 02-03: OAuth flow (Google + Apple) via expo-auth-session + PKCE
- [ ] 02-04: Password reset screen, auth guard (redirect unauthenticated users)

### Phase 3: Onboarding + User Profile
**Goal**: A new user completes structured onboarding in ≤4 required steps and their profile is stored in the cloud — making AI program generation possible
**Depends on**: Phase 2
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06
**Success Criteria** (what must be TRUE):
  1. A new user reaches the first program generation trigger in 4 required steps or fewer (goal → fitness info → schedule/equipment → generate)
  2. User's goal, fitness level, injury history, preferred exercises, body metrics, and available days/equipment are all saved to their cloud profile
  3. A returning user on a new device sees their profile pre-populated from the cloud (no re-onboarding required)
  4. User receives basic AI-generated nutritional guidance text at the end of onboarding based on their goal and profile
**Plans**: 4 plans

Plans:
- [ ] 03-01: User profile DB schema (Supabase) + POST /users/profile endpoint
- [ ] 03-02: Onboarding step 1 — goal selection screen
- [ ] 03-03: Onboarding step 2 — fitness level, injury history, preferred exercises
- [ ] 03-04: Onboarding step 3 — body metrics (height, weight, age)
- [ ] 03-05: Onboarding step 4 — available days and equipment
- [ ] 03-06: Onboarding completion — initial AI nutrition guidance text + transition to program generation

### Phase 4: Exercise Library
**Goal**: 200–500 exercises are seeded, searchable, and browsable with visual instructions and muscle diagrams — and the AI is grounded to this inventory so it cannot hallucinate exercise names
**Depends on**: Phase 1
**Requirements**: EXER-01, EXER-02, EXER-03, EXER-04, EXER-05
**Success Criteria** (what must be TRUE):
  1. The app contains 200–500 exercises with name, target muscles, step-by-step instructions, images/GIFs, and muscle diagram SVGs
  2. User can browse the full exercise list with smooth scrolling (FlashList) even on a low-end device
  3. User can search exercises by name and get results in under 500ms
  4. User can filter exercises by muscle group, equipment required, and difficulty level — filters combine correctly
  5. User can view any exercise offline (instructions, images, muscle diagram) after the library has been cached once
**Plans**: 4 plans

Plans:
- [ ] 04-01: Exercise data source decision + seed script (200–500 exercises with full metadata)
- [ ] 04-02: GET /exercises endpoint + client-side MMKV cache layer
- [ ] 04-03: Exercise list screen with FlashList, search, and filter UI
- [ ] 04-04: Exercise detail screen — instructions, images/GIFs, SVG muscle diagram
- [ ] 04-05: Offline cache validation — confirm library works with no network after first load

### Phase 5: AI Program Generation
**Goal**: The AI generates a real multi-week training program from the user's profile, the program is visible and navigable, and the user can request adjustments — all grounded to the exercise library
**Depends on**: Phase 3 (profile data), Phase 4 (exercise inventory)
**Requirements**: PROG-01, PROG-03, PROG-04, PROG-05
**Success Criteria** (what must be TRUE):
  1. After completing onboarding, user receives a multi-week training program tailored to their goal, fitness level, injuries, preferred exercises, available days, and equipment
  2. Every exercise in the generated program exists in the app's exercise library — no hallucinated names (backend validates all slugs post-generation)
  3. User can browse their program organized by week and day, and tap any exercise to see its library detail
  4. User can send a text prompt to adjust or regenerate their program and receive an updated program that respects their original profile constraints
**Plans**: 4 plans

Plans:
- [ ] 05-01: Program + workout_sessions DB schema, POST /ai/generate-program endpoint, promptBuilder with injury constraints + exercise slug grounding
- [ ] 05-02: Structured output validation — enforce exercise slug integrity, backend rejection of hallucinated names
- [ ] 05-03: Program screen (week/day navigator, session list, exercise cards linking to library)
- [ ] 05-04: Today screen — current session view with exercises for today
- [ ] 05-05: Program adjustment UI — chat-style prompt input, PATCH /ai/adjust-program endpoint

### Phase 6: Workout Completion Tracking
**Goal**: Users can mark workouts done or skipped, see their history, and have all completion data synced to the cloud — closing the core coaching loop
**Depends on**: Phase 5
**Requirements**: TRKR-01, TRKR-02, TRKR-03
**Success Criteria** (what must be TRUE):
  1. User can mark any scheduled workout as completed or skipped directly from the Today screen or Program screen
  2. User can view a history screen showing completed and skipped workouts by day, with streak or summary metrics
  3. Completion data synced across devices — marking a workout done on one device reflects immediately on another device for the same user
  4. Workout completion recorded while offline is queued and synced automatically when connectivity returns
**Plans**: 4 plans

Plans:
- [ ] 06-01: Completions DB schema (event-log model with timestamp, not mutable boolean), POST /completions endpoint
- [ ] 06-02: Optimistic UI for mark-done/skip (Zustand), MMKV offline queue for completions
- [ ] 06-03: History screen — completed / skipped per day, streak counter

### Phase 7: On-Demand Session Adaptation
**Goal**: User can request a session adapted to their current constraints (time available, equipment at hand) and receive a modified version of their scheduled session grounded in the exercise library
**Depends on**: Phase 5 (programs must exist), Phase 6 (tracking context)
**Requirements**: PROG-02
**Success Criteria** (what must be TRUE):
  1. User can tap "Adapt today's session" and enter current constraints (available time in minutes, equipment available)
  2. User receives an adapted version of their scheduled session that respects their time and equipment constraints
  3. Every exercise in the adapted session exists in the exercise library (no hallucinated names)
  4. The adapted session can be marked as completed or skipped the same as a regular scheduled session
**Plans**: 4 plans

Plans:
- [ ] 07-01: POST /ai/adapt-session endpoint, constraint-driven prompt design
- [ ] 07-02: Constraint input UI (time picker, equipment multi-select), adapted session display screen

### Phase 8: Nutrition AI
**Goal**: Users receive personalized macro targets and AI meal suggestions that update when their goal or profile changes — without any food logging required
**Depends on**: Phase 3 (profile), Phase 5 (workout context)
**Requirements**: NUTR-01, NUTR-02, NUTR-03
**Success Criteria** (what must be TRUE):
  1. User sees personalized macro targets (protein, carbs, fat in grams) derived from their goal and body metrics
  2. User sees AI-generated meal suggestions aligned with their training goal — no food logging required to receive them
  3. When user updates their goal or body metrics in their profile, macro targets and meal suggestions update to reflect the new profile
**Plans**: 4 plans

Plans:
- [ ] 08-01: POST /ai/meal-suggestion + POST /ai/macro-targets endpoints, nutrition prompt design
- [ ] 08-02: Nutrition screen — macro targets display, meal suggestion cards
- [ ] 08-03: Profile-change hook — trigger nutrition refresh when goal or body metrics change

### Phase 9: AI Model Settings
**Goal**: Users can choose their AI provider and model from settings, and the chosen preference routes all subsequent AI requests — validating the multi-provider architecture end-to-end
**Depends on**: Phase 5 (AI pipeline must be working end-to-end before switching providers)
**Requirements**: AIMD-01, AIMD-02, AIMD-03, AIMD-04
**Success Criteria** (what must be TRUE):
  1. User can open Settings and see a picker with three providers: OpenRouter, Google Gemini, OpenAI — switching provider updates all subsequent AI requests
  2. User can select a specific model within their chosen provider (e.g., GPT-4o, Gemini Flash, Claude 3.5 Sonnet)
  3. App works out-of-the-box with a sensible default model (e.g., Gemini Flash) without requiring any configuration
  4. User sees an estimated token cost or usage indicator after each AI request (program generation, session adaptation, meal suggestion)
**Plans**: 4 plans

Plans:
- [ ] 09-01: PATCH /users/ai-preference endpoint, aiPreference in user profile schema
- [ ] 09-02: Settings screen — provider picker + model list per provider
- [ ] 09-03: Usage indicator — token cost estimation per AI call, displayed post-request

## Progress

**Execution Order:**
Phases execute in numeric order. Phase 4 (Exercise Library) can run in parallel with Phases 2–3 as it only depends on Phase 1.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation + AI Proxy | 4/4 | Complete | 2026-03-01 |
| 2. Authentication (Mobile Client) | 0/4 | Not started | - |
| 3. Onboarding + User Profile | 0/6 | Not started | - |
| 4. Exercise Library | 0/5 | Not started | - |
| 5. AI Program Generation | 0/5 | Not started | - |
| 6. Workout Completion Tracking | 0/3 | Not started | - |
| 7. On-Demand Session Adaptation | 0/2 | Not started | - |
| 8. Nutrition AI | 0/3 | Not started | - |
| 9. AI Model Settings | 0/3 | Not started | - |

**Total plans:** 35 across 9 phases
