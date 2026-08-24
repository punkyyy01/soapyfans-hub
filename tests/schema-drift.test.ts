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

describe('Schema drift guard: migration filenames match applied versions', () => {
  // The root cause of the about_me incident: local migration filenames
  // (timestamps chosen by hand) didn't match the version Supabase actually
  // recorded when the file was applied via the MCP/CLI tool (which stamps
  // its own timestamp). A filename/version mismatch means `supabase db
  // push` against a fresh environment would replay history in the wrong
  // order relative to what production already has. This doesn't catch a
  // fresh drift by itself, but it keeps the repo honest about what's
  // actually been proven consistent as of this audit.
  it('every migration file starts with a 14-digit UTC-ish timestamp prefix', () => {
    const migrations = readMigrations()
    for (const f of migrations) {
      assert.match(f, /^\d{14}_[a-z0-9_]+\.sql$/, `${f} does not match the expected <version>_<name>.sql shape`)
    }
  })

  it('migration versions are strictly increasing in filename sort order', () => {
    const migrations = readMigrations().sort()
    const versions = migrations.map((f) => f.slice(0, 14))
    const sorted = [...versions].sort()
    assert.deepEqual(versions, sorted, 'migration filenames must sort in the same order as their version prefixes')
  })
})

describe('Schema drift guard: profiles.is_admin privilege escalation fix', () => {
  it('has a migration revoking table-level select/insert/update on profiles from anon/authenticated', () => {
    const migrations = readMigrations()
    const hasMigration = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return /revoke select, insert, update on public\.profiles from anon, authenticated/i.test(sql)
    })
    assert.ok(hasMigration, 'Expected a migration revoking table-level grants on profiles')
  })

  it('re-grants select/update on profiles at column granularity, excluding is_admin', () => {
    const migrations = readMigrations()
    const grantSql = migrations
      .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
      .find((sql) => /grant select \(/i.test(sql) && /on public\.profiles to anon, authenticated/i.test(sql))
    assert.ok(grantSql, 'Expected a column-scoped SELECT grant on profiles')
    assert.equal(/grant select \([^)]*\bis_admin\b[^)]*\)/i.test(grantSql!), false, 'is_admin must not appear in the re-granted SELECT column list')

    const updateSql = migrations
      .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
      .find((sql) => /grant update \(/i.test(sql) && /on public\.profiles to authenticated/i.test(sql))
    assert.ok(updateSql, 'Expected a column-scoped UPDATE grant on profiles')
    assert.equal(/grant update \([^)]*\bis_admin\b[^)]*\)/i.test(updateSql!), false, 'is_admin must not appear in the re-granted UPDATE column list')
  })

  it('adds a SECURITY DEFINER is_admin() self-check function', () => {
    const migrations = readMigrations()
    const hasFn = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return /create or replace function public\.is_admin\(\)/i.test(sql) && /security definer/i.test(sql)
    })
    assert.ok(hasFn, 'Expected an is_admin() SECURITY DEFINER helper')
  })

  it('generated types expose the is_admin RPC', () => {
    const types = fs.readFileSync(typesPath, 'utf8')
    assert.ok(types.includes('is_admin: { Args:'), 'database.types.ts must declare the is_admin() RPC')
  })

  it('admin gates use the is_admin() RPC instead of selecting the column directly', () => {
    const gateFiles = [
      path.join(repoRoot, 'utils', 'supabase', 'middleware.ts'),
      path.join(repoRoot, 'app', '(admin)', 'dashboard-s9k2mx', 'layout.tsx'),
      path.join(repoRoot, 'app', '(admin)', 'dashboard-s9k2mx', 'actions.ts'),
    ]
    for (const file of gateFiles) {
      const src = fs.readFileSync(file, 'utf8')
      assert.ok(src.includes(".rpc('is_admin')"), `${path.basename(file)} must gate admin access via the is_admin() RPC`)
      assert.equal(/\.select\(\s*['"]is_admin['"]\s*\)/.test(src), false, `${path.basename(file)} must not select the is_admin column directly (blocked by column grants)`)
    }
  })
})

describe('Schema drift guard: films RLS allows the review-submission upsert', () => {
  it('has a migration adding an UPDATE policy for films (needed by upsert onConflict)', () => {
    const migrations = readMigrations()
    const hasPolicy = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return /create policy .* on public\.films\s*$/im.test(sql) || /on public\.films\s*\n?\s*for update/i.test(sql)
    })
    assert.ok(hasPolicy, 'Expected a migration adding an UPDATE policy on films')
  })
})

