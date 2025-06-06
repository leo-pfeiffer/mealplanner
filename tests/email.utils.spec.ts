import { describe, it, expect } from 'vitest'
import { cleanIngredientName, groupedIngredients } from '../server/api/internal/email.utils'

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

describe('groupedIngredients', () => {
  it('groups identical ingredients', () => {
    const result = groupedIngredients(['Apple', 'apple', 'banana'])
    expect(result).toEqual([
      ['apple', 2],
      ['banana', 1],
    ])
  })

  it('cleans ingredient names before grouping', () => {
    const result = groupedIngredients(['!!Milk', 'milk ', 'milk??'])
    expect(result).toEqual([
      ['milk', 3],
    ])
  })
})
