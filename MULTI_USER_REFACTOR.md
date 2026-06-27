# Multi-user refactor — phased implementation plan

## Why

The app currently has exactly one identity baked into the system: `APP_USER`/`APP_PASSWORD` env vars are SHA-256 hashed into a single static "token" (`composables/useCreds.ts`). Anyone who knows that token is authenticated forever — there's no session, no expiry, no revocation, and no `User` row anywhere in the schema. Every `Recipe`, `Mealplan`, and their children are global rows with no owner column, and `Recipe.name`/`Mealplan.name` are globally-unique constraints. The shopping-list email always goes to a hardcoded `MAILJET_TO_EMAIL` list.

## Decisions already made

- **Data model**: fully private per-user — every Recipe/Mealplan belongs to exactly one user, invisible to others (no sharing between accounts).
- **Sessions**: DB-backed opaque tokens (new `sessions` table), not JWT.
- **Signup**: self-service signup page, no admin gate.
- **Schema migration**: introduce Umzug instead of relying on `sequelize.sync()`, because production/staging (`PG_HOST_PROD`, `PG_HOST_STAGING`) already hold real data that must be backfilled to a real user, not just have a NOT NULL column added.

## How to use this document

Each phase below is intended to be its own PR, independently shippable and deployable without breaking the app in between phases. Do not start a phase until the previous one is merged and deployed. Check off steps as they're completed.

---

## Phase 0 — Prep ✅ done

