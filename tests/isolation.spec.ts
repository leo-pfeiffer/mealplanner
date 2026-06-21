import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { User, Session, Recipe, Mealplan } from '../server/dao/models'

// ---------------------------------------------------------------------------
// Cross-user isolation integration tests
//
// These hit the *live* HTTP layer (actual middleware + route handlers) via
// plain fetch(), rather than calling Sequelize models directly, because the
// thing we need to prove is that the middleware/ownership wiring works end
// to end -- not just that the DB has the right rows.
//
// They require `npm run dev` to be running locally. There is no CI for this
// repo yet, so if the dev server isn't up, the whole suite is skipped (not
// failed) with a console warning, so that `npm test` alone never explodes
// just because no server happens to be running.
// ---------------------------------------------------------------------------

const baseUrl = process.env.APP_URL || 'http://localhost:3000'

const RUN_ID = `isolation-test-${Date.now()}-${crypto.randomUUID()}`
const PASSWORD = 'IsolationTest123!'

const createdUserEmails: string[] = []

// Reachability must be determined before the `describe.skipIf(...)` below is
// evaluated (describe blocks run at collection time, ahead of any
// beforeAll), so this check happens at module scope via top-level await.
// Any response (even 401) proves the server is up; only a network-level
// connection failure means "unreachable".
let serverReachable = false
try {
  await fetch(`${baseUrl}/api/auth/me`)
  serverReachable = true
} catch (err) {
  serverReachable = false
  // eslint-disable-next-line no-console
  console.warn(
    `\n[isolation.spec.ts] Could not reach ${baseUrl} -- skipping the whole suite.\n` +
    `These tests require the dev server to be running (\`npm run dev\`) since they\n` +
    `exercise the live HTTP layer (middleware + route handlers), not just the DB.\n`
  )
}

afterAll(async () => {
  if (!serverReachable) return

  // Cleanup via direct DB access -- fine for cleanup, the assertions
  // themselves go through the HTTP API.
  const users = await User.findAll({ where: { email: createdUserEmails } })
  const userIds = users.map((u) => u.id)

  if (userIds.length > 0) {
    await Recipe.destroy({ where: { userId: userIds } })
    await Mealplan.destroy({ where: { userId: userIds } })
    await Session.destroy({ where: { userId: userIds } })
    await User.destroy({ where: { id: userIds } })
  }
})

/**
 * Signs a fresh user up and logs them in, returning the Cookie header value
 * to use on subsequent fetch() calls for that user.
 */
async function signupAndLogin(email: string, password: string): Promise<string> {
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!signupRes.ok) {
    throw new Error(`signup failed for ${email}: ${signupRes.status} ${await signupRes.text()}`)
  }

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!loginRes.ok) {
    throw new Error(`login failed for ${email}: ${loginRes.status} ${await loginRes.text()}`)
  }

  const setCookie = loginRes.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error(`login for ${email} did not return a Set-Cookie header`)
  }
  // Set-Cookie can include attributes (Path=/, HttpOnly, ...) -- only the
  // first `name=value` segment should be echoed back as the Cookie header.
  return setCookie.split(';')[0]
}

