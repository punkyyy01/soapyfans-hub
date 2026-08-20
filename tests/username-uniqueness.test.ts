import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Regression guard for the case-insensitive username uniqueness invariant:
// "any two non-null usernames cannot differ only by case." The invariant
// itself is enforced by the DB (no live-DB test harness exists in this repo
// -- see tests/profile.test.ts for the pure-function coverage of canonical
// lookup/redirect behavior, which is unaffected by this migration). This
// test only guards the migration file itself: that it establishes the
// case-insensitive constraint, replaces (not duplicates) the old
// case-sensitive one, and refuses to run over existing collisions rather
// than silently mutating usernames.

const repoRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations')

function readMigrations(): string {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n')
}

describe('Case-insensitive username uniqueness migration', () => {
  const allMigrations = readMigrations()

  it('drops the old case-sensitive UNIQUE(username) constraint', () => {
    assert.match(allMigrations, /DROP CONSTRAINT profiles_username_key/)
  })

  it('creates a unique index on lower(username)', () => {
    assert.match(allMigrations, /CREATE UNIQUE INDEX profiles_username_lower_key ON public\.profiles \(lower\(username\)\)/)
  })

  it('refuses to run over an existing case-variant collision instead of mutating usernames', () => {
    const migrationFile = fs
      .readdirSync(migrationsDir)
      .find((f) => f.includes('case_insensitive_username_uniqueness'))
    assert.ok(migrationFile, 'expected a case-insensitive username uniqueness migration file to exist')

    const content = fs.readFileSync(path.join(migrationsDir, migrationFile!), 'utf8')
    assert.match(content, /RAISE EXCEPTION/)
    assert.match(content, /GROUP BY lower\(username\)/)
    assert.match(content, /HAVING count\(\*\) > 1/)

    // The collision guard must run before the destructive DROP CONSTRAINT,
    // not after -- otherwise a collision would already have broken the
    // table's uniqueness invariant before the migration aborts.
    const guardIndex = content.indexOf('RAISE EXCEPTION')
    const dropIndex = content.indexOf('DROP CONSTRAINT')
    assert.ok(guardIndex >= 0 && dropIndex >= 0 && guardIndex < dropIndex)

    // No UPDATE/DELETE against profiles.username -- this migration must
    // never rename or remove a user's existing username automatically.
    assert.doesNotMatch(content, /UPDATE\s+public\.profiles\s+SET\s+username/i)
    assert.doesNotMatch(content, /DELETE\s+FROM\s+public\.profiles/i)
  })
})
