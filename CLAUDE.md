# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server
npm run build     # Build for production
npm test          # Run tests (vitest run)
```

To run a single test file:
```bash
npx vitest run tests/email.utils.spec.ts
```

## Architecture

**Nuxt 3 full-stack app** — frontend (Vue 3 + Tailwind CSS) and backend (Nuxt server routes) in one codebase, backed by PostgreSQL via Sequelize.

### Key layers

- **`pages/`** — Vue SPA pages: `index.vue` (main app), `login.vue`, `logout.vue`
- **`composables/`** — Client-side logic shared across pages:
  - `useCreds.ts` — SHA-256 token auth; token stored as `mealPlannerAuthToken` cookie
  - `useGemini.ts` — Calls Gemini 2.5 Flash Lite API to categorize ingredients by supermarket section
  - `useMailgun.ts` / `useMailjet.ts` — Email delivery of shopping lists
  - `useToken.ts`, `useLogin.ts` — Auth state management
- **`server/api/`** — Nitro API endpoints: `recipe.[get|post|delete].ts`, `mealplan.[get|post|delete].ts`, `internal/email.post.ts`
- **`server/dao/models.ts`** — All Sequelize models in one file; auto-syncs on startup. Models: `Recipe`, `RecipeIngredient`, `Mealplan`, `MealplanRecipe`, `MealplanRecipeIngredient`, `MealplanIngredient`
- **`server/middleware/apiAuth.ts`** — Validates Bearer token or cookie on all `/api/*` routes
- **`server/routes/auth.ts`** — Login/logout route handling
- **`middleware/auth.ts`** — Client-side route guard

### Authentication flow

Login credentials (`APP_USER`/`APP_PASSWORD`) are SHA-256 hashed (after base64 encoding) and compared against the token. All API routes require this token via `Authorization: Bearer <token>` header or `mealPlannerAuthToken` cookie.

### Data model

`Mealplan` contains `MealplanRecipe` records (denormalized snapshots of recipes) with their own `MealplanRecipeIngredient` children, plus direct `MealplanIngredient` records for ad-hoc items added to the plan.

### Environment variables

```
PG_DATABASE, PG_USER, PG_PASSWORD, PG_HOST
APP_USER, APP_PASSWORD, APP_URL
GEMINI_API_KEY
MAILJET_API_KEY, MAILJET_SECRET_KEY, MAILJET_URL, MAILJET_FROM_EMAIL, MAILJET_TO_EMAIL
```

SSL is automatically enabled for non-localhost PostgreSQL hosts.

### Tests

Tests live in `tests/` and use Vitest. Currently covers `server/api/internal/email.utils.ts` (ingredient cleaning and grouping utilities).
