# About Page Redesign — Design Spec

Date: 2026-08-17
Status: Superseded by [2026-08-17-about-page-editorial-redesign-design.md](./2026-08-17-about-page-editorial-redesign-design.md)

> This spec restyled the existing six-section shape (masthead / gallery grid /
> biography / timeline list / press list / footnote) without changing its
> underlying structure or content organization. A follow-up brief asked for a
> genuinely different narrative architecture, not a restyle — see the
> superseding spec.

## Problem

`app/(main)/about/page.tsx` currently reuses Home's visual language almost
exactly: a full-viewport (88vh) hero with a dominant color-tinted portrait,
a huge display title, a CTA-style link row, and a full-bleed background
photo behind the biography. The result is that About is visually louder
than Home, which is wrong at a product level — Home is the entry point to
the archive, About is a chapter within it.

## Concept

About is **a biographical dossier inside the archive**, not a second
landing page. Purpose: UNDERSTAND ("who is Sophie and how did she get
here?"), distinct from Home (DISCOVER), Filmography (BROWSE), and Music
(LISTEN/EXPLORE). Same design system as the rest of the site (colors,
type roles, `Badge`/`Reveal`/`PageContainer`, border/focus treatment) —
different composition, density, and rhythm. No hero structure, no CTA
pattern, no full-viewport sections.

## Architecture

Six sections, full rewrite of `app/(main)/about/page.tsx`:

```
01 Archive Masthead   — compact, content-height header (not 88vh hero)
02 Portraits          — "Contact Sheet" composition, existing lightbox reused
03 Biography          — dossier-width text + open metadata sidebar (no card)
04 Career Timeline    — existing mono-year divide-y list, Yellowjackets toned down
05 Recognition/Press  — same list pattern, tightened into explicit grid columns
06 Archive Footnote   — small text-link nav + disclaimer, replaces big CTA block
```

## 01 — Archive Masthead

- No forced viewport height. Height follows content (generous padding
  instead of `min-h-[88vh]`).
- Eyebrow (mono, amber): `Biographical Dossier · Case File No. 001`.
- Title: single line "Sophie Thatcher", `clamp(2.6rem, 5vw, 4.2rem)`,
  `var(--text-primary)` only — no gradient, glow, italic, or color-split
  words. Roughly half the size of the current 7.5rem two-line hero title.
- One-line editorial dek (serif), replacing the current two-sentence bio
  paragraph in the masthead.
- Documentary metadata row (mono): Born / Origin / Age — kept as-is, it
  already reads as archival metadata.
- Portrait: single `aspect-[3/4]` frame, ~30% width on desktop, offset
  right and slightly down (asymmetric placement, not centered/dominant).
  Hairline border (`border-subtle`). **No** amber color-mix overlay, no
  full-bleed edge-to-edge treatment.
- **No CTA row in the masthead.** Instagram/YouTube links move to the
  Archive Footnote (constraint #1 from approval).
- Section closes with a thin `border-subtle` rule.

## 02 — Portraits / Visual Record

"Contact Sheet" composition (user-selected over Vertical Filmstrip and
Asymmetric Editorial Grid):

- One larger lead portrait (tall cell, e.g. spans 2 rows) + a tighter grid
  of supporting stills arranged beside/below it.
- `PL. 01`–`PL. 0N` mono plate labels in a corner of each frame — subtle
  (small, low-contrast, e.g. `text-muted` at `0.6rem`), the photograph
  remains the primary visual element (constraint #3).
- Hairline borders, minimal/no hover vignette (reduce from the current
  `PhotoGallery` grid's stronger hover treatment to match the "archival
  photography, not gallery-component-demo" brief).
- **Lightbox is untouched**: same open/close, ArrowLeft/ArrowRight,
  Escape, scroll-lock, and counter behavior as today (constraint: do not
  change `PhotoGallery` lightbox behavior). Implementation approach: add a
  new grid/composition layer to `PhotoGallery` (e.g. a `layout` prop or an
  internal grid-position map) that renders the same `photos` array through
  the same `active`/`setActive` state and the same lightbox JSX — only the
  *grid markup and cell sizing* changes, not the interaction logic.

## 03 — Biography

- Full-bleed background portrait removed entirely.
- Two-column dossier layout via `PageContainer size="dossier"`
  (`max-w-4xl`, already defined in `components/ui/PageContainer.tsx`):
  - Left (~2fr): biography text, content unchanged (Chicago, Evanston,
    family of artists, LDS quote, Los Angeles, acting/music/art practice)
    — serif lead paragraph, body paragraphs, existing pull-quote treatment
    kept as-is (it's already restrained: italic + amber left border, no
    glow).
  - Right (~1fr): **open editorial column, not a card/surface**
    (constraint #2 — no `surface-*` class, no background, no border box
    around it) — a thin vertical divider (`border-subtle`) separates it
    from the text column. Contains short documentary metadata lines:
    `Born · Chicago`, `Raised · Evanston`, `Actor`, `Musician`,
    `Visual Artist` — mono/eyebrow styling consistent with the masthead
    metadata.

## 04 — Career Timeline

- Keep the existing structure: mono year + category on the left, title +
  description on the right, `divide-y` list, no outer card.
- Change: remove the tinted background block and rounded-card treatment
  currently applied to the Yellowjackets row. Replace with a heavier left
  border rule + the existing `Badge` — no background color change, no
  different card shape from the other rows.

## 05 — Recognition & Press

- Keep the existing editorial list pattern (year / title / note / type).
- Tighten into explicit CSS grid columns (year — title+note — type)
  instead of the current `flex-wrap` layout, for a crisper archival-table
  read. Content unchanged.

## 06 — Archive Footnote

- Replace the current two-`Button` CTA block ("Browse Filmography →" /
  "Music Archive →" as large pill buttons) entirely.
- Small text-link row: `Explore the archive` — `Filmography` / `Music` as
  plain inline links, not buttons.
- Instagram/YouTube links (moved from the masthead) live here too, same
  small text-link treatment.
- Disclaimer line reused **verbatim** from `components/ui/Footer.tsx`:
  "An unofficial fan archive celebrating the work and artistry of actress
  and musician Sophie Thatcher across film, television, and music." — not
  new copy.
- Discreet: small type, muted color, sits above the global `Footer`
  without visually competing with it.

## Non-goals (explicit, from approval)

- No new CTA patterns (no large pill buttons, no primary/secondary button
  pairs).
- No gradients, glows, or decorative effects anywhere in the new
  composition.
- No change to `PhotoGallery`'s lightbox interaction logic.
- No mobile-specific redesign pass (desktop-first per brief; must not
  create layouts that are impossible to later adapt — avoid fixed
  heights/rigid absolute positioning).
- No changes to Home, Filmography, Music, Film/TV Detail, Profile, Auth,
  Database, or TMDB architecture.
- No new content — existing biography/timeline/recognition data is
  preserved and reorganized, not rewritten or trimmed.

## Components

- `app/(main)/about/page.tsx` — full rewrite (Server Component, same TMDB
  data fetching: `getPersonImages`, `getPortraitUrls`, `getTmdbImageUrl`;
  same `revalidate = 3600`; same JSON-LD `buildWebPageSchema` call).
- `components/media/PhotoGallery.tsx` — extended with a new contact-sheet
  grid composition; lightbox state/handlers/JSX unchanged. Only consumer
  is About, so this is safe to extend without a compatibility shim.
- Reuses without modification: `Reveal`, `PageContainer` (`size="dossier"`),
  `Badge`.
- No new client-side dependencies. `PhotoGallery` stays the only Client
  Component; everything else in the new page stays a Server Component,
  matching the current file's approach.

## Data Flow

Unchanged from the current implementation: `getPersonImages()` (TMDB,
24h cache) → `getPortraitUrls()` for the masthead portrait →  filtered/
sorted `imagesData.profiles` for the contact-sheet gallery. `TIMELINE` and
`RECOGNITION` stay as local const arrays with identical content (only
the Yellowjackets highlight *styling* changes, not the data shape).

## Accessibility

- Heading hierarchy preserved: one `h1` (masthead title), `h2` per
  section.
- All images keep meaningful `alt` text (portraits) or empty `alt=""` for
  decorative use, matching current conventions.
- Lightbox: unchanged — already has `role="dialog"`, `aria-modal`,
  `aria-label`, keyboard nav, and a labelled counter; verify this still
  holds after the grid markup change.
- Focus-visible ring (`focus-ring` utility) preserved on all interactive
  elements (gallery buttons, footnote links).
- Contrast: sidebar/footnote text stays on the existing `text-secondary`/
  `text-muted` tokens, already WCAG AA-verified in `globals.css`.

## Performance

- No new dependencies.
- `next/image` continues to be used for all photography with appropriate
  `sizes`.
- Server Components by default; `PhotoGallery` remains the only
  `'use client'` boundary, unchanged from today.
- Existing 3600s ISR revalidation and TMDB 24h `unstable_cache` unchanged.

## Testing / Verification

- `npm run typecheck`, `npm test`, `npm run build` must all pass; no
  existing tests should need modification (About page has no dedicated
  test file today — confirmed via repo search).
- Manual verification: run `npm run dev`, visually compare `/` and
  `/about` side by side against the checklist in the original brief
  (§33): About must not read as "another Home," must not out-impact
  Home, must not read as a dashboard or portfolio, must read as an
  editorial dossier; photography must read as content not decoration;
  timeline/recognition must read as archive documentation.
- Lightbox regression check: open/close, next/prev, Escape, keyboard
  arrows, counter, scroll-lock — confirm unchanged behavior after the
  grid markup change.

## Deliverable

`docs/about-redesign-final.md`, per the sections specified in the
original brief (Concept, Architecture, Masthead, Portraits, Biography,
Timeline, Recognition, Archive Footnote, Shared Design System,
Accessibility, Performance, Verification, Remaining Issues).
