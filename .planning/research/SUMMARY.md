# Research Summary: GymCoach AI

**Domain:** React Native AI fitness / gym coaching mobile app
**Researched:** 2026-03-01
**Overall confidence:** HIGH (stack + architecture verified via official docs / recent releases) / MEDIUM (feature landscape based on App Store data + competitor analysis) / MEDIUM-HIGH (pitfalls based on RN official docs + OpenAI production guides)

---

## Executive Summary

GymCoach AI is a React Native app that generates and adapts AI-powered training programs. The domain is well-established (Fitbod, Hevy, Freeletics are mature competitors), which means the table-stakes feature set is clear and non-negotiable. The core differentiator is the combination of multi-provider LLM switching (no competitor offers this), AI-adapted sessions (Freeletics does this, others don't), and lightweight integrated nutrition — all within a single app with an account-required model for monetization.

The technology stack is stable and well-researched. Expo SDK 55 with New Architecture is the correct starting point in March 2026 — MMKV v4 and FlashList v2 both require New Architecture for their performance guarantees, and starting on the old architecture would require a migration before benefiting from these libraries. The backend is intentionally simple: Node/Express on Railway + Supabase for Auth and DB. The AI proxy layer is the most critical backend component — it guards API keys, enforces per-user quotas, and normalizes the three provider response shapes.

The critical architectural insight from research is the **two-layer state separation**: Zustand for ephemeral UI state, TanStack Query for server state. Mixing these is the most common React Native architectural mistake and causes stale data bugs that are expensive to fix retroactively. The research also surfaces a non-obvious constraint: the exercise library must be built and seeded before the AI program generation feature can work correctly — the AI must be grounded in the app's actual exercise inventory or it will hallucinate exercise names that don't exist in the app.

The highest-risk pitfall in this domain is the combination of AI cost blowout and API key exposure. Both must be addressed in the very first backend phase — before any AI feature is user-accessible. A user who extracts an API key from a React Native bundle can cause unlimited cost in hours. A power user hitting an uncapped AI endpoint can run up a meaningful bill before anyone notices.

---

## Key Findings

**Stack:** Expo SDK 55 / RN 0.83 + Zustand + TanStack Query + MMKV v4 + FlashList v2 (mobile) / Express 5 + Supabase Auth + Postgres (backend) / OpenRouter + Gemini + OpenAI behind a proxy.

**Architecture:** Two-repo structure (mobile client + backend API), two-layer state (Zustand for UI, TanStack Query for server), AI proxy as mandatory first backend component, exercise library as static seeded reference data with offline MMKV cache.

**Critical pitfall:** API keys must NEVER be in the React Native bundle — and per-user AI quotas must be enforced from Day 1, not added later. These two constraints together define the entire backend architecture.

---

## Implications for Roadmap

Based on research, the recommended phase structure:

### 1. Backend Foundation + AI Proxy
**Rationale:** The backend proxy is the prerequisite for all AI features and all security. It must exist before any user can interact with the app beyond login. This phase also creates the auth middleware that every other backend route depends on.
- Addresses: API key security (PITFALLS #3), per-user quota enforcement (PITFALLS #2), JWT validation for all subsequent backend routes
- Requires: Express app, Supabase project setup, JWT middleware, per-user quota tracking table, provider abstraction layer (`aiRouter.ts`)
- Avoids: Shipping any AI feature before the proxy exists (critical security requirement)
- **Deeper research likely needed:** Streaming vs. batch AI responses — decide the pattern here. SSE streaming is more complex but gives better UX for long generation; batch is simpler and sufficient for v1.

### 2. Auth Flow (Mobile)
**Rationale:** All app content is behind auth (no anonymous mode per PROJECT.md). Auth must be fully functional before building any screen that shows user-specific data.
- Addresses: PKCE flow requirement (PITFALLS integration gotchas), expo-secure-store for token storage (PITFALLS #security), account-required constraint (PROJECT.md)
- Requires: Supabase Auth SDK integration, login/register screens, authStore (Zustand + MMKV persist), JWT header injection in API client
- Avoids: Building screens before the auth guard is in place (leads to having to retrofit auth protection everywhere)
- **Standard patterns — phase research unlikely needed.**

### 3. Onboarding + User Profile
**Rationale:** The AI generates programs from the user profile. Without a profile, AI features are impossible. This phase defines the data model that all subsequent AI features consume.
- Addresses: Onboarding drop-off risk (PITFALLS #5) — minimal required fields only (goal, fitness level, days, equipment); body metrics optional
- Requires: Multi-step onboarding screens (≤4 required), POST /users endpoint, user profile DB schema
- Avoids: Over-collecting during onboarding (more than 4 required steps before first generated program causes abandonment)
- **Standard patterns — phase research unlikely needed.**

### 4. Exercise Library
**Rationale:** The exercise library must exist and be seeded before AI program generation — the AI is grounded to the library's exercise slugs to prevent hallucination (PITFALLS #7). Building the library first also enables offline caching setup.
- Addresses: AI hallucination of exercise names (PITFALLS #7), exercise library performance (PITFALLS #4 — FlashList from day one)
- Requires: Exercise seed data (200–500 exercises with metadata), GET /exercises endpoint, library screens (list + detail with search), MMKV offline cache
- Avoids: Building the AI program feature before the exercise inventory is grounded
- **Deeper research likely needed:** Exercise data source — where does the seed data come from? (ExerciseDB API, Wger project, manual curation, purchased dataset). This is the content acquisition question the roadmap can't answer yet.

### 5. AI: Program Generation
**Rationale:** This is the core product. It can only be built after the proxy exists (Phase 1), the user profile is available (Phase 3), and the exercise library is seeded (Phase 4).
- Addresses: Injury-aware program generation (PITFALLS #1 — CONSTRAINTS block in system prompt), hallucinated exercises (PITFALLS #7 — exercise list in prompt + backend validation), structured output (ARCHITECTURE anti-pattern #4)
- Requires: POST /ai/generate-program endpoint, promptBuilder, programs + workout_sessions tables, Program screen, Today screen
- Avoids: Free-form AI text output (must use structured JSON); generating programs without grounding to exercise library
- **Deeper research likely needed:** Structured output format per provider — OpenAI `strict: true`, Gemini `response_schema`, OpenRouter passthrough. Each provider has different schema enforcement capabilities.

### 6. Workout Completion Tracking
**Rationale:** Sessions must exist before they can be tracked. Completion tracking closes the core loop: generate → do → mark done → repeat.
- Addresses: Sync conflict risk (PITFALLS #6 — event log or timestamp-based model), offline completion (ARCHITECTURE secondary flow)
- Requires: POST /completions endpoint, optimistic UI (Zustand), MMKV offline queue, progress visibility (history + streak)
- Avoids: Mutable `is_done` boolean without timestamp (makes sync conflict resolution impossible)
- **Standard patterns — phase research unlikely needed.**

### 7. AI: Session Adaptation + Meal Suggestions
**Rationale:** These are enhancements on top of the base program. Session adaptation requires programs to exist; meal suggestions require a completed workout context for relevance.
- Addresses: On-demand session constraint input (FEATURES table stakes), AI meal suggestions (FEATURES differentiators)
- Requires: POST /ai/adapt-session, POST /ai/meal-suggestion, Meals screen, constraint input UI
- Avoids: Sending full program context for adaptation (PITFALLS performance — send only current week)
- **Deeper research likely needed:** Constraint-driven session adaptation prompt design — this is the hardest prompt engineering challenge in the app.

### 8. Settings: AI Model Picker
**Rationale:** This is a core differentiator but not a dependency for the core loop. Build last so the model preference flows through an already-working AI pipeline.
- Addresses: Multi-provider switching (PROJECT.md core requirement, FEATURES differentiator)
- Requires: PATCH /users/ai-preference endpoint, Settings screen with model picker, provider abstraction tested across all three providers
- Avoids: Building model switching before the AI pipeline works end-to-end
- **Standard patterns — phase research unlikely needed.**

---

**Phase ordering rationale:**
- Phases 1–2 are infrastructure (proxy + auth) — nothing else can be built without them
- Phase 3 (onboarding) is blocked on auth; Phase 4 (library) is blocked on the backend existing
- Phase 5 (AI program) is blocked on all of 1–4: needs proxy (keys), auth (user identity), profile (AI context), and library (exercise grounding)
- Phase 6 (tracking) is blocked on Phase 5 (sessions must exist)
- Phases 7–8 are enhancements that require the full core loop from 1–6

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from official docs and GitHub releases as of 2026-03-01 |
| Architecture | HIGH (client) / MEDIUM (backend shape) | Expo Router, Zustand + TanStack Query, MMKV patterns are well-established in RN community; multi-provider AI proxy design is sound but not a published canonical pattern |
| Features | MEDIUM-HIGH | Based on App Store listings (Fitbod, Hevy, Freeletics) and direct review analysis; some claims from Tom's Guide are MEDIUM confidence |
| Pitfalls | HIGH (RN + security) / MEDIUM (AI fitness-specific) | RN performance, security, and Supabase auth pitfalls come from official docs with explicit warnings; AI prompt design pitfalls are based on OpenAI production guides and domain reasoning |

---

## Gaps to Address

- **Exercise content source:** The exercise library needs 200–500 seeded exercises with names, muscle groups, equipment, instructions, and image URLs. Research did not identify the best source (ExerciseDB API, Wger, commercial dataset, manual curation). Phase 4 will need dedicated research here.

- **AI prompt design for fitness:** The specific prompt templates — how to structure injury constraints, how to send the exercise list, how to enforce progressive overload in the schema — are not documented in official sources. Phase 5 will need prompt engineering research and iteration.

- **GDPR / health data compliance:** Injury history and body metrics may be classified as health data under GDPR (EU) and CCPA (California). The research did not determine whether this project's data handling requires explicit health data consent flows, data processing agreements, or special retention policies. This should be addressed before any real user data is collected.

- **App Store review for AI health advice:** Apple may require disclaimers for apps that provide exercise or nutrition recommendations. The research did not confirm the current review policy for AI coaching apps. This is worth verifying before submitting to the App Store.

- **Prompt caching strategy:** OpenAI, Anthropic, and Google all offer prompt caching for repeated content (e.g., the same exercise library list sent on every request). The cost savings could be significant. Phase-specific research in Phase 5 should evaluate this.

- **Monetization implementation:** The project spec says "users pay for AI access" but doesn't specify the payment mechanism (in-app subscription, one-time purchase, credit-based). The tech stack for payment (RevenueCat for IAP? Stripe for web billing?) is not yet decided and will need research before Phase 1 or 2.

---

## Sources

All individual source URLs and confidence levels are documented in the relevant research files:
- STACK.md — technology sources
- FEATURES.md — competitor analysis sources
- ARCHITECTURE.md — pattern and library sources
- PITFALLS.md — official docs and production best practices sources

---

*Research summary for: React Native AI fitness coaching app (GymCoach AI)*
*Researched: 2026-03-01*
