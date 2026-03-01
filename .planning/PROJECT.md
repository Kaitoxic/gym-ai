# GymCoach AI

## What This Is

A React Native mobile app that acts as a personal AI gym coach. It generates personalized training programs and adapts daily sessions on demand, guides users through an exercise library with instructions and visuals, suggests meals based on goals, and tracks workout completion. Users pay for AI access via an account with cloud sync.

## Core Value

The AI generates a real training program tailored to the user's profile and adapts it session by session — so every workout feels coached, not generic.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can create an account and log in (cloud sync, required for AI access)
- [ ] User completes detailed onboarding: goal, fitness level, injury history, preferred exercises, body metrics, available days/equipment
- [ ] AI generates a multi-week training program based on profile (multi-provider: OpenRouter, Gemini, OpenAI — switchable)
- [ ] User can generate an on-demand session adapted to current constraints (time, equipment)
- [ ] User can mark workouts as done or skipped
- [ ] App includes an exercise library with instructions, images, and muscle diagrams
- [ ] AI suggests meals/macros based on goal and workout
- [ ] User can switch AI model/provider from settings

### Out of Scope

- Social features (sharing, following) — not core to solo coaching value, defer to v2
- Manual food logging / calorie tracking — AI suggestions only in v1
- Body progress photos / measurements — defer to v2
- Video form analysis — high complexity, not v1

## Context

- **Existing infrastructure**: The project lives in `C:\Users\cleme\Documents\AI-ClaudeOpus\projets\gym-coach-app\`
- **AI access**: Multi-provider — OpenRouter (covers most models), Google API (Gemini, Gemma 3), OpenAI. Model switchable per user preference.
- **Monetization**: Users pay for AI access — account is required, cloud sync is the value lock-in.
- **Platform**: React Native (iOS + Android from one codebase)
- **Backend needed**: Auth + cloud sync + AI proxy (to hide API keys from client)

## Constraints

- **Tech stack**: React Native — no Flutter, no PWA
- **AI providers**: OpenRouter, Google API (Gemini/Gemma), OpenAI — all three must be supported
- **Auth**: Accounts required (no anonymous local-only mode)
- **API keys**: Never exposed client-side — must go through backend proxy

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multi-provider AI (OpenRouter + Gemini + OpenAI) | User wants to switch models freely, avoid vendor lock-in | — Pending |
| Account required (no local-only) | AI access is monetized — no account = no AI | — Pending |
| Completion tracking only (no live set logging) | Simplicity for v1 — don't overload the workout screen | — Pending |
| AI meal suggestions only (no food logging) | Keep nutrition lightweight in v1 | — Pending |

---
*Last updated: 2026-03-01 after initialization*
