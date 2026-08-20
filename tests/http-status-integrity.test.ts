import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

// Regression guard for a real production bug: any `loading.tsx` (or a
// route-group `loading.tsx`) anywhere in a page's ancestor chain forces
// Next.js to stream that page. Once streaming starts, the response has
// already committed to HTTP 200, so a later notFound()/redirect() call
// inside the page can only change the rendered body, not the status code --
// every "404" or "308" becomes a 200 wearing a 404/redirect costume.
//
// Root cause, verified by elimination against a real production build:
// app/(main)/films/loading.tsx, app/(main)/films/[id]/loading.tsx,
// app/(main)/tv/[id]/loading.tsx, app/(main)/profile/[username]/loading.tsx,
// and app/(main)/loading.tsx were each ancestors of a route that calls
// notFound() or permanentRedirect(), and each one alone was sufficient to
// downgrade that route's real status to 200. Removing all of them (while
// leaving the root layout's own Suspense-wrapped Navbar/Footer untouched --
// proven NOT to be a cause) restored correct 404/308 status codes.
//
// This test doesn't hardcode "these five files must not exist" -- it scans
// for the actual hazard (a page that can produce a non-200 result, with a
// loading.tsx anywhere above it) so a newly added route can't reintroduce
// the same bug undetected.

const repoRoot = path.resolve(__dirname, '..')
const appDir = path.join(repoRoot, 'app')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
    } else if (entry.name === 'page.tsx') {
      out.push(full)
    }
  }
  return out
}

function callsNotFoundOrRedirect(pageContent: string): boolean {
  return (
    /\bnotFound\s*\(/.test(pageContent) ||
    /\bpermanentRedirect\s*\(/.test(pageContent) ||
    /\bredirect\s*\(/.test(pageContent)
  )
}

function ancestorDirsWithinApp(pageDir: string): string[] {
  const ancestors: string[] = []
  let dir = pageDir
  while (dir.startsWith(appDir)) {
    ancestors.push(dir)
    if (dir === appDir) break
    dir = path.dirname(dir)
  }
  return ancestors
}

describe('HTTP status integrity: notFound()/redirect() routes must not stream', () => {
  const pages = walk(appDir)
  const statusSensitivePages = pages.filter((p) => callsNotFoundOrRedirect(fs.readFileSync(p, 'utf8')))

  it('finds at least the known status-sensitive routes (sanity check the scan itself works)', () => {
    const relative = statusSensitivePages.map((p) => path.relative(repoRoot, p))
    assert.ok(relative.some((p) => p.includes(path.join('films', '[id]', 'page.tsx'))))
    assert.ok(relative.some((p) => p.includes(path.join('profile', '[username]', 'page.tsx'))))
  })

  for (const pagePath of statusSensitivePages) {
    const relativePage = path.relative(repoRoot, pagePath)

    it(`${relativePage}: no loading.tsx in its ancestor chain (would lock the response to 200)`, () => {
      const pageDir = path.dirname(pagePath)
      const offendingLoadingFiles = ancestorDirsWithinApp(pageDir)
        .map((dir) => path.join(dir, 'loading.tsx'))
        .filter((f) => fs.existsSync(f))
        .map((f) => path.relative(repoRoot, f))

      assert.deepEqual(
        offendingLoadingFiles,
        [],
        `${relativePage} calls notFound()/redirect() but has loading.tsx ancestor(s) that would force streaming and lock its status to 200: ${offendingLoadingFiles.join(', ')}`,
      )
    })
  }
})