describe.skipIf(!serverReachable)('cross-user isolation', () => {
  let cookieA: string
  let cookieB: string
  let emailA: string
  let emailB: string

  beforeAll(async () => {
    if (!serverReachable) return
    emailA = `${RUN_ID}-a@example.com`
    emailB = `${RUN_ID}-b@example.com`
    createdUserEmails.push(emailA, emailB)
    cookieA = await signupAndLogin(emailA, PASSWORD)
    cookieB = await signupAndLogin(emailB, PASSWORD)
  }, 20000)

  describe('recipes', () => {
    let recipeAId: number

    it('user A creates a recipe', async () => {
      const res = await fetch(`${baseUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          name: `${RUN_ID}-recipe-A`,
          note: 'note A',
          tags: ['tag1'],
          ingredients: ['flour', 'sugar'],
        }),
      })
      expect(res.status).toBe(200)

      const recipes = await Recipe.findAll({ where: { name: `${RUN_ID}-recipe-A` } })
      expect(recipes.length).toBe(1)
      recipeAId = recipes[0].id
    })

    it("user B's list does not include user A's recipe", async () => {
      const res = await fetch(`${baseUrl}/api/recipe`, {
        headers: { Cookie: cookieB },
      })
      expect(res.status).toBe(200)
      const list = await res.json()
      const names = list.map((r: { name: string }) => r.name)
      expect(names).not.toContain(`${RUN_ID}-recipe-A`)
    })

    it("user B's direct get-by-id for user A's recipe returns nothing", async () => {
      const res = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        headers: { Cookie: cookieB },
      })
      // H3 sends 204 No Content (empty body) when the handler returns null.
      expect(res.status).toBe(204)
      const text = await res.text()
      expect(text).toBe('')
    })

    it("user B cannot update user A's recipe", async () => {
      const res = await fetch(`${baseUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({
          id: recipeAId,
          name: 'hijacked',
          fieldsToUpdate: ['name'],
        }),
      })
      expect([403, 404]).toContain(res.status)

      // Verify as user A that the name was not changed.
      const checkRes = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        headers: { Cookie: cookieA },
      })
      const recipe = await checkRes.json()
      expect(recipe.name).toBe(`${RUN_ID}-recipe-A`)
    })

    it("user B's delete of user A's recipe does not remove it", async () => {
      const res = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieB },
      })
      // Destroy with a non-matching where clause just deletes 0 rows; it
      // shouldn't itself error, but the row must still exist afterward.
      expect(res.status).toBe(200)

      const checkRes = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        headers: { Cookie: cookieA },
      })
      const recipe = await checkRes.json()
      expect(recipe).not.toBeNull()
      expect(recipe.id).toBe(recipeAId)
    })

    it('user A can read, update, and delete their own recipe', async () => {
      const getRes = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        headers: { Cookie: cookieA },
      })
      expect(getRes.status).toBe(200)
      expect((await getRes.json()).id).toBe(recipeAId)

      const updateRes = await fetch(`${baseUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          id: recipeAId,
          name: `${RUN_ID}-recipe-A-renamed`,
          fieldsToUpdate: ['name'],
        }),
      })
      expect(updateRes.status).toBe(200)

      const deleteRes = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieA },
      })
      expect(deleteRes.status).toBe(200)

      const checkRes = await fetch(`${baseUrl}/api/recipe?id=${recipeAId}`, {
        headers: { Cookie: cookieA },
      })
      expect(checkRes.status).toBe(204)
    })

    it('two different users can create a recipe with the identical name without conflict', async () => {
      const sharedName = `${RUN_ID}-shared-recipe-name`

      const resA = await fetch(`${baseUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({ name: sharedName, note: '', tags: [], ingredients: [] }),
      })
      expect(resA.status).toBe(200)

      const resB = await fetch(`${baseUrl}/api/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({ name: sharedName, note: '', tags: [], ingredients: [] }),
      })
      expect(resB.status).toBe(200)

      const rows = await Recipe.findAll({ where: { name: sharedName } })
      expect(rows.length).toBe(2)
      expect(new Set(rows.map((r) => r.userId)).size).toBe(2)
    })
  })

  describe('mealplans', () => {
    let mealplanAId: number

    it('user A creates a mealplan', async () => {
      const res = await fetch(`${baseUrl}/api/mealplan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          name: `${RUN_ID}-mealplan-A`,
          recipes: [],
          ingredients: [],
        }),
      })
      expect(res.status).toBe(200)

      const mealplans = await Mealplan.findAll({ where: { name: `${RUN_ID}-mealplan-A` } })
      expect(mealplans.length).toBe(1)
      mealplanAId = mealplans[0].id
    })

    it("user B's list does not include user A's mealplan", async () => {
      const res = await fetch(`${baseUrl}/api/mealplan`, {
        headers: { Cookie: cookieB },
      })
      expect(res.status).toBe(200)
      const list = await res.json()
      const names = list.map((m: { name: string }) => m.name)
      expect(names).not.toContain(`${RUN_ID}-mealplan-A`)
    })

    it("user B's direct get-by-id for user A's mealplan returns nothing", async () => {
      const res = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        headers: { Cookie: cookieB },
      })
      // H3 sends 204 No Content (empty body) when the handler returns null.
      expect(res.status).toBe(204)
      const text = await res.text()
      expect(text).toBe('')
    })

    it("user B cannot update user A's mealplan", async () => {
      const res = await fetch(`${baseUrl}/api/mealplan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({
          id: mealplanAId,
          name: 'hijacked-mealplan',
          recipes: [],
          ingredients: [],
        }),
      })
      expect([403, 404]).toContain(res.status)

      const checkRes = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        headers: { Cookie: cookieA },
      })
      const mealplan = await checkRes.json()
      expect(mealplan.name).toBe(`${RUN_ID}-mealplan-A`)
    })

    it("user B's delete of user A's mealplan does not remove it", async () => {
      const res = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieB },
      })
      expect(res.status).toBe(200)

      const checkRes = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        headers: { Cookie: cookieA },
      })
      const mealplan = await checkRes.json()
      expect(mealplan).not.toBeNull()
      expect(mealplan.id).toBe(mealplanAId)
    })

    it('user A can read, update, and delete their own mealplan', async () => {
      const getRes = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        headers: { Cookie: cookieA },
      })
      expect(getRes.status).toBe(200)
      expect((await getRes.json()).id).toBe(mealplanAId)

      const updateRes = await fetch(`${baseUrl}/api/mealplan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({
          id: mealplanAId,
          name: `${RUN_ID}-mealplan-A-renamed`,
          recipes: [],
          ingredients: [],
        }),
      })
      expect(updateRes.status).toBe(200)

      const deleteRes = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieA },
      })
      expect(deleteRes.status).toBe(200)

      const checkRes = await fetch(`${baseUrl}/api/mealplan?id=${mealplanAId}`, {
        headers: { Cookie: cookieA },
      })
      expect(checkRes.status).toBe(204)
    })

    it('two different users can create a mealplan with the identical name without conflict', async () => {
      const sharedName = `${RUN_ID}-shared-mealplan-name`

      const resA = await fetch(`${baseUrl}/api/mealplan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieA },
        body: JSON.stringify({ name: sharedName, recipes: [], ingredients: [] }),
      })
      expect(resA.status).toBe(200)

      const resB = await fetch(`${baseUrl}/api/mealplan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieB },
        body: JSON.stringify({ name: sharedName, recipes: [], ingredients: [] }),
      })
      expect(resB.status).toBe(200)

      const rows = await Mealplan.findAll({ where: { name: sharedName } })
      expect(rows.length).toBe(2)
      expect(new Set(rows.map((r) => r.userId)).size).toBe(2)
    })
  })
})
