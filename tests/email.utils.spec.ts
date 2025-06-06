import { describe, it, expect } from 'vitest'
import { cleanIngredientName } from '../server/api/internal/email.post'

describe('cleanIngredientName', () => {
  it('lowercases the name', () => {
    expect(cleanIngredientName('Milk')).toBe('milk')
  })

  it('removes non-alphanumeric characters', () => {
    expect(cleanIngredientName('Milk?!')).toBe('milk')
  })

  it('collapses multiple spaces', () => {
    expect(cleanIngredientName('milk   chocolate')).toBe('milk chocolate')
  })
})
