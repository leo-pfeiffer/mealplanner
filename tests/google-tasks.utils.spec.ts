import { describe, it, expect } from 'vitest'
import {
  buildClassifyPrompt,
  buildRepairPrompt,
  parseClassifiedIngredients,
  buildTasklistTitle,
} from '../server/api/internal/google-tasks.utils'

describe('parseClassifiedIngredients', () => {
  it('parses a valid classified object', () => {
    const result = parseClassifiedIngredients('{"Produce": ["Apples", "Carrots"], "Dairy": ["Milk"]}')
    expect(result).toEqual({ Produce: ['Apples', 'Carrots'], Dairy: ['Milk'] })
  })

  it('rejects a top-level array', () => {
    expect(parseClassifiedIngredients('["Produce", "Dairy"]')).toBeNull()
  })

  it('rejects a nested object as a value', () => {
    expect(parseClassifiedIngredients('{"Produce": {"a": "Apples"}}')).toBeNull()
  })

  it('rejects a non-string array item', () => {
    expect(parseClassifiedIngredients('{"Produce": ["Apples", 5]}')).toBeNull()
  })

  it('rejects an empty array for a key', () => {
    expect(parseClassifiedIngredients('{"Produce": []}')).toBeNull()
  })

  it('rejects an empty or whitespace-only string item', () => {
    expect(parseClassifiedIngredients('{"Produce": [""]}')).toBeNull()
    expect(parseClassifiedIngredients('{"Produce": ["   "]}')).toBeNull()
  })

  it('rejects an empty object', () => {
    expect(parseClassifiedIngredients('{}')).toBeNull()
  })

  it('returns null for malformed JSON without throwing', () => {
    expect(parseClassifiedIngredients('{"Produce": ["Apples",]}')).toBeNull()
    expect(parseClassifiedIngredients('{Produce: ["Apples"]}')).toBeNull()
    expect(parseClassifiedIngredients('{"Produce": ["Apples"')).toBeNull()
  })

  it('rejects a top-level JSON primitive', () => {
    expect(parseClassifiedIngredients('"hello"')).toBeNull()
    expect(parseClassifiedIngredients('42')).toBeNull()
    expect(parseClassifiedIngredients('null')).toBeNull()
    expect(parseClassifiedIngredients('true')).toBeNull()
  })
})

describe('buildClassifyPrompt', () => {
  it('includes every ingredient name', () => {
    const prompt = buildClassifyPrompt(['Apples', 'Milk', 'Chicken'])
    expect(prompt).toContain('Apples')
    expect(prompt).toContain('Milk')
    expect(prompt).toContain('Chicken')
  })

  it('mentions JSON and does not ask for HTML/markdown', () => {
    const prompt = buildClassifyPrompt(['Apples'])
    expect(prompt).toContain('JSON')
    expect(prompt).not.toContain('HTML')
    expect(prompt.toLowerCase()).not.toContain('markdown list')
  })
})

describe('buildRepairPrompt', () => {
  it('includes the broken text verbatim', () => {
    const broken = '{"Produce": ["Apples",]}'
    const prompt = buildRepairPrompt(broken)
    expect(prompt).toContain(broken)
  })

  it('mentions JSON', () => {
    expect(buildRepairPrompt('not json')).toContain('JSON')
  })
})

describe('buildTasklistTitle', () => {
  it('returns an exact match for a fixed date and name', () => {
    const title = buildTasklistTitle('Weekly Plan', new Date('2026-06-30T14:32:05.123Z'))
    expect(title).toBe('Weekly Plan - 2026-06-30T14:32:05.123Z')
  })

  it('sorts chronologically as strings for increasing dates', () => {
    const earlier = buildTasklistTitle('Weekly Plan', new Date('2026-06-30T14:32:05.123Z'))
    const later = buildTasklistTitle('Weekly Plan', new Date('2026-07-01T09:00:00.000Z'))
    expect(earlier < later).toBe(true)
  })
})
