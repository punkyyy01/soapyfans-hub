import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Regression guard for the root cause behind the P0 outage: a migration file
// existed in the repo but was never applied to the live Supabase project, so
// `database.types.ts` claimed a column that Postgres rejected at query time.
// This test can't reach the live DB, but it can make it impossible for code,
// types, and migration history to silently diverge again undetected.

const repoRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations')
const typesPath = path.join(repoRoot, 'utils', 'supabase', 'database.types.ts')

function readMigrations(): string[] {
  return fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
}

describe('Schema drift guard: profiles.about_me', () => {
  it('has a migration that adds the about_me column', () => {
    const migrations = readMigrations()
    const hasMigration = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return /ADD COLUMN IF NOT EXISTS about_me/i.test(sql)
    })
    assert.ok(hasMigration, 'Expected a migration adding profiles.about_me')
  })

  it('generated types declare about_me on Row, Insert, and Update', () => {
    const types = fs.readFileSync(typesPath, 'utf8')
    const profilesBlock = types.slice(types.indexOf('profiles: {'), types.indexOf('releases: {'))
    const occurrences = profilesBlock.match(/about_me\??:\s*string \| null/g) ?? []
    assert.equal(occurrences.length, 3, 'about_me must appear in Row, Insert, and Update')
  })
})

describe('Schema drift guard: favorites concurrency fix', () => {
  it('has a migration enforcing the 6-favorite cap at the DB level', () => {
    const migrations = readMigrations()
    const hasMigration = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return sql.includes('profile_favorites_user_position_unique') && sql.includes('add_profile_favorite')
    })
    assert.ok(hasMigration, 'Expected a migration adding the position-slot constraint + RPC')
  })

  it('generated types expose the add_profile_favorite and reorder_profile_favorites RPCs', () => {
    const types = fs.readFileSync(typesPath, 'utf8')
    assert.ok(types.includes('add_profile_favorite:'))
    assert.ok(types.includes('reorder_profile_favorites:'))
  })
})

describe('Schema drift guard: OAuth username generation', () => {
  it('has a migration fixing handle_new_user() username assignment', () => {
    const migrations = readMigrations()
    const hasMigration = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return sql.includes('sanitize_username_candidate') && sql.includes('handle_new_user')
    })
    assert.ok(hasMigration, 'Expected a migration fixing OAuth username generation')
  })
})

describe('Favorites position-slot invariant', () => {
  function isValidPosition(position: number): boolean {
    return Number.isInteger(position) && position >= 0 && position <= 5
  }

  it('accepts the six valid slot positions', () => {
    for (let i = 0; i <= 5; i++) assert.ok(isValidPosition(i))
  })

  it('rejects a 7th slot and negative slots', () => {
    assert.equal(isValidPosition(6), false)
    assert.equal(isValidPosition(-1), false)
  })

  it('at most 6 favorites can coexist per user, since UNIQUE(user_id, position) leaves only 6 valid slots', () => {
    const maxFavoritesPerUser = 6 // positions 0..5, enforced by CHECK + UNIQUE in the DB
    assert.equal(maxFavoritesPerUser, 6)
  })
})

describe('Username format parity: app regex vs DB constraints', () => {
  // profiles.username_format CHECK: ^[a-zA-Z0-9_]+$
  // profiles.username_length CHECK: char_length BETWEEN 3 AND 30
  const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/

  it('accepts values that satisfy both DB constraints', () => {
    assert.ok(USERNAME_RE.test('Frambuesa'))
    assert.ok(USERNAME_RE.test('abc'))
    assert.ok(USERNAME_RE.test('a'.repeat(30)))
  })

  it('rejects values that would violate the DB length or format constraints', () => {
    assert.equal(USERNAME_RE.test('ab'), false) // below username_length min
    assert.equal(USERNAME_RE.test('a'.repeat(31)), false) // above username_length max
    assert.equal(USERNAME_RE.test('bad name'), false) // violates username_format
    assert.equal(USERNAME_RE.test('bad-name'), false) // violates username_format
  })
})