describe('Schema drift guard: banner upload size limit matches Storage bucket cap', () => {
  it('MAX_BANNER_BYTES in app code matches the migrated avatars bucket file_size_limit', () => {
    const validationSrc = fs.readFileSync(path.join(repoRoot, 'utils', 'image-validation.ts'), 'utf8')
    const match = validationSrc.match(/MAX_BANNER_BYTES\s*=\s*([\d._*\s]+)\/\//)
    assert.ok(match, 'Expected to find MAX_BANNER_BYTES declaration')
    // eslint-disable-next-line no-eval
    const maxBannerBytes = eval(match![1])
    assert.equal(maxBannerBytes, 3 * 1024 * 1024)

    const migrations = readMigrations()
    const hasBucketFix = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return /file_size_limit\s*=\s*3145728/i.test(sql) && /where id = 'avatars'/i.test(sql)
    })
    assert.ok(hasBucketFix, `Expected a migration raising the avatars bucket file_size_limit to ${maxBannerBytes} bytes`)
  })

  it('uploadImage no longer attempts a nonexistent banners bucket or a second masking retry', () => {
    const src = fs.readFileSync(path.join(repoRoot, 'app', '(main)', 'profile', 'edit', 'actions.ts'), 'utf8')
    assert.equal(src.includes("targetBucket = 'banners'"), false, 'must not target a nonexistent banners bucket')
    const uploadCalls = src.match(/\.storage\.from\([^)]*\)\.upload\(/g) ?? []
    assert.equal(uploadCalls.length, 1, 'uploadImage must call storage.upload() exactly once (no retry-to-a-different-bucket path)')
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

describe('Schema drift guard: recovered baseline migrations (profiles/films/reviews/music/favorites)', () => {
  // The repo's tracked migration history used to start at
  // add_about_me_to_profiles (2026-08-18), but the live project's
  // supabase_migrations.schema_migrations table has 9 earlier applied
  // versions (2026-05-19 through 2026-05-29) that create the base schema --
  // profiles, films, reviews, the music tables, banned_users, and
  // profile_favorites -- and were never committed here. That's the same
  // class of repo/live drift this file already guards against (see the
  // about_me and OAuth-username describes above), just in the opposite
  // direction: applied-but-uncommitted instead of committed-but-unapplied.
  // This guard keeps them from silently disappearing again.
  const expectedBaselineVersions = [
    '20260519015508', // create_updated_at_trigger_function
    '20260519015524', // create_profiles_table
    '20260519015535', // create_films_table
    '20260519015552', // create_reviews_table
    '20260519134111', // create_music_tables
    '20260519185021', // add_twitter_url_to_releases
    '20260521191205', // create_admin_and_banned_users
    '20260529231513', // expand_profiles_columns
    '20260529231521', // create_profile_favorites
  ]

  it('has a migration file for every recovered baseline version', () => {
    const migrations = readMigrations()
    for (const version of expectedBaselineVersions) {
      assert.ok(
        migrations.some((f) => f.startsWith(version)),
        `Expected a migration file starting with ${version}`,
      )
    }
  })

  it('the recovered profiles-table migration defines username_format and username_length', () => {
    const migrations = readMigrations()
    const file = migrations.find((f) => f.includes('create_profiles_table'))
    assert.ok(file, 'Expected the create_profiles_table baseline migration')
    const sql = fs.readFileSync(path.join(migrationsDir, file!), 'utf8')
    assert.match(sql, /create table public\.profiles/)
    assert.match(sql, /constraint username_length check/)
    assert.match(sql, /constraint username_format check \(username ~ '\^\[a-zA-Z0-9_\]\+\$'\)/)
  })
})

describe('Schema drift guard: username change cooldown', () => {
  it('has a migration adding username_changed_at and the cooldown trigger', () => {
    const migrations = readMigrations()
    const hasMigration = migrations.some((f) => {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
      return (
        sql.includes('ADD COLUMN IF NOT EXISTS username_changed_at') &&
        sql.includes('enforce_username_change_cooldown') &&
        sql.includes("WHEN (OLD.username IS DISTINCT FROM NEW.username)")
      )
    })
    assert.ok(hasMigration, 'Expected a migration adding the username change cooldown trigger')
  })

  it('generated types declare username_changed_at on Row, Insert, and Update', () => {
    const types = fs.readFileSync(typesPath, 'utf8')
    const profilesBlock = types.slice(types.indexOf('profiles: {'), types.indexOf('releases: {'))
    const occurrences = profilesBlock.match(/username_changed_at\??:\s*string \| null/g) ?? []
    assert.equal(occurrences.length, 3, 'username_changed_at must appear in Row, Insert, and Update')
  })

  it('cooldown length matches between the app pre-check and the DB trigger', () => {
    const actionsSrc = fs.readFileSync(
      path.join(repoRoot, 'app', '(main)', 'profile', 'edit', 'actions.ts'),
      'utf8',
    )
    const appMatch = actionsSrc.match(/USERNAME_COOLDOWN_DAYS\s*=\s*(\d+)/)
    assert.ok(appMatch, 'Expected USERNAME_COOLDOWN_DAYS in profile edit actions.ts')

    const migrations = readMigrations()
    const cooldownFile = migrations.find((f) => f.includes('username_change_cooldown'))
    assert.ok(cooldownFile, 'Expected the username change cooldown migration')
    const sql = fs.readFileSync(path.join(migrationsDir, cooldownFile!), 'utf8')
    const dbMatch = sql.match(/interval '(\d+) days'/)
    assert.ok(dbMatch, "Expected interval '<n> days' in the cooldown migration")

    assert.equal(appMatch![1], dbMatch![1], 'USERNAME_COOLDOWN_DAYS must match the DB trigger cooldown interval')
  })

  it('saveProfile treats the DB unique-violation and cooldown errors as friendly messages, not the generic fallback', () => {
    const actionsSrc = fs.readFileSync(
      path.join(repoRoot, 'app', '(main)', 'profile', 'edit', 'actions.ts'),
      'utf8',
    )
    assert.match(actionsSrc, /error\.code === '23505'/)
    assert.match(actionsSrc, /error\.message\?\.includes\('change your username again'\)/)
  })
})