- [x] Add dependencies: `bcrypt`, `@types/bcrypt`, `umzug`.
- [x] Confirm `.env` is git-ignored (it currently contains plaintext DB/Mailjet/Gemini credentials — not part of this refactor, just verify it isn't tracked).

## Phase 1 — Migration framework + new tables (additive only, no behavior change) ✅ done locally — staging/prod still pending

Goal: get Umzug wired up and create `users`/`sessions` tables without touching any existing table or any existing code path. The app continues running exactly as before after this ships.

- [x] Create `server/migrations/` directory and a runner bound to the existing `sequelize` instance exported from `server/dao/models.ts`.
- [x] Add npm script `"migrate": "tsx --env-file=.env server/migrations/run.ts"`.
- [x] Write migration `0001-create-users-and-sessions.ts`:
  - `CREATE TABLE users` — `id`, `email` (unique, not null), `passwordHash` (not null), `notificationEmail` (nullable), timestamps.
  - `CREATE TABLE sessions` — `id`, `tokenHash` (unique, not null — SHA-256 of the raw token; the raw token itself is never stored), `userId` (FK → users, cascade delete), `expiresAt` (not null), `createdAt`.
  - Within the *same* migration, read `APP_USER`/`APP_PASSWORD` from env, bcrypt-hash the password, and insert one `User` row. This is the row that will own all pre-existing data in Phase 4 — create it now so Phase 4 has a guaranteed target.
  - Write the matching `down()` (drop both tables).
- [x] Add `User` and `Session` Sequelize model definitions to `server/dao/models.ts`, exported alongside the existing models. Do **not** add `userId` to `Recipe`/`Mealplan` yet — that's Phase 4.
- [x] Run the migration against local. Verified: `users` has exactly one row (`email` = `APP_USER` value, `passwordHash` is a bcrypt hash), `sessions` table created empty, rerun is a no-op.
- [ ] Run the migration against staging, then prod (deliberately not done yet — needs explicit go-ahead since it touches real databases).

## Phase 2 — New auth endpoints, built in parallel with the old ones ✅ done

Goal: build and test the new session-based auth surface without removing the old static-token system yet, so it can be tested independently before the cutover.

- [x] Add `server/utils/token.ts` (pure, no DB dependency: `SESSION_COOKIE_NAME`, header/cookie token extraction) and `server/utils/session.ts` (DB-backed: `createSession`, `getSessionUserId`, `deleteSession`, `deleteExpiredSessions`, re-exports `token.ts`). Split into two files so the pure parsing logic is unit-testable without a live DB.
- [x] Add `server/utils/rateLimit.ts` — in-memory per-key attempt counter (`assertNotRateLimited`, `recordAttempt`, `clearRateLimit`).
- [x] Exclude `/api/auth/*` from the old static-token check in `server/middleware/apiAuth.ts` (otherwise the new endpoints would be unreachable without already holding an old token).
- [x] Add `server/api/auth/signup.post.ts` — body `{ email, password }`; rate-limited by IP; reject duplicate email (409); bcrypt-hash; create `User`. Does not create a session.
- [x] Add `server/api/auth/login.post.ts` — body `{ email, password }`; rate-limited by email; bcrypt-compare; on success create a `Session`, return `{ token, expiresAt }` in the JSON body (cookie-setting is deferred to Phase 3's cookie hardening).
- [x] Add `server/api/auth/logout.post.ts` — delete the `Session` row matching the presented token's hash.
- [x] Add `server/api/auth/me.get.ts` — resolve the session and return `{ email }`, or 401.
- [x] Rate limiting added to both `login.post.ts` and `signup.post.ts`.
- [x] Unit tests: `tests/token.utils.spec.ts`, `tests/rateLimit.spec.ts`.
- [x] Manually verified all 4 endpoints end-to-end via curl (signup → 201/409 duplicate, login → 401 bad creds/200 with token, me → 200 with valid Bearer/cookie token, 401 without, logout → revokes session, subsequent `me` 401s). Full `npm test` suite passes (14/14). Old static-token system untouched and still functional throughout.

## Phase 3 — Cutover: switch the app to session auth ✅ done

Goal: flip the switch. This phase retires the static-token system entirely.

- [x] Rewrote `server/middleware/apiAuth.ts` to extract the token via `getTokenFromEvent`, resolve it via `getSessionUserId`, and set `event.context.userId`. 401 on missing/invalid/expired. `/api/auth/*` stays excluded.
- [x] Deleted `composables/useCreds.ts`, `server/routes/auth.ts`, and (once confirmed unused) `composables/useToken.ts`.
- [x] Rewrote `composables/useLogin.ts`: `login(email, password)`, `signup(email, password)`, `checkAuth()` (replaces `checkAuthToken(token)` — no token param, cookie is auto-sent), `logout()`. `checkAuth()` uses `useRequestFetch()` instead of plain `fetch()` so SSR navigation works and forwards the incoming cookie (plain `fetch` can't resolve a relative URL server-side and wouldn't carry the cookie).
- [x] Updated `pages/login.vue`: email/password form, inline error display, success banner via `?registered=1`, link to `/signup`.
- [x] Added `pages/signup.vue`: email/password/confirm-password form, surfaces server error messages (e.g. "Email already in use"), redirects to `/login?registered=1`.
- [x] Cookie hardened: `login.post.ts` now sets it server-side via `setCookie(...)` with `httpOnly: true, sameSite: 'lax', secure: <non-localhost>`; response body no longer contains the raw token (only `{email}`). `logout.post.ts` clears it via `deleteCookie(...)`.
- [x] `middleware/auth.ts` simplified to a single `await useLogin().checkAuth()` check.
- [x] `server/api/internal/email.post.ts` swapped its token-extraction import from the deleted `useCreds()` to `getTokenFromEvent` from `server/utils/session.ts`.
- [x] Verified end-to-end: signup → login (httpOnly/SameSite=Lax cookie, no raw token in body) → protected route 200 with cookie / 401 without → logout → protected route 401 afterward (proves server-side revocation, not just a client-side cookie clear). The pre-existing default user (seeded in Phase 1 from old `APP_USER`/`APP_PASSWORD`) logs in successfully through the new system with their old credentials. `npm test` 14/14, no new type errors.
- [ ] Not yet done: removing `APP_USER`/`APP_PASSWORD`/old env vars from `.env` and deploying to staging/prod — deferred until this is rolled out for real (still local-only so far).

## Phase 4 — Data ownership (the actual multi-tenancy) ✅ done

Goal: every `Recipe` and `Mealplan` belongs to exactly one user, and the API enforces it.

- [x] Migration `0002-add-user-ownership.ts`: added nullable `userId` FK → users on `recipes`/`mealplans`, backfilled to the Phase 1 default user (looked up by `email = APP_USER`, not just "first user by id" — robust regardless of how many other users exist by the time this runs), set `NOT NULL`, added `unique(userId, name)`, wrote the matching `down()`.
  - **Unplanned but necessary**: discovered `recipes`/`mealplans` each had **~190+ duplicate auto-named `unique(name)` constraints** — `sequelize.sync()` had been adding a new one on every dev-server restart for the project's lifetime because the original model never gave the constraint an explicit name. The migration dynamically queries `pg_constraint`/`pg_attribute` to find and drop *every* single-column unique constraint on `name` (not just one well-known name) before adding the composite one — otherwise the leftover global-uniqueness constraints would have silently defeated this entire phase.
- [x] Updated `server/dao/models.ts`: added `userId` to `Recipe`/`Mealplan`, removed `unique: true` on `name` (this also fixes the root cause above — sync() no longer tries to manage an unnamed unique constraint on every restart).
- [x] `RecipeIngredient`/`MealplanRecipe`/`MealplanRecipeIngredient`/`MealplanIngredient` left untouched — ownership enforced transitively through their parent.
- [x] Added `server/utils/ownership.ts` — `assertOwnedByUser(model, id, userId)`.
- [x] Updated `recipe.get.ts`/`mealplan.get.ts`: `where: { userId }` on `findAll`; switched the single-id path from `findByPk` to `findOne({where: {id, userId}, ...})` since `findByPk` doesn't reliably support extra `where` filters.
- [x] Updated `recipe.post.ts`/`mealplan.post.ts`: `userId` set on create; `assertOwnedByUser` called on update — critically, called *before* opening the surrounding `sequelize.transaction()`/`try` block in both files, otherwise the try/catch would swallow the 403/404 into a generic 400/500. Also fixed two small pre-existing bugs found along the way: updating a non-existent mealplan id silently no-op'd instead of erroring, and one `Mealplan.update` call inside the transaction was missing `transaction: t`.
- [x] Updated `recipe.delete.ts`/`mealplan.delete.ts`: `userId` folded into the `destroy({ where: { id, userId } })` clause.
- [x] `server/api/internal/email.post.ts` needed no further change — already scoped automatically via the forwarded token.
- [x] Verified end-to-end with two real throwaway accounts per resource type: cross-user list/get/update/delete all correctly blocked (403 on update, 0-row no-op on delete, invisible in lists), same-name-different-user mealplans now succeed (proving the global unique constraint is really gone), `npm test` 14/14, no new type errors. All test data cleaned up — DB confirmed back to exactly the original 1 user / 6 recipes / 5 mealplans.

## Phase 5 — Per-user email recipient ✅ done

- [x] `composables/useMailgun.ts`: `send(text)` → `send(text, toEmail: string)`, single recipient instead of the hardcoded comma-split `MAILJET_TO_EMAIL` list. Intentional behavior change: the old single global trigger fanned out to multiple hardcoded addresses (you + partner); now each person has their own account and triggers their own shopping-list email to themselves — multi-user replaces the "broadcast to a fixed list" use case rather than needing to preserve it per-account.
- [x] `server/api/internal/email.post.ts`: looks up the requesting user via `event.context.userId`, passes `user.notificationEmail ?? user.email` as the recipient.
- [x] Removed dead config: `mailjetToEmail` from `nuxt.config.ts` runtime config (no longer read anywhere). Also removed `appUser`/`appPassword` from the same config block while in there — leftover from the deleted Phase 3 `useCreds.ts`, confirmed via grep to have zero remaining references anywhere.
- [x] Backfilled the existing pre-migration default account's `notificationEmail` directly in the DB (their `email` column holds the literal old `APP_USER` value, `kumpfeiffer`, which isn't a deliverable address) so the shopping-list email feature keeps working for them after this change, rather than silently breaking.
- [x] `npx tsc --noEmit` (same 4 pre-existing unrelated errors only) and `npm test` (14/14) both clean. Did **not** trigger a real Mailjet send as part of verification (avoided an unprompted real external email send/API cost) — logic was verified by reading the code path and type-checking only; flagging this so live send behavior gets a real check the next time the email feature is used.

## Phase 6 — Tests ✅ done

- [x] `tests/isolation.spec.ts`: live HTTP integration tests (real middleware + route handlers, not just DB checks) proving user A can never list/read/update/delete user B's recipes or mealplans; same-name-different-user now succeeds; legitimate owner's own CRUD still works. 14 tests.
- [x] `tests/auth.spec.ts`: signup 201/409/400, login 401 with an identical message for wrong-password vs. unknown-email (no enumeration), `/api/auth/me` 200/401, logout actually revokes the session server-side (not just a client cookie clear — the exact bug this whole refactor fixes), expired sessions rejected, and a sanity check that `apiAuth` middleware still 401s with no cookie. 10 tests.
- [x] Both suites hit the live dev server via real HTTP (skip gracefully with a console warning if it's not running, rather than failing `npm test` outright — there's no CI yet, so these are meant to run locally against `npm run dev`), generate unique throwaway users per run, and clean up everything in `afterAll` (verified via direct DB checks that repeated runs leave the DB exactly as found).
- [x] `npm test` now loads `.env` (`node --env-file=.env ./node_modules/.bin/vitest run`) since these new tests need live DB access via `server/dao/models.ts`, unlike the original pure-function tests.
- [x] Found and fixed two real bugs while writing these tests: (1) `POST /api/auth/signup` was returning real HTTP 200 with `201` only as a cosmetic field inside the JSON body — added `setResponseStatus(event, 201)` so the wire-level status actually matches; (2) the signup rate limit (10 attempts/15min per IP) was tight enough that the combined test suite alone could trip it, so raised it to 30 — still a meaningful anti-abuse limit, just with realistic headroom for a growing test suite hitting the same dev server.
- [x] Full `npm test`: 38/38 passing, run twice in a row for stability, DB confirmed back to the original 1 user / 0 sessions / 6 recipes / 5 mealplans after every run.

## Phase 7 — Cleanup / follow-ups (not blocking, track separately)

- [ ] Password reset flow — self-service signup with no reset path means a forgotten password is a permanent lockout today. At minimum, a manual DB-level reset script until a real flow exists.
- [ ] Periodic `Session` cleanup (`WHERE expiresAt < now()`) — fine to do lazily on lookup miss rather than a cron, given this app's scale.
- [ ] `GEMINI_API_KEY` stays a single global key (shared quota) — no per-user metering planned.
- [ ] `googleapis` dependency / `tasks_api_test.js` — unrelated experimental Google Tasks integration, not touched by this refactor.

## Verification (run after each phase that touches behavior)

- `npm test`.
- Manual: sign up two separate accounts, create a recipe/mealplan under each, confirm via the UI and via direct API calls (each account's own token) that neither can see or mutate the other's data, and that a logged-out token is rejected with 401 rather than silently still working.
