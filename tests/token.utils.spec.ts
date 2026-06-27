import { describe, it, expect } from 'vitest'
import { getTokenFromHeaderString, getTokenFromCookieString, SESSION_COOKIE_NAME } from '../server/utils/token'

describe('getTokenFromHeaderString', () => {
  it('extracts the token from a Bearer header', () => {
    expect(getTokenFromHeaderString('Bearer abc123')).toBe('abc123')
  })

  it('returns null for non-Bearer auth types', () => {
    expect(getTokenFromHeaderString('Basic abc123')).toBeNull()
  })

  it('returns null when no token is present', () => {
    expect(getTokenFromHeaderString('Bearer')).toBeNull()
  })
})

describe('getTokenFromCookieString', () => {
  it('extracts the token from a single cookie', () => {
    expect(getTokenFromCookieString(`${SESSION_COOKIE_NAME}=abc123`)).toBe('abc123')
  })

  it('extracts the token when other cookies are present', () => {
    expect(getTokenFromCookieString(`foo=bar; ${SESSION_COOKIE_NAME}=abc123; baz=qux`)).toBe('abc123')
  })

  it('returns null when the cookie is absent', () => {
    expect(getTokenFromCookieString('foo=bar; baz=qux')).toBeNull()
  })
})
