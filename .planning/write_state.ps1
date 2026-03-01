$path = 'C:\Users\cleme\Documents\AI-ClaudeOpus\projets\gym-coach-app\.planning\STATE.md'
$content = @'
# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** The AI generates a real training program tailored to the user profile and adapts it session by session so every workout feels coached, not generic.
**Current focus:** Phase 2 -- Authentication (Mobile Client)

## Current Position

Phase: 1 of 9 COMPLETE -- moving to Phase 2
Plan: 4 of 4 executed (all code shipped, human infra checkpoints pending)
Status: Phase 1 code complete -- pending Supabase setup + Railway deploy
Last activity: 2026-03-01 -- Wave 3 complete: AI proxy, auth, quota, exercises endpoint, 20 seed exercises

Progress: [##########] Phase 1 100% code done

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Total execution time: ~1 session

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 1 | 4/4 | Code complete |

**Recent Trend:**
- Last plans: 01-01, 01-02, 01-03, 01-04
- Trend: on track

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Backend proxy is Phase 1 -- all AI features blocked until proxy + quota enforcement exist
- [Roadmap]: Exercise library (Phase 4) depends on Phase 1 only -- can run concurrently with Phases 2-3
- [Arch]: API lives in gym-coach-app repo (not a separate repo) -- migrated from gym-coach-app-api
- [Zod v4]: Use result.error.issues (not .errors) -- breaking change in Zod v4

### Pending Todos

- Human: run 001_initial_schema.sql in Supabase dashboard
- Human: run 002_exercises_schema.sql in Supabase dashboard
- Human: set env vars on Railway (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET, API keys)
- Human: run npm run seed:exercises after Supabase is up
- Human: verify GET /health and GET /health/db return 200 on Railway

### Blockers/Concerns

- [Phase 4]: Exercise data source unresolved -- ExerciseDB API vs Wger vs manual. 20 seed exercises exist for dev.
- [Phase 5]: Structured output per provider differs -- needs research before Phase 5 planning.
- [Phase 7]: Constraint-driven session adaptation -- hardest prompt engineering challenge.
- [General]: GDPR/health data compliance not yet assessed.
- [General]: App Store review policy for AI recommendations not yet confirmed.

## Session Continuity

Last session: 2026-03-01
Stopped at: Phase 1 code complete, pushed to github.com/Kaitoxic/gym-ai
Resume: Start Phase 2 planning (Authentication -- Mobile Client)
'@
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Written STATE.md"
