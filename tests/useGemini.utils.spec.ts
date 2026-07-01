import { describe, it, expect } from 'vitest'
import { generateWithFallback, isTransientStatus, extractText, type GeminiCallResult } from '../composables/useGemini.utils'

const ok = (text: string): GeminiCallResult => ({
  ok: true,
  status: 200,
  data: { candidates: [{ content: { parts: [{ text }] } }] },
})

const fail = (status: number): GeminiCallResult => ({ ok: false, status, data: { error: 'failed' } })

describe('generateWithFallback', () => {
  it('succeeds on the first model, first attempt', async () => {
    const calls: string[] = []
    const result = await generateWithFallback({
      models: ['A', 'B'],
      callModel: async (model) => {
        calls.push(model)
        return ok('hello')
      },
      retryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, text: 'hello' })
    expect(calls).toEqual(['A'])
  })

  it('retries the same model on a transient error before falling back', async () => {
    const calls: string[] = []
    const result = await generateWithFallback({
      models: ['A', 'B'],
      callModel: async (model) => {
        calls.push(model)
        if (model === 'A') return fail(429)
        return ok('from B')
      },
      retryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, text: 'from B' })
    expect(calls).toEqual(['A', 'A', 'B'])
  })

  it('returns all failures when every model is exhausted', async () => {
    const result = await generateWithFallback({
      models: ['A', 'B'],
      callModel: async () => fail(503),
      retryDelayMs: 0,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.failures).toHaveLength(4)
      expect(result.failures.every(f => f.status === 503)).toBe(true)
      expect(result.failures.map(f => f.model)).toEqual(['A', 'A', 'B', 'B'])
    }
  })

  it('does not retry a non-transient error on the same model', async () => {
    const calls: string[] = []
    const result = await generateWithFallback({
      models: ['A', 'B'],
      callModel: async (model) => {
        calls.push(model)
        if (model === 'A') return fail(400)
        return ok('from B')
      },
      retryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, text: 'from B' })
    expect(calls).toEqual(['A', 'B'])
  })

  it('treats a 200 response with no usable text as a failure and falls through', async () => {
    const calls: string[] = []
    const result = await generateWithFallback({
      models: ['A', 'B'],
      callModel: async (model) => {
        calls.push(model)
        if (model === 'A') return { ok: true, status: 200, data: { candidates: [] } }
        return ok('from B')
      },
      retryDelayMs: 0,
    })

    expect(result).toEqual({ ok: true, text: 'from B' })
    expect(calls).toEqual(['A', 'B'])
  })
})

describe('isTransientStatus', () => {
  it('treats 429 and 503 as transient', () => {
    expect(isTransientStatus(429)).toBe(true)
    expect(isTransientStatus(503)).toBe(true)
  })

  it('treats other statuses as non-transient', () => {
    expect(isTransientStatus(400)).toBe(false)
    expect(isTransientStatus(200)).toBe(false)
  })
})

describe('extractText', () => {
  it('extracts text from a well-formed response', () => {
    expect(extractText({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] })).toBe('hi')
  })

  it('returns undefined for a malformed or empty response', () => {
    expect(extractText({ candidates: [] })).toBeUndefined()
    expect(extractText({})).toBeUndefined()
    expect(extractText(undefined)).toBeUndefined()
  })
})
