import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isUuid,
  resolveCanonicalProfileSlug,
  profilePath,
  escapeIlike,
} from '../utils/profile'

describe('Profile canonicalization', () => {
  const UUID = '550e8400-e29b-41d4-a716-446655440000'

  it('isUuid recognizes a UUID regardless of case', () => {
    assert.ok(isUuid(UUID))
    assert.ok(isUuid(UUID.toUpperCase()))
    assert.equal(isUuid('testuser'), false)
    assert.equal(isUuid('not-a-real-uuid'), false)
    assert.equal(isUuid(''), false)
  })

  it('resolveCanonicalProfileSlug prefers the stored username', () => {
    const slug = resolveCanonicalProfileSlug({ id: UUID, username: 'testuser' })
    assert.equal(slug, 'testuser')
  })

  it('resolveCanonicalProfileSlug falls back to id when username is null (no invented username)', () => {
    const slug = resolveCanonicalProfileSlug({ id: UUID, username: null })
    assert.equal(slug, UUID)
  })

  it('canonical slug is independent of the casing the profile was requested with', () => {
    // /profile/TestUser and /profile/TESTUSER both resolve the same DB row;
    // the canonical slug must be identical regardless of which alias found it.
    const profile = { id: UUID, username: 'testuser' }
    assert.equal(resolveCanonicalProfileSlug(profile), 'testuser')
    // The requested casing never leaks into the resolved slug:
    assert.notEqual(resolveCanonicalProfileSlug(profile), 'TestUser')
    assert.notEqual(resolveCanonicalProfileSlug(profile), 'TESTUSER')
  })

  it('profilePath builds an encoded /profile/<slug> path', () => {
    assert.equal(profilePath('testuser'), '/profile/testuser')
    assert.equal(profilePath(UUID), `/profile/${UUID}`)
    // Defensive: any slug containing characters requiring URL encoding is
    // still encoded correctly, even though DB username_format blocks these.
    assert.equal(profilePath('weird name/slash'), '/profile/weird%20name%2Fslash')
  })

  it('escapeIlike escapes ILIKE wildcard/escape characters used in the username lookup', () => {
    assert.equal(escapeIlike('test_user'), 'test\\_user')
    assert.equal(escapeIlike('test%user'), 'test\\%user')
    assert.equal(escapeIlike('back\\slash'), 'back\\\\slash')
    assert.equal(escapeIlike('plainuser'), 'plainuser')
  })
})

describe('Alias -> canonical redirect decision', () => {
  // Mirrors the exact comparison app/(main)/profile/[username]/page.tsx makes:
  // requested slug vs. resolveCanonicalProfileSlug(profile). A mismatch means
  // "redirect", a match means "render as-is".
  function shouldRedirect(requested: string, profile: { id: string; username: string | null }): boolean {
    return resolveCanonicalProfileSlug(profile) !== requested
  }

  const profile = { id: '550e8400-e29b-41d4-a716-446655440000', username: 'testuser' }

  it('exact canonical username request does not redirect', () => {
    assert.equal(shouldRedirect('testuser', profile), false)
  })

  it('case-mismatched username request redirects', () => {
    assert.equal(shouldRedirect('TestUser', profile), true)
    assert.equal(shouldRedirect('TESTUSER', profile), true)
  })

  it('UUID request for a profile that has a username redirects', () => {
    assert.equal(shouldRedirect(profile.id, profile), true)
  })

  it('UUID request for a profile with no username does not redirect (nothing to converge on)', () => {
    const noUsername = { id: profile.id, username: null }
    assert.equal(shouldRedirect(profile.id, noUsername), false)
  })
})
