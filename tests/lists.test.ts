import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isListMediaType,
  validateListName,
  validateListDescription,
  LIST_NAME_MAX_LENGTH,
  LIST_DESCRIPTION_MAX_LENGTH,
} from '../utils/lists'

describe('isListMediaType', () => {
  it('accepts "movie"', () => {
    assert.ok(isListMediaType('movie'))
  })

  it('accepts "tv"', () => {
    assert.ok(isListMediaType('tv'))
  })

  it('rejects any other string', () => {
    assert.equal(isListMediaType('album'), false)
  })

  it('rejects null and undefined', () => {
    assert.equal(isListMediaType(null), false)
    assert.equal(isListMediaType(undefined), false)
  })
})

describe('validateListName', () => {
  it('accepts a normal name', () => {
    assert.equal(validateListName('Best of Sophie'), null)
  })

  it('rejects an empty name', () => {
    assert.notEqual(validateListName(''), null)
  })

  it('rejects a name that is only whitespace', () => {
    assert.notEqual(validateListName('   '), null)
  })

  it('accepts a name exactly at the max length', () => {
    assert.equal(validateListName('a'.repeat(LIST_NAME_MAX_LENGTH)), null)
  })

  it('rejects a name over the max length', () => {
    assert.notEqual(validateListName('a'.repeat(LIST_NAME_MAX_LENGTH + 1)), null)
  })

  it('trims surrounding whitespace before checking length', () => {
    const padded = `  ${'a'.repeat(LIST_NAME_MAX_LENGTH)}  `
    assert.equal(validateListName(padded), null)
  })
})

describe('validateListDescription', () => {
  it('accepts an empty description', () => {
    assert.equal(validateListDescription(''), null)
  })

  it('accepts a description at the max length', () => {
    assert.equal(validateListDescription('a'.repeat(LIST_DESCRIPTION_MAX_LENGTH)), null)
  })

  it('rejects a description over the max length', () => {
    assert.notEqual(validateListDescription('a'.repeat(LIST_DESCRIPTION_MAX_LENGTH + 1)), null)
  })
})
