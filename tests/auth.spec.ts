import { describe, it, expect, afterAll, afterEach, beforeAll } from 'vitest'
// NOTE: reachability must be determined BEFORE describe blocks are collected,
// since vitest evaluates `describe.runIf(...)` synchronously at collection
// time -- a `beforeAll` hook runs too late to influence that decision.
import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'
import { User, Session } from '../server/dao/models'

const baseUrl = process.env.APP_URL || 'http://localhost:3000'

let serverReachable = false
try {
  await fetch(`${baseUrl}/api/auth/me`)
  serverReachable = true
} catch {
  serverReachable = false
  // eslint-disable-next-line no-console
  console.warn(
    `\n[auth.spec.ts] WARNING: could not reach ${baseUrl}. ` +
      `Skipping the entire auth test suite. Start the dev server with "npm run dev" and re-run ` +
      `"npx vitest run tests/auth.spec.ts" to execute these tests.\n`,
  )
}

const PASSWORD = 'correct-password-123'

const uniqueEmail = () => `auth-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`

// Track every user we create so afterAll can clean up even if an individual
// test fails before it gets a chance to clean up after itself.
const createdEmails = new Set<string>()

const trackEmail = (email: string) => {
  createdEmails.add(email)
}

const cleanupEmail = async (email: string) => {
  const user = await User.findOne({ where: { email } })
  if (user) {
    await Session.destroy({ where: { userId: user.id } })
    await user.destroy()
  }
}

/**
 * Plain fetch() against a local Node http server doesn't reliably expose
 * multiple Set-Cookie headers (and some runtimes fold/hide them entirely),
 * so for the one assertion that needs the raw Set-Cookie string we issue
 * the request with Node's http/https module directly instead.
 */
const rawRequest = (
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const payload = body !== undefined ? JSON.stringify(body) : undefined
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data })
        })
      },
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

const postJson = async (path: string, body: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let json: any = null
  try {
    json = await res.json()
  } catch {
    // no body / not json
  }
  return { status: res.status, json }
}

const getWithCookie = async (path: string, cookie?: string) => {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: cookie ? { Cookie: `mealPlannerAuthToken=${cookie}` } : {},
  })
  let json: any = null
  try {
    json = await res.json()
  } catch {
    // no body / not json
  }
  return { status: res.status, json }
}

/** Signs up a fresh throwaway user via the real HTTP endpoint and returns its email. */
const signupFreshUser = async (): Promise<string> => {
  const email = uniqueEmail()
  trackEmail(email)
  const { status } = await postJson('/api/auth/signup', { email, password: PASSWORD })
  if (status !== 201) {
    throw new Error(`Setup signup failed with status ${status} for ${email}`)
  }
  return email
}

/** Logs in via the raw http module and returns both the session cookie token and the raw response. */
const loginRaw = async (email: string) => {
  const res = await rawRequest('POST', '/api/auth/login', { email, password: PASSWORD })
  const setCookie = String(res.headers['set-cookie'])
  const cookieToken = setCookie.match(/mealPlannerAuthToken=([^;]+)/)?.[1] ?? ''
  return { res, setCookie, cookieToken }
}

afterAll(async () => {
  for (const email of createdEmails) {
    await cleanupEmail(email)
  }
})

