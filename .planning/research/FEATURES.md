# Feature Research

**Domain:** AI gym coaching mobile app (React Native)
**Researched:** 2026-03-01
**Confidence:** MEDIUM-HIGH (Fitbod, Hevy, Freeletics App Store listings + reviews verified directly; Reddit blocked, Tom's Guide partially verified)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Detailed onboarding | Every AI fitness app starts with goal/level/equipment intake. Without it, generated workouts are generic and users churn immediately | MEDIUM | Goal, fitness level, injuries, equipment, available days, body metrics. PROJECT.md requires this. |
| AI-generated training program | This IS the product. Fitbod, Freeletics, Hevy Trainer all do this. Users expect a multi-week plan on day 1 | HIGH | Multi-week structure, progressive overload, split type. Core differentiation is quality here. |
| Exercise library with instructions | Fitbod (1000+ exercises), Hevy (hundreds with HD videos), Freeletics (700+) all include this. Users expect to know HOW to do exercises | MEDIUM | Text instructions + images + muscle diagrams. Video is gold standard but image+diagram is acceptable for v1. |
| Workout completion tracking | Marking workouts done/skipped and seeing history is the minimum progress mechanism. Hevy built its entire reputation on this | LOW | Simple done/skipped. PROJECT.md explicitly requires this as "completion tracking only (no live set logging)". |
| User account + cloud sync | Required for personalization and cross-device access. Hevy Pro, Fitbod Elite, Freeletics Coach are all account-gated | MEDIUM | Auth + backend sync. PROJECT.md: accounts required, no anonymous mode. |
| Session adaptability (constraints input) | Freeletics hallmark feature — "only 15 min today" or "no equipment available." Users traveling or tired expect this | MEDIUM | On-demand session generation with time/equipment constraints. PROJECT.md explicitly requires this. |
| Progress visibility | Users need feedback that they're improving. Every top app has some form of progress view — streaks, volume, completions | LOW-MEDIUM | Workout history calendar, streak display, completion rate. Detailed analytics can come later. |
| Rest timer between sets | Universal in gym apps (Hevy, Fitbod). During workout, rest timer is expected by gym users | LOW | Countdown timer, configurable duration per exercise. Not explicitly in PROJECT.md but users will expect it in the active session screen. |
| Exercise swap within session | Freeletics users complain loudly when they can't swap a single exercise. Fitbod allows swaps. This is a pain point if missing | MEDIUM | "Swap this exercise" → AI suggests alternatives with same muscle group + available equipment. |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-provider AI model switching | No competitor lets users choose their AI model. Fitbod uses proprietary ML, Freeletics uses proprietary AI. Being able to pick GPT-4o vs Gemini vs Claude is unique and appeals to tech-savvy users | HIGH | OpenRouter + Google API + OpenAI. Backend proxy required. PROJECT.md explicitly requires this as core feature. |
| AI meal/macro suggestions (not logging) | Nutrition coaching without the overhead of manual food tracking. Body Coach and Freeletics Nutrition are separate apps. Integrated lightweight nutrition in same app is underserved | MEDIUM | Based on goal + workout. Macro targets + meal ideas. Not calorie tracking — AI suggestions only. PROJECT.md explicitly scopes this. |
| Injury-aware program generation | Users frequently cite exercise injuries as a reason they can't follow generic plans. Freeletics forces full workout regeneration; Fitbod has exclusion lists but it's manual | MEDIUM | Injury fields in onboarding → program avoids contraindicated exercises. Per-exercise "I can't do this" flag that persists. |
| Transparent AI reasoning | Most apps hide the "why" behind recommendations. Showing users WHY the AI chose today's exercises (muscle recovery, progression logic) builds trust and retention | MEDIUM | Brief AI explanation per session: "We're targeting your chest today because it's been 4 days since your last chest session and you're due for progressive overload." |
| Equipment-adaptive program (not just filtering) | Fitbod and Hevy let you filter by equipment. The differentiator is generating programs that genuinely change structure (not just swap dumbbells for barbells) when equipment changes | HIGH | Onboarding captures equipment. On-demand session regeneration respects equipment constraints natively. |
| Per-exercise feedback (not whole-workout) | Freeletics only lets you rate the whole workout. Users want to say "the squats were too hard but everything else was fine." Fine-grained feedback improves AI quality | MEDIUM | Per-exercise difficulty slider (too easy / just right / too hard) at session end. Feeds back into AI context for next generation. |
| Session completion without full finish | Freeletics doesn't save partial workouts. Users who stop halfway lose data. This frustrates users and is a known complaint | LOW | Save progress on exit: "Workout saved as partial — 6/9 exercises completed." |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Live set-by-set weight/rep logging | Users ask for "make it like Hevy" — log exact weight and reps per set | Requires a completely different UX paradigm (Hevy-style workout screen). Hevy took years to get right. Attempting both AI coaching AND detailed logging in v1 creates a bloated, confusing app that does neither well. It's scope creep that destroys the coaching focus | Keep completion tracking only (done/skip). After v1 validation, consider adding basic logging if users demand it. PROJECT.md explicitly defers this. |
| Social features (sharing, following) | Hevy's top praised feature is seeing what friends lift. Freeletics has community | Social requires moderation, content policies, feed algorithms, notification systems. None of these exist in the coaching value prop. Every hour spent on social = one less hour on AI quality | Defer to v2. Focus on solo coaching value first. PROJECT.md explicitly defers this. |
| Body progress photos / measurement tracking | Users want to see visual transformation | Requires photo storage, potentially sensitive data handling, comparison UI. Privacy concerns. Doesn't add coaching value in v1 | Defer to v2. PROJECT.md explicitly defers this. |
| Real-time form analysis via camera | Frequently requested: "tell me if my squat form is wrong" | Computer vision for exercise form is still unreliable, requires significant ML infrastructure, high latency on mobile. False positives ("your form is wrong" when it's fine) erode trust. Freeletics and Fitbod both avoid this | Video exercise demonstrations in the library are the safe alternative. PROJECT.md explicitly defers this. |
| Calorie/food logging | "I want to track what I eat" | Manual food logging is a deep product category (MyFitnessPal has 11M+ foods). Building a database, barcode scanner, and nutritional data is a massive side project. Competing with MFP is not the game | AI meal suggestions based on goals (no logging). Integrate with HealthKit for calorie import if needed later. PROJECT.md explicitly scopes this out. |
| Wearable integration (Apple Watch, Garmin) | "Sync my heart rate / auto-log workouts" | Every wearable has different APIs. Apple HealthKit integration alone is a non-trivial feature with its own approval requirements. Not core to AI coaching value in v1 | Defer to v1.x. Add HealthKit write (log completed workout) as first integration — it's simpler than live sync. |
| Gamification (points, badges, leaderboards) | Seems motivating | Gamification works when retention is already healthy — it doesn't fix a bad core product. Building badge logic before validating that the AI coaching is good is premature. Hevy has it, Freeletics has it, neither is a reason users stay | Streaks + completion history are sufficient motivation indicators for v1. |

---

## Feature Dependencies

```
[User Account & Auth]
    └──requires──> [Cloud Sync]
                       └──required by──> [AI Program Generation]
                       └──required by──> [Workout History / Progress]

[Onboarding (profile capture)]
    └──required by──> [AI Program Generation]
                          └──required by──> [Session Adaptation (on-demand)]
                          └──required by──> [Meal/Macro Suggestions]

[Exercise Library]
    └──required by──> [AI Program Generation] (needs exercise IDs to reference)
    └──required by──> [Exercise Swap within session]

[Workout Completion Tracking]
    └──required by──> [Progress Visibility]
    └──required by──> [Per-exercise Feedback] (can only give feedback post-completion)
    └──enhances──> [AI Program Generation] (completion data feeds adaptation)

[Per-exercise Feedback]
    └──enhances──> [AI Program Generation] (fine-grained signal improves next session)

[Multi-provider AI]
    └──requires──> [Backend Proxy] (API keys never client-side)
    └──enhances──> [AI Program Generation]
    └──enhances──> [Session Adaptation]
    └──enhances──> [Meal/Macro Suggestions]
```

### Dependency Notes

- **AI Program Generation requires Onboarding:** You cannot generate a personalized program without knowing the user's goal, level, injuries, and equipment. These are the minimum inputs.
- **Cloud Sync requires Auth:** No anonymous local-only mode per PROJECT.md constraint.
- **Exercise Library required by AI Generation:** The AI must reference actual exercises from the library (with consistent IDs/slugs) so the UI can display correct demos. Generating exercise names without a library leads to hallucinations and unmatchable exercises.
- **Session Adaptation enhances AI Program Generation:** On-demand sessions are a layer on top of the base program — they require the program to exist first.
- **Per-exercise Feedback enhances AI:** Richer feedback signal allows the AI to adjust difficulty and exercise selection in subsequent sessions. Depends on completion tracking being done first.
- **Backend Proxy required by Multi-provider AI:** API keys must never be exposed on the client. The proxy also enables model switching without app updates.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept: "Does an AI coach that adapts day-by-day retain users better than static programs?"

- [x] **User account + cloud sync** — Required for AI access and data persistence
- [x] **Detailed onboarding** — Goal, fitness level, injuries, equipment, body metrics, available days/schedule. No onboarding = no personalization = no value prop
- [x] **AI multi-week training program generation** — The core product. Multi-provider (OpenRouter, Gemini, OpenAI), switchable from settings
- [x] **On-demand session adaptation** — "I only have 30 minutes / no gym today" → regenerates today's session. This is what makes it feel coached vs. static
- [x] **Exercise library with instructions + images + muscle diagrams** — Users need to know how to do exercises. Library also grounds AI output to real exercises
- [x] **Workout completion tracking (done / skip)** — Minimum feedback loop. No per-set logging in v1
- [x] **Exercise swap within session** — Must-have. If a user physically can't do an exercise, they need an alternative. Absence = frustration + churn
- [x] **AI meal/macro suggestions** — Lightweight nutrition. Based on goal + workout, no food logging
- [x] **Progress visibility** — Workout history, completion rate, basic streak. Users need to feel they're moving forward
- [x] **AI model/provider switch in settings** — Core differentiator. Let users switch between GPT-4o, Gemini, Claude etc.

### Add After Validation (v1.x)

Features to add once core coaching loop is validated.

- [ ] **Per-exercise difficulty feedback** — "Too easy / just right / too hard" per exercise, fed back into AI. Trigger: users request more personalization or AI program quality plateaus
- [ ] **Partial workout save on exit** — Trigger: user complaints about losing data when stopping early. Low complexity, high goodwill
- [ ] **HealthKit integration (write)** — Log completed workout to Apple Health. Trigger: iOS users expect this. Medium complexity
- [ ] **Rest timer (configurable per exercise)** — Trigger: gym users specifically complain about missing it. Low complexity

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Live set-by-set weight/rep logging** — Only if users stay for coaching AND want to track detailed performance. Massive UX expansion
- [ ] **Social / friends / community** — Only if retention is healthy and users ask for accountability partners
- [ ] **Body measurements + progress photos** — Only if users stay long enough to care about long-term body composition tracking
- [ ] **Video form analysis** — Only if ML infrastructure matures enough to be reliable and the team has resources for it
- [ ] **Wearable integrations (Apple Watch, Garmin)** — After core experience is solid
- [ ] **Gamification (badges, leaderboards)** — After retention mechanics are validated

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User account + auth | HIGH | MEDIUM | P1 |
| Detailed onboarding | HIGH | MEDIUM | P1 |
| AI program generation (multi-provider) | HIGH | HIGH | P1 |
| Exercise library (instructions + images) | HIGH | MEDIUM | P1 |
| Workout completion tracking | HIGH | LOW | P1 |
| On-demand session adaptation | HIGH | MEDIUM | P1 |
| Exercise swap within session | HIGH | MEDIUM | P1 |
| AI model/provider switcher | MEDIUM | HIGH | P1 (differentiator, core to project) |
| AI meal/macro suggestions | MEDIUM | MEDIUM | P1 |
| Progress visibility (history + streak) | MEDIUM | LOW | P1 |
| Per-exercise difficulty feedback | MEDIUM | LOW | P2 |
| Partial workout save | LOW | LOW | P2 |
| Rest timer | MEDIUM | LOW | P2 |
| HealthKit write integration | MEDIUM | MEDIUM | P2 |
| Live set/rep logging | HIGH request, LOW coaching value | HIGH | P3 |
| Social features | MEDIUM | VERY HIGH | P3 |
| Video form analysis | LOW (unreliable) | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Fitbod | Hevy | Freeletics | Our Approach |
|---------|--------|------|------------|--------------|
| AI program generation | ✅ Proprietary ML, adaptive | ✅ "Trainer" (Feb 2025, new) | ✅ AI Coach, feedback-based | Multi-provider LLM, user-switchable model |
| Exercise library | ✅ 1000+ with HD multi-angle video | ✅ Hundreds with videos | ✅ 700+ with demos | Instructions + images + muscle diagrams (v1), video later |
| Exercise swap | ✅ In-session swap | ✅ Via custom exercises | ❌ Must regenerate whole workout | ✅ Per-exercise swap with AI suggestion |
| Nutrition | ❌ None | ❌ None | ✅ Separate app (Freeletics Nutrition) | ✅ Lightweight AI suggestions (in-app, no logging) |
| Equipment adaptation | ✅ Filter-based | ✅ Filter-based | ✅ "I have no equipment today" | ✅ Constraint-driven session generation |
| Per-exercise feedback | ❌ None known | ❌ None | ❌ Whole workout only | ✅ Per-exercise difficulty rating (v1.x) |
| Model switching | ❌ None | ❌ None | ❌ None | ✅ Core differentiator — OpenRouter/Gemini/OpenAI |
| Social | ❌ None | ✅ Follow friends, copy workouts | ✅ Community (60M users) | ❌ Deferred to v2 |
| Set/rep logging | ❌ (suggestions only) | ✅ Core feature | ❌ Completion-style | ❌ Completion tracking only in v1 |
| Progress graphs | ✅ Basic | ✅ Excellent (volume, PRs, muscle) | ✅ Badges, streaks | ✅ History + completion rate + streak |
| Partial save | ❌ Unknown | ✅ Yes | ❌ No | ✅ v1.x |

---

## Sources

- **Fitbod** — App Store listing (265K ratings, 4.8★), user reviews, feature description. Accessed: 2026-03-01. https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543
- **Hevy** — App Store listing (59K ratings, 4.9★), version history (v3.0 Trainer launch Feb 2025), user reviews. Accessed: 2026-03-01. https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350
- **Freeletics** — App Store listing (22K ratings, 4.6★), marketing site, user reviews (multiple years). Accessed: 2026-03-01. https://apps.apple.com/us/app/freeletics-workout-fitness/id654810212
- **Tom's Guide** — "Best workout apps 2025" roundup including Centr, Nike Training Club, Body Coach, Sweat, Fiit. Accessed: 2026-03-01. https://www.tomsguide.com/best-picks/best-workout-apps
- **PROJECT.md** — GymCoach AI project definition, requirements, out-of-scope decisions. Accessed: 2026-03-01.

---

*Feature research for: AI gym coaching mobile app (React Native)*
*Researched: 2026-03-01*
