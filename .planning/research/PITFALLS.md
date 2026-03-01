# Pitfalls Research

**Domain:** React Native AI fitness / gym coaching app
**Researched:** 2026-03-01
**Confidence:** HIGH (React Native performance, RN security, Supabase auth, OpenAI prod practices) / MEDIUM (AI prompt design for fitness, exercise data quality) / LOW (onboarding conversion specifics — no fitness-specific conversion benchmarks found)

---

## Critical Pitfalls

### Pitfall 1: AI Generates Dangerous Workouts for Injury-Prone Users

**What goes wrong:**
The LLM receives injury history (e.g., "knee injury, herniated disc") in the user profile but ignores it when generating sessions — prescribing squats, deadlifts, or high-impact cardio that could genuinely harm the user. This is the highest-stakes failure mode in the domain.

**Why it happens:**
The system prompt treats injury history as plain context rather than as a hard constraint. LLMs are optimized to produce helpful, positive-sounding output and will generate complete-looking workout plans even when the profile contains red flags that should eliminate entire exercise categories. Without explicit rejection logic built into the prompt, the model pattern-matches to "fitness user → standard workout."

**How to avoid:**
- Structure the system prompt so injury/medical data is in a separate, bolded CONSTRAINTS section with explicit language: "NEVER prescribe exercises that load [joint/area]. If the user profile contains [condition], exclude the following exercise categories entirely: [list]."
- Use structured output (JSON schema with OpenAI's Structured Outputs / Gemini's `response_schema`) so the backend can validate generated exercises against an injury-exercise exclusion table before the response reaches the client.
- Maintain a backend lookup table: `{ condition: ["squat", "deadlift", "running"] }`. After AI generation, diff the exercise list against the user's exclusion set. If there's a match, reject and regenerate (max 2 retries, then surface a safe fallback).
- Add a safety disclaimer in the UI: "AI-generated programs are not medical advice. Consult a physician before beginning if you have injuries or medical conditions."

**Warning signs:**
- During QA, test with profiles containing "knee replacement," "lower back hernia," and "shoulder surgery" — if the AI returns exercises targeting those areas, the prompt guard isn't working.
- User reviews mentioning "prescribed exercises I can't do" or "ignored my injury" in beta feedback.

**Phase to address:** AI program generation phase (the core AI feature phase). Before shipping AI-generated plans to any real user.

---

### Pitfall 2: AI Cost Blowout with No Per-User Spending Cap

**What goes wrong:**
The app sends the full user profile + full program context on every AI request. At GPT-5 pricing ($1.75/1M input + $14/1M output tokens), a verbose prompt (~2,000 tokens) + long response (~1,500 tokens) costs ~$0.024 per call. A power user generating 5 sessions/day = $3.65/month in AI costs alone — with zero cap, a single user can run unbounded. At scale, or with abuse, this becomes a runway-burning event.

**Why it happens:**
Developers building the AI feature prototype send the full profile every time (convenient) and don't implement per-user quotas because "we'll add that later." Later never comes before launch. OpenAI's own rate limits are at the organization level, not per end-user.