describe.runIf(serverReachable)('auth flow', () => {
  describe('signup', () => {
    // NOTE: signup is rate-limited per-IP at 10 attempts / 15min (every HTTP
    // call counts, success or failure alike -- see server/utils/rateLimit.ts
    // and server/api/auth/signup.post.ts), so these cases are consolidated
    // into as few real HTTP calls as the test infra allows.
    it('returns 201 for a valid signup, 409 on a repeat of the same email, 400 on missing fields', async () => {
      const email = uniqueEmail()
      trackEmail(email)

      const created = await postJson('/api/auth/signup', { email, password: PASSWORD })
      expect(created.status).toBe(201)
      expect(created.json.body.email).toBe(email)

      const duplicate = await postJson('/api/auth/signup', { email, password: PASSWORD })
      expect(duplicate.status).toBe(409)

      const missingEmail = await postJson('/api/auth/signup', { password: PASSWORD })
      expect(missingEmail.status).toBe(400)

      const missingPassword = await postJson('/api/auth/signup', { email: uniqueEmail() })
      expect(missingPassword.status).toBe(400)
    })
  })

  describe('login', () => {
    let email: string

    beforeAll(async () => {
      email = await signupFreshUser()
    })

    it('returns 200 and a Set-Cookie with mealPlannerAuthToken + HttpOnly on correct credentials', async () => {
      const { res, setCookie } = await loginRaw(email)
      expect(res.statusCode).toBe(200)
      expect(setCookie).toContain('mealPlannerAuthToken')
      expect(setCookie).toMatch(/HttpOnly/i)
    })

    it('returns 401 with a generic message for wrong password, identical to the message for an unknown email', async () => {
      const wrongPassword = await postJson('/api/auth/login', { email, password: 'totally-wrong-password' })
      const unknownEmail = await postJson('/api/auth/login', { email: uniqueEmail(), password: PASSWORD })

      expect(wrongPassword.status).toBe(401)
      expect(unknownEmail.status).toBe(401)
      // The exact error text must not leak whether the email exists.
      expect(wrongPassword.json?.body?.message ?? wrongPassword.json?.message).toBe(
        unknownEmail.json?.body?.message ?? unknownEmail.json?.message,
      )
    })

    it('returns 400 when fields are missing', async () => {
      const noPassword = await postJson('/api/auth/login', { email: uniqueEmail() })
      const noEmail = await postJson('/api/auth/login', { password: PASSWORD })
      expect(noPassword.status).toBe(400)
      expect(noEmail.status).toBe(400)
    })
  })

  describe('/api/auth/me', () => {
    let email: string
    let cookieToken: string

    beforeAll(async () => {
      email = await signupFreshUser()
      const { cookieToken: token } = await loginRaw(email)
      cookieToken = token
      if (!cookieToken) {
        throw new Error('Setup login did not yield a session cookie')
      }
    })

    it('returns 200 with the correct email when called with a valid session cookie', async () => {
      const { status, json } = await getWithCookie('/api/auth/me', cookieToken)
      expect(status).toBe(200)
      expect(json.body.email).toBe(email)
    })

    it('returns 401 with no cookie', async () => {
      const { status } = await getWithCookie('/api/auth/me')
      expect(status).toBe(401)
    })

    it('returns 401 with a garbage cookie value', async () => {
      const { status } = await getWithCookie('/api/auth/me', 'totally-made-up-token-value')
      expect(status).toBe(401)
    })
  })

  describe('logout', () => {
    it('revokes the session server-side: the same cookie gets 401 from /api/auth/me afterwards', async () => {
      const email = await signupFreshUser()
      const { cookieToken } = await loginRaw(email)
      expect(cookieToken).not.toBe('')

      const meBefore = await getWithCookie('/api/auth/me', cookieToken)
      expect(meBefore.status).toBe(200)

      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `mealPlannerAuthToken=${cookieToken}` },
      })
      expect(logoutRes.status).toBe(200)

      const meAfter = await getWithCookie('/api/auth/me', cookieToken)
      expect(meAfter.status).toBe(401)
    })
  })

  describe('expired session', () => {
    it('is rejected by /api/auth/me', async () => {
      const email = await signupFreshUser()
      const { cookieToken } = await loginRaw(email)
      expect(cookieToken).not.toBe('')

      const user = await User.findOne({ where: { email } })
      expect(user).not.toBeNull()

      const session = await Session.findOne({
        where: { userId: user!.id },
        order: [['createdAt', 'DESC']],
      })
      expect(session).not.toBeNull()

      await Session.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { id: session!.id } })

      const { status } = await getWithCookie('/api/auth/me', cookieToken)
      expect(status).toBe(401)
    })
  })

  describe('cross-cutting: apiAuth middleware sanity check', () => {
    it('/api/recipe returns 401 with no cookie at all', async () => {
      const res = await fetch(`${baseUrl}/api/recipe`)
      expect(res.status).toBe(401)
    })
  })
})
