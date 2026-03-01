# Requirements: GymCoach AI

**Defined:** 2026-03-01
**Core Value:** The AI generates a real training program tailored to the user's profile and adapts it session by session — so every workout feels coached, not generic.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User session persists across app restarts
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: User can sign in with Google or Apple (OAuth)

### Onboarding

- [ ] **ONBD-01**: New user completes a goal selection step (muscle gain, fat loss, endurance, general fitness)
- [ ] **ONBD-02**: New user enters fitness level, injury history, and preferred exercises
- [ ] **ONBD-03**: New user enters body metrics (height, weight, age)
- [ ] **ONBD-04**: New user specifies available days per week and equipment access
- [ ] **ONBD-05**: New user receives basic AI-generated nutritional guidance (textual — no calorie logging) based on goal and profile
- [ ] **ONBD-06**: Onboarding requires no more than 4 steps before generating the first program (to prevent drop-off)

### AI Program Generation

- [ ] **PROG-01**: AI generates a multi-week training program based on user profile (goal, level, injuries, preferred exercises, available days, equipment)
- [ ] **PROG-02**: User can request an on-demand session adapted to current constraints (available time, current equipment)
- [ ] **PROG-03**: User can view their current program organized by week and day
- [ ] **PROG-04**: AI references only exercises from the app's exercise library (no hallucinated exercise names)
- [ ] **PROG-05**: User can regenerate or request adjustments to their program via a chat-style prompt

### Exercise Library

- [ ] **EXER-01**: App contains 200–500 exercises with name, target muscles, and step-by-step instructions
- [ ] **EXER-02**: Each exercise displays images or animated GIFs of the movement
- [ ] **EXER-03**: Each exercise displays a muscle diagram (SVG) highlighting targeted and secondary muscles
- [ ] **EXER-04**: User can search exercises by name
- [ ] **EXER-05**: User can filter exercises by muscle group, equipment required, and difficulty level

### Workout Tracking

- [ ] **TRKR-01**: User can mark a scheduled workout as completed or skipped
- [ ] **TRKR-02**: User can view their workout history (completed / skipped per day)
- [ ] **TRKR-03**: User's completion history is synced to the cloud and available across devices

### Nutrition

- [ ] **NUTR-01**: AI generates personalized macro targets (protein, carbs, fat) based on user goal and body metrics
- [ ] **NUTR-02**: AI provides textual meal suggestions aligned with training goal (no food logging required)
- [ ] **NUTR-03**: Nutrition guidance updates when user profile or goal changes

### AI Model Settings

- [ ] **AIMD-01**: User can select AI provider (OpenRouter, Google Gemini, OpenAI) from settings
- [ ] **AIMD-02**: User can select a specific model within the chosen provider
- [ ] **AIMD-03**: App uses a sensible default model (e.g., GPT-4o or Gemini Flash) without requiring configuration
- [ ] **AIMD-04**: User can see estimated token cost or usage indicator per AI request

### Backend & Infrastructure

- [ ] **BACK-01**: All AI API calls are proxied through the backend — no API keys exposed in the mobile bundle
- [ ] **BACK-02**: Per-user AI usage quota is enforced server-side from day one
- [ ] **BACK-03**: User data (profile, program, workout history) is stored in the cloud (Supabase PostgreSQL)
- [ ] **BACK-04**: Exercise library data is seeded server-side and cached client-side for offline browsing

## v2 Requirements

### Active Workout Screen

- **ACTV-01**: Real-time workout screen with set/rep logging
- **ACTV-02**: Rest timer between sets
- **ACTV-03**: Exercise swap during a live session

### Social

- **SOCL-01**: User can share a completed workout
- **SOCL-02**: User can follow other users and view their activity

### Body Tracking

- **BODY-01**: User can log body weight over time with trend chart
- **BODY-02**: User can take progress photos linked to dates

### Notifications

- **NOTF-01**: Push notification reminder for scheduled workout
- **NOTF-02**: Weekly progress summary notification

### Payments

- **PAY-01**: In-app subscription for AI access (monthly/annual)
- **PAY-02**: Free tier with limited AI calls per month

## Out of Scope

| Feature | Reason |
|---------|--------|
| Manual calorie / food logging | Adds friction; AI suggestions cover nutrition in v1 |
| Live set/rep logging in workout | Saved for v2 — competes directly with Hevy on their strongest ground |
| Rest timer in v1 | Part of live workout UX — deferred with active workout screen |
| Video form analysis | High complexity / ML cost; not v1 |
| Social features (follow, share) | Not core to solo coaching value; v2 |
| Wearable / Apple Watch integration | Out of scope; reduces mobile-first simplicity |
| Offline AI generation | AI requires internet; offline covers exercise browsing only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 – AUTH-05 | Phase TBD | Pending |
| ONBD-01 – ONBD-06 | Phase TBD | Pending |
| PROG-01 – PROG-05 | Phase TBD | Pending |
| EXER-01 – EXER-05 | Phase TBD | Pending |
| TRKR-01 – TRKR-03 | Phase TBD | Pending |
| NUTR-01 – NUTR-03 | Phase TBD | Pending |
| AIMD-01 – AIMD-04 | Phase TBD | Pending |
| BACK-01 – BACK-04 | Phase TBD | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 31 ⚠️

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after initial definition*