**How to avoid:**
- Implement per-user daily/monthly AI call quota tracking in the backend database from Day 1. Store `ai_calls_today`, `ai_calls_month`, `last_reset_at` per user. Enforce the limit in the API proxy before forwarding to the AI provider.
- Set a hard cap on max tokens: `max_tokens: 1200` for session generation (plans don't need to be longer). Use `max_tokens` close to your expected response size — overshooting wastes money on reserved capacity.
- Cache generated programs: a multi-week training program should be generated once and stored. Only the daily session adaptation (smaller context) needs a new AI call. Don't regenerate the whole program on each visit.
- Enable OpenAI/OpenRouter spending notifications and hard monthly limits at the organization level as a backstop.
- Use a cheaper model (e.g., GPT-5 mini at $0.25/$2.00 per 1M tokens) for meal suggestions and simpler requests; reserve the flagship model only for full program generation.

**Warning signs:**
- No `usage_limits` table in the database schema.
- AI proxy passes requests directly to provider with no quota check.
- Monthly API bill growing faster than user count.
- "Retry on error" logic that retries without limit (can loop on 429s, generating cost).

**Phase to address:** Backend proxy / auth phase (before any AI calls can be made from the app). Cost controls must exist before the first real user touches the AI.

---

### Pitfall 3: API Keys Exposed Client-Side

**What goes wrong:**
OpenAI, Gemini, or OpenRouter API keys are bundled into the React Native app — either in `app.config.js`, as a hardcoded constant, or via `react-native-dotenv`. Anyone who unpacks the APK or IPA with standard tools (e.g., `apktool`, `strings`) extracts the key in minutes. The key is then used for free inference or sold.

**Why it happens:**
React Native's `.env` pattern looks like server-side env vars but behaves completely differently — the values are compiled into the JS bundle, which ships to users. Developers from a web background assume `.env` = private. React Native's official security docs explicitly call this out: "Never store sensitive API keys in your app code."

**How to avoid:**
- All AI provider requests must go through a backend proxy (the project already requires this per PROJECT.md). The proxy holds the API keys as server-side environment variables. The mobile app authenticates with the proxy using the user's JWT token.
- The backend validates the JWT before forwarding to the AI provider. If the JWT is invalid or the user's quota is exceeded, the request is rejected before any AI cost is incurred.
- Never use `react-native-dotenv` or `react-native-config` for secrets. Use them only for non-secret config like API base URLs.

**Warning signs:**
- `OPENAI_API_KEY` or similar string in `app.config.js`, `.env`, or any file that ships with the app bundle.
- Direct calls to `api.openai.com` or `openrouter.ai` from the React Native app (no proxy in between).
- `process.env.OPENAI_API_KEY` referenced in any client-side file.

**Phase to address:** Backend proxy phase — this is the very first thing to build before any AI feature. No exceptions.

---

### Pitfall 4: FlatList Performance Collapse on Exercise Library

**What goes wrong:**
The exercise library has 200–500 exercises, each with an image, name, muscle tags, and equipment info. Using a naive `FlatList` with inline `renderItem` arrow functions and no `getItemLayout` causes dropped frames, blank cells during scroll, and UI thread jank — especially on mid-range Android devices.

**Why it happens:**
React Native's FlatList is a virtualized list but requires developer configuration to perform well. The most common mistakes, per official docs:
- `renderItem` defined as an inline arrow function → re-created on every parent render → React can't bail out of re-renders
- No `getItemLayout` → FlatList must asynchronously measure every item height → causes blank cells while scrolling
- Exercise card components not wrapped in `React.memo()` → unnecessary re-renders on any state change
- Heavy images loaded directly from URL without caching → JS thread blocked waiting for image decode

**How to avoid:**
- Use `@shopify/flash-list` instead of `FlatList`. FlashList (v2, Feb 2026) is built for RN's New Architecture and eliminates blank cells by recycling components instead of re-mounting them. It's a near drop-in replacement.
- If using FlatList: define `renderItem` outside JSX and wrap in `useCallback`; add `getItemLayout` if all exercise cards have fixed height (they should); wrap card components in `React.memo()` with a custom comparison.
- Use `@d11/react-native-fast-image` for exercise images — it provides memory and disk caching so images don't reload on every scroll pass.
- Store exercise data locally (bundled JSON or SQLite) so the library works offline and doesn't wait for network on every open.

**Warning signs:**
- `renderItem={({item}) => <ExerciseCard ... />}` inline in JSX.
- No `keyExtractor` prop on FlatList.
- Exercise images using plain `<Image source={{uri: url}}/>` without a caching wrapper.
- Visually: blank gray areas during fast scroll, especially on Android.

**Phase to address:** Exercise library phase. Set up FlashList from the start — retrofitting after blank-cell complaints is annoying but doable.

---

### Pitfall 5: Onboarding Drop-Off from Over-Collection

**What goes wrong:**
The onboarding collects goal, fitness level, injury history, preferred exercises, body metrics, available days, available equipment — all before the user has seen a single workout. This 7–9 step flow causes abandonment before reaching the AI-generated program, which is the first moment of value. Users who abandon during onboarding are lost permanently because the app requires an account (no anonymous mode).

**Why it happens:**
Product designers include every field the AI "needs" without questioning which fields are truly blocking first-value vs. which can be asked progressively. The AI can generate a reasonable starting program with just 4 fields (goal, fitness level, available days, available equipment).

**How to avoid:**
- Reduce the mandatory onboarding gate to only what's truly required for a minimum viable first program: goal, fitness level, days per week, available equipment (4 questions max).
- Move injury history to a "tell me more" step shown after the first program is generated, framed as "refine your program." Users who got value are more willing to share more.
- Move body metrics (weight, height) to a profile settings screen, not onboarding. They improve meal macro suggestions but are not required for a first workout.
- Show a preview of what the AI will generate at the start of onboarding — a glimpse of the output motivates completing the input.
- Use progress indicators (Step 2 of 4) so users know the end is near.

**Warning signs:**
- Onboarding has more than 5 required screens before the user sees a generated program.
- All profile fields marked as required in the database schema with no defaults.
- No analytics event tracking on individual onboarding steps (can't see where users drop off).

**Phase to address:** Onboarding / auth phase. Get the minimal viable profile defined before building the full onboarding UI.

---

### Pitfall 6: Sync Conflict on Workout Completion State

**What goes wrong:**
User marks a workout as "done" on their phone while offline (at the gym, no signal). They switch to another device, or the app syncs when connectivity returns. The server has no record of the completion; the local optimistic update conflicts with stale server state, resulting in the workout reverting to "not done" — or both states existing simultaneously with no resolution strategy.

**Why it happens:**
Developers implement offline marking with React Query optimistic updates or local state, but don't implement a "last write wins" or event-sourced conflict resolution strategy. Supabase's JWT-based auth means the client can write directly to the DB when online, but offline writes go to AsyncStorage or a local queue with no merge logic.

**How to avoid:**
- Design the data model for workout completion as an append-only log of events, not mutable state. Store `workout_completions (id, user_id, session_id, completed_at, source_device_id)`. Multiple completions for the same session are deduplicated by `session_id` on read. This makes sync trivial: just upload the local completion events when connectivity returns.
- If using a mutable `is_completed` flag, add a `completed_at` timestamp and implement last-write-wins resolution: the server accepts updates with the most recent `completed_at`.
- Use a local queue for offline writes (AsyncStorage or WatermelonDB) that is flushed to the server on reconnect. Never discard a local write silently.
- React Query's `onMutate` / `onError` rollback handles the optimistic UI correctly — but only if you implement `onError` to revert local state when sync fails permanently.

**Warning signs:**
- `is_done: boolean` column in the sessions table with no timestamp.
- No offline write queue — state is held only in component state (lost on app close).
- Users report "my workout disappeared" after going to the gym.

**Phase to address:** Workout tracking phase. The data model must be designed for eventual consistency from the start.

---

### Pitfall 7: AI Prompt Produces Hallucinated or Nonsense Exercise Names

**What goes wrong:**
The AI generates a workout program referencing exercises that don't exist in the app's exercise library (e.g., "Reverse Nordic Hamstring Curl with Band" when the library only has "Nordic Hamstring Curl"), or invents entirely fictional exercise names. The app can't match them to instructions/images and either shows empty cells or crashes.

**Why it happens:**
The AI generates exercises freely from its training data without being constrained to the app's actual exercise inventory. The library has ~200–500 known exercises; the AI knows thousands of variations. Without grounding the AI output to the library, mismatches are guaranteed.

**How to avoid:**
- Include the exercise library as context in the program-generation prompt. For a library of 300 exercises, send the exercise names list as part of the system prompt: "Use ONLY exercises from the following list: [comma-separated names]." This costs tokens but prevents hallucination.
- Use structured output with an exercise enum or a constrained `exercise_id` field tied to your database IDs. The AI selects from valid IDs, not free-text names.
- As a fallback: implement a fuzzy-match layer on the backend that maps AI-generated exercise names to the closest library entry. Flag low-confidence matches for review rather than silently failing.
- For a 300-exercise library, the name list is ~1,500–2,000 tokens — acceptable overhead if you use prompt caching.

**Warning signs:**
- AI response contains exercise names not in your library.
- UI shows exercise cards with missing images or "exercise not found" errors.
- No validation step between AI response parsing and rendering.

**Phase to address:** AI program generation phase, before any real users interact with the feature.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Send full user profile on every AI request | Simple to implement | Token costs multiply with every feature add; no caching possible | Never — build the context-selection layer from the start |
| Store tokens in `AsyncStorage` (unencrypted) | Easy auth persistence | Token theft from rooted device; RN security docs explicitly say "don't do this for secrets" | Never for auth tokens — use `expo-secure-store` |
| Hardcode `max_tokens: 4096` | Model always has room | 3–4x more expensive than needed; encourages verbose responses | Never — set `max_tokens` to your expected response size |
| Skip `React.memo` on exercise cards | Faster to ship | List re-renders on any global state change; obvious on mid-range Android | Acceptable in prototype only; add before first real user testing |
| One monolithic AI prompt for everything | One file to maintain | Can't optimize cost/quality per use case; program generation ≠ meal suggestion | Never — use separate prompt templates per feature |
| AsyncStorage for offline workout queue | Easy to implement | Not transactional; data loss on app crash mid-write | Acceptable for MVP if queue is small; replace with WatermelonDB at scale |
| Skip per-user quota tracking | Faster to ship | First heavy user or abuser can drain your API budget | Never — ship quotas with the first AI endpoint |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenRouter | Assuming provider fallback is transparent — it isn't always. Different providers return different error shapes and may have different context window limits for the "same" model | Test error handling against each provider variant; normalize error shapes in the proxy layer |
| OpenAI Structured Outputs | Using `response_format: { type: "json_object" }` (legacy) instead of the schema-constrained version — legacy mode still allows schema violations | Use `response_format: { type: "json_schema", json_schema: { schema: ... } }` with `strict: true` to get guaranteed schema compliance |
| Supabase Auth on React Native | Using `expo-auth-session`'s implicit flow (token in URL fragment) which is deprecated and insecure | Use PKCE flow (`expo-auth-session` with `responseType: "code"`) — Supabase docs confirm PKCE is the correct flow for mobile |
| Supabase Auth token refresh | Not handling the `TOKEN_REFRESHED` and `SIGNED_OUT` events — when the JWT expires mid-session, silent background refresh fails and the user gets 401s | Subscribe to `supabase.auth.onAuthStateChange()` and handle all state transitions; ensure refresh happens proactively before expiry |
| React Native deep linking for auth | Using custom URL schemes (e.g., `gymcoach://auth`) for OAuth redirect — interceptable by malicious apps on Android | Use Universal Links (iOS) and App Links (Android) for OAuth redirects; or use Supabase's email magic link which avoids the redirect vulnerability entirely |
| OpenAI rate limits | Tier 1 account starts at $100/month spend limit and low RPM. AI-heavy apps hit this before they feel like "real scale" | Track current tier; set monitoring alerts at 70% of spend limit; plan tier graduation timeline |
| Google Gemini via direct API | Gemini and OpenAI have different response shapes even for "same" requests — can't swap providers by changing a URL | Build a provider abstraction layer in the backend proxy that normalizes responses to a single internal schema before sending to client |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unoptimized FlatList for exercise library | Blank gray cells on scroll, dropped frames, "janky" feel on Android | Use FlashList v2; add `getItemLayout`; `React.memo` on cards | Starts at ~100 list items on low-end Android; immediately obvious in Expo Go |
| Sending full program context on session adaptation | AI latency 8–15s per "adapt today's session" request; users abandon | Send only the current week + today's session + user constraints, not the full multi-week program | Every request — token count determines latency |
| Unthrottled AI calls on form change | Calling AI on every keystroke in constraint fields (e.g., "time available") | Debounce AI calls; only call on explicit user action (button tap) | Immediately — every character change triggers a call |
| Storing exercise images as base64 in the app bundle | App bundle size 50–200 MB; slow OTA updates | Store as CDN URLs; use image caching library | Every release with new exercises |
| JavaScript thread blocked during program parse | UI freeze when parsing a large JSON program response | Use `JSON.parse` in a background task or split parsing with `requestAnimationFrame` | When AI response > ~50KB; longer for full multi-week programs |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API keys in client bundle | Key extraction → unauthorized API usage → your bill | Backend proxy (required by project constraints); never use `react-native-config`/`dotenv` for secrets |
| Storing auth tokens in `AsyncStorage` | Token theft on rooted Android, jailbroken iOS; `AsyncStorage` is explicitly listed as unsafe for tokens in RN security docs | Use `expo-secure-store` (wraps iOS Keychain + Android Encrypted SharedPreferences) |
| No per-user spending cap on AI proxy | One abusive user or credential-sharing can drain the entire API budget | Per-user quota table enforced at proxy layer before forwarding to provider |
| Trusting client-sent user profile for AI constraints | Malicious client sends modified profile to bypass injury restrictions | AI proxy reads the user profile from the database using the verified JWT identity — never trusts client-sent profile data |
| No input length cap on "current constraints" field | Prompt injection: user sends "ignore all previous instructions..." in the constraints field | Cap free-text input fields (e.g., `maxLength={500}`); validate on backend before including in AI prompt |
| Logging AI prompts that contain user health data | Health data (injury history, body metrics) in server logs → GDPR/privacy violation | OpenRouter doesn't log prompts by default (verified); set `log_prompts: false` on OpenAI org settings; never log full prompt content at proxy level |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Blank loading state during 8–15s AI generation | Users tap multiple times thinking it didn't work; duplicate requests; confusion | Show a progress animation with copy like "Building your program..." and a visible skeleton of the upcoming plan; disable the generate button while pending |
| Generated program shows all 4 weeks at once | Overwhelming wall of exercises; users don't know where to start | Show only the current week in the main view; use a weekly navigator; reveal future weeks progressively |
| Meal suggestions shown immediately after onboarding | Nutrition fatigue before users have even tried a workout | Surface meal suggestions contextually (after marking a workout complete, before the next one) not as a separate onboarding step |
| No indication that AI can be regenerated | Users stuck with a program they don't like but don't know they can ask for a new one | Add a visible "Regenerate" or "Adapt" button with clear copy; explain what inputs the AI will use |
| "Account required" wall shown before any value preview | Users leave before understanding why they should sign up | Show a sample AI-generated program (static, not real AI) before the signup wall; make the value proposition tangible |
| No error state for failed AI generation | Spinner hangs forever if the AI call times out or returns an error | Always show an error state after 30s timeout with a retry button and a "try a different model" suggestion |
| Exercise library has no search | 300 exercises with no search = users can't find what they want to add | Implement search from day 1; it's the primary navigation mechanism for large exercise libraries |

---

## "Looks Done But Isn't" Checklist

- [ ] **AI program generation:** Verify it reads injury history from the database (not client-sent data) and produces an exclusion list before passing to the model
- [ ] **Token storage:** Confirm auth tokens are stored in `expo-secure-store`, not `AsyncStorage` — check with code search for `AsyncStorage.setItem` near auth flows
- [ ] **API proxy:** Confirm zero AI provider calls originate from the React Native client — verify with Charles Proxy / network inspector that all requests go to your own backend domain
- [ ] **Offline completion sync:** Test by marking a workout complete in airplane mode, killing the app, reconnecting, and verifying the completion appears on a second device
- [ ] **Exercise library offline:** Confirm the exercise library loads without any network calls (data must be bundled or cached locally)
- [ ] **Per-user quota:** Trigger the quota limit in a test account and confirm the API returns a clear error (not a cryptic 500) that the UI surfaces as "You've reached your daily AI limit"
- [ ] **Model switching:** Switch provider from OpenAI → Gemini → OpenRouter in settings and confirm all three generate valid programs (test the provider abstraction layer)
- [ ] **Onboarding step count:** Count the required screens before the user sees the first AI-generated program — must be ≤ 4 required steps
- [ ] **iOS deep link auth:** Test OAuth sign-in on a physical iOS device (not simulator) — deep link redirects behave differently on real devices

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| API key exposed in shipped app | HIGH | Immediately rotate the key; push an emergency app update (OTA if using Expo, full store review if not); audit provider usage logs for unauthorized calls; notify users if data was accessed |
| Cost blowout from missing quota | HIGH | Emergency: kill the AI endpoint; add quota checks; re-enable. Longer: negotiate with OpenAI/OpenRouter for billing adjustment (limited success). Prevention is the only reliable fix |
| Sync conflicts corrupting completion data | MEDIUM | Add a `completed_at` timestamp column; migrate existing data; implement last-write-wins retroactively. Data integrity may require manual cleanup for affected users |
| FlatList blank cells in production | LOW | Ship FlashList or FlatList tuning as a patch; OTA deploy with Expo if possible. User-visible fix within hours |
| AI hallucinating exercises not in library | MEDIUM | Add exercise name validation layer on backend; return a fallback exercise from the library for unmatched names; no app update required if validation is server-side |
| Onboarding abandonment at 70%+ | MEDIUM | Remove non-essential steps via a config flag (if you built progressive disclosure); requires A/B test + monitoring infrastructure to detect and confirm the improvement |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dangerous workouts for injury-prone users | AI program generation phase | QA test with injury profiles before any real user access; automated integration test with a fixture containing "knee replacement" |
| AI cost blowout | Backend proxy phase (Day 1) | Per-user quota table exists in DB schema; load test shows proxy rejects over-limit requests with 429 |
| API keys exposed client-side | Backend proxy phase (Day 1) | Network inspector shows zero requests to provider domains from the app; code search finds no API key strings in client code |
| FlatList performance | Exercise library phase | Tested on a mid-range Android (Pixel 4a or equivalent); no blank cells at normal scroll speed |
| Onboarding drop-off | Onboarding / auth phase | Onboarding requires ≤ 4 screens before first program; analytics events on each step to measure drop-off |
| Sync conflicts | Workout tracking phase | Data model uses event log or timestamp-based resolution; offline-then-sync integration test passes |
| Hallucinated exercise names | AI program generation phase | Backend validates all AI-generated exercise names against library before returning to client; test with a constrained library |
| Token stored insecurely | Auth phase | Code review confirms `expo-secure-store` for all token persistence; no `AsyncStorage` for session data |
| No input sanitization (prompt injection) | Backend proxy phase | Free-text inputs are length-capped; proxy wraps user content in a delimited block separate from instructions |

---

## Sources

- React Native official docs — Performance Overview: https://reactnative.dev/docs/performance (updated Feb 20, 2026)
- React Native official docs — Optimizing FlatList Configuration: https://reactnative.dev/docs/optimizing-flatlist-configuration (updated Feb 20, 2026)
- React Native official docs — Security: https://reactnative.dev/docs/security (updated Feb 20, 2026) — explicit guidance on AsyncStorage unsafe for tokens, API key exposure, PKCE for OAuth
- Shopify FlashList v2 docs: https://shopify.github.io/flash-list/docs/ (updated Feb 27, 2026) — confirmed New Architecture support
- OpenAI Production Best Practices: https://platform.openai.com/docs/guides/production-best-practices — rate limits, cost management, usage tiers
- OpenAI Safety Best Practices: https://platform.openai.com/docs/guides/safety-best-practices — prompt engineering guardrails, input constraints, adversarial testing
- OpenAI Rate Limits docs: https://platform.openai.com/docs/guides/rate-limits — tier structure, TPM/RPM mechanics, usage limits
- OpenAI Pricing (verified March 2026): https://openai.com/api/pricing/ — GPT-5.2 $1.75/$14 per 1M tokens; GPT-5 mini $0.25/$2 per 1M tokens
- Supabase Auth — User Sessions: https://supabase.com/docs/guides/auth/sessions — JWT refresh behavior, session lifetime, PKCE flow recommendation
- Expo Auth Session docs: https://docs.expo.dev/guides/authentication/ — PKCE flow, implicit flow deprecation warning, `expo-secure-store` for token storage
- OpenRouter FAQ: https://openrouter.ai/docs/faq — credit system, provider fallback, rate limits for free vs paid tiers

---
*Pitfalls research for: React Native AI fitness coaching app (GymCoach AI)*
*Researched: 2026-03-01*
