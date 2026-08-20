import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createLastKnownGood } from '../utils/sitemap-resilience'

describe('createLastKnownGood', () => {
  it('returns fresh data on a successful fetch', async () => {
    const resolve = createLastKnownGood<string[]>(1000)
    const result = await resolve(async () => ['a', 'b'], [])
    assert.deepEqual(result, ['a', 'b'])
  })

  it('falls back to the previous successful snapshot on a transient failure', async () => {
    let clock = 0
    const resolve = createLastKnownGood<string[]>(1000, () => clock)
    const first = await resolve(async () => ['a', 'b'], [])
    assert.deepEqual(first, ['a', 'b'])

    clock += 100
    const second = await resolve(async () => {
      throw new Error('upstream down')
    }, [])
    assert.deepEqual(second, ['a', 'b'])
  })

  it('falls back to the provided fallback when there is no prior snapshot', async () => {
    const resolve = createLastKnownGood<string[]>(1000)
    const result = await resolve(async () => {
      throw new Error('first call fails')
    }, ['fallback'])
    assert.deepEqual(result, ['fallback'])
  })

  it('does not reuse a snapshot older than maxAgeMs', async () => {
    let clock = 0
    const resolve = createLastKnownGood<string[]>(1000, () => clock)
    await resolve(async () => ['a'], [])

    clock += 1001
    const result = await resolve(async () => {
      throw new Error('still down')
    }, ['fallback'])
    assert.deepEqual(result, ['fallback'])
  })

  it('recovers on the next successful fetch after a failure', async () => {
    const resolve = createLastKnownGood<string[]>(1000)
    await resolve(async () => ['a'], [])
    await resolve(async () => {
      throw new Error('down')
    }, [])
    const recovered = await resolve(async () => ['b', 'c'], [])
    assert.deepEqual(recovered, ['b', 'c'])
  })
})
