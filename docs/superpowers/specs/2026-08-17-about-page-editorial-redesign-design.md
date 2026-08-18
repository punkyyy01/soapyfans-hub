# About Page Editorial Redesign — Design Spec

Date: 2026-08-17
Status: Approved
Supersedes: [2026-08-17-about-redesign-design.md](./2026-08-17-about-redesign-design.md)

## Problem

`app/(main)/about/page.tsx` mirrors Home almost exactly: portrait-right hero,
huge display title, pill CTAs, a 12-photo gallery of near-identical
close-up headshots. Restyling proportions (smaller hero, tighter grid) still
leaves the same underlying shape — hero → gallery → biography → timeline
list → press list → CTA footnote — which reads as "a template with Sophie's
facts poured in," not an editorial profile of a specific person.

## Concept

About is not a hero page and not a database view of her filmography — it's
a short editorial profile that answers "who is she, not just what has she
been in." The organizing spine is **her own geography and disciplines**,
which happen to form a real through-line, not an invented conceit:

Hyde Park (childhood) → Lake Forest (the family's move) → Evanston (where
she started performing at 11) → stage → screen → Los Angeles → the interior
turn toward music, running in parallel with the acting career the whole
time. The page follows that line as a sequence of unequal-weight prose
movements, not uniform sections. Density and rhythm vary on purpose: some
movements are a single paragraph with one small image, one is almost all
quote and negative space, one is a hard register change (the music
interlude).

Same design system as the rest of the site (color tokens, `font-display` /
`font-mono` roles, border/focus treatment, `Reveal`, `PageContainer`,
`Badge`) — different composition, density, and pacing than Home.

## Content basis (researched, not invented)

Sourced from Chicago Sun-Times, Daily Northwestern, NME, The Line of Best
Fit, FLOOD Magazine, Under the Radar, AOL/Marie Claire Heretic press, and
existing site copy. No rumor, no unverified claims, no invented quotes.

- Early childhood in Hyde Park, Chicago; family moved to Lake Forest after
  her brother was bullied at school; she landed in Evanston in eighth
  grade. First stage appearance age 4 (a community-theatre *Wizard of Oz*
  munchkin); first professional role age 11, *The Secret Garden* at Music
  Theater Works, Evanston.
- Mother is a piano teacher; siblings are a filmmaker (Emma), a writer
  (Alexander), and an identical twin who is a visual artist (Ellie) —
  already in the current page copy, retained.
- Making music alone since 14 (omnichord → Ableton); voice lessons since 9.
  Debut EP *Pivot & Scrape* (2024).
- On music vs. acting (FLOOD Magazine / Under the Radar): *"Every character
  I play is to some extent an extension of myself, but music is closer to
  who I am. It's insane to have control and feel like you're a conductor
  in this crazy experiment."*
- She builds a playlist for every character to find them — for *Companion*'s
  Iris, she leaned into "synth-heavy '80s sounds, a lot of German minimal
  synth" (IndieWire).
- Raised LDS (Mormon), left the church around age 12 — already reflected in
  the current page's pull-quote, retained verbatim (it's already sourced
  and in production copy).
- Career facts already in the current `TIMELINE`/`RECOGNITION` arrays
  (*Prospect*, *Chicago P.D.*, *Yellowjackets*, *Heretic*, *Companion*,
  press/awards) are accurate and reused — only their presentation changes.
- Instagram `@soapy.t` and YouTube `@SophieThatcher`, already in the
  current page, reconfirmed via search as her genuine accounts — unchanged.

## Architecture

Full rewrite of `app/(main)/about/page.tsx`. One continuous page, eight
movements, not six equal "sections" with matching headers:

```
01 Opening fragment      — dated moment, not a name/photo hero
02 Hyde Park → Evanston  — childhood, family, the move, first stage role
03 Stage → Screen        — Prospect, Chicago P.D., the move to LA
04 Yellowjackets          — pivot, weighted by type scale not a card
05 The music interlude   — register change: darker, quieter, the "moment"
06 Heretic → Companion → Now — faith thread resolves, closes on present
07 In Print               — compressed press/awards index
08 Coda                   — public presence + archive disclaimer
```

No hero. No CTA buttons anywhere on the page. No photo gallery grid, no
lightbox on this page.

## 01 — Opening Fragment

- No name-first headline, no portrait. Page opens on a dated, documentary
  fragment set in mono/eyebrow type: `AGE FOUR · HYDE PARK, CHICAGO`,
  followed by one short serif line: a community-theatre production of
  *The Wizard of Oz* — she played a munchkin.
- Her name resolves a beat later, smaller than the current 7.5rem hero:
  `clamp(2.2rem, 4.5vw, 3.4rem)`, `text-primary`, no gradient/glow/split
  color. Immediately followed by a single-sentence identification line
  (actor / musician / visual artist — reuse existing framing).
- No image in this movement. The absence of a photo here is deliberate —
  it's the one place on the page that is pure typography, which is also
  what makes the images that *do* appear later feel chosen rather than
  decorative.
- Height follows content; no forced viewport unit.

## 02 — Hyde Park → Lake Forest → Evanston

- One flowing prose passage (2–3 paragraphs), not bullet facts: childhood
  in Hyde Park, the family's move to Lake Forest, landing in Evanston in
  eighth grade, the household of working artists (mother/piano, Emma/film,
  Alexander/writing, Ellie/visual art — reuse existing family paragraph,
  lightly re-cut for this new flow), first professional stage role at 11.
- One small inline image (portrait, `aspect-[3/4]`, capped width e.g.
  `max-w-[280px]`), set into the text column as a right-floated or
  side-by-side element on desktop, stacked above the text on mobile — not
  full-bleed, not a background image.
- `PageContainer size="dossier"` (`max-w-4xl`) for the text measure.

## 03 — Stage → Screen

- Short paragraphs carrying *Prospect* (SXSW, opposite Pedro Pascal) and
  *Chicago P.D.*, then the move to Los Angeles. Dates appear as small
  mono margin annotations beside the paragraph they belong to (e.g. a
  narrow left column with `2018` / `2019` in mono-muted type), not a
  `divide-y` list with year/category/title/description grid cells.
- No image required in this movement — pacing beat, deliberately quieter
  and more compact than the movements on either side of it.

## 04 — Yellowjackets

- Given weight through typographic scale, not a colored card: a larger
  serif pull-quote-style treatment for the show name/role and a single
  sentence on why it mattered (already-approved current copy: *"29
  episodes as Teen Natalie Scatorccio. A generation-defining performance
  anchoring the critically acclaimed Showtime drama"* — trimmed to fit the
  new prose register). One `Badge` (`variant="tv"`) inline, no background
  tint, no rounded highlight block, no left border treatment.

## 05 — The Music Interlude ("the moment")

This is the one deliberate register change on the page — darker surface
(`bg-elevated` or `bg-card`, not `bg-base`), reduced type size, more
negative space, no imagery except optionally one small, moody frame.

- Eyebrow: `Pivot & Scrape · 2024`.
- Attributed pull-quote (verbatim, sourced above): *"Every character I
  play is to some extent an extension of myself, but music is closer to
  who I am. It's insane to have control and feel like you're a conductor
  in this crazy experiment."* — set large, serif italic, on its own.
- One short paragraph bridging back to acting: music since 14
  (omnichord → Ableton, voice lessons since 9), and the detail that she
  builds a full playlist to find every character — naming the *Companion*
  example (German minimal synth for Iris) as one concrete instance, not a
  tracklist UI.
- No embedded player, no track list, no streaming-service badges — a
  written interlude, not a music-app widget. (Full discography/streaming
  links already live on `/music`; this section doesn't duplicate that
  page, it explains *why* music exists in her work at all.)

## 06 — Heretic → Companion → Now

- Faith thread resolves here: the existing Mormon-upbringing pull-quote
  (already in production copy, kept verbatim) leads into her *Heretic*
  role (Sister Barnes) as the place that upbringing found expression.
  Existing paragraph content reused, re-cut into this flow.
- *Companion* closes the movement — reuse existing framing (*"a subversive
  performance chosen for its sharp conceptual complexity"* + the Critics'
  Choice Super Award), landing on present day: based in Los Angeles,
  working across screen and music.
- One image here: the closing portrait for the page, `aspect-[4/5]` or
  similar, moderate size — not full-bleed background, not a wallpaper
  behind text.

## 07 — In Print

- Compressed, quiet index — not a heading-and-grid "section" matching the
  weight of the movements above it. Small eyebrow (`In Print`), then the
  existing `RECOGNITION` data (Critics' Choice, Dazed, Harper's Bazaar,
  Vanity Fair, Vogue) as a tight list: year (mono, muted) — title + note —
  type, explicit CSS grid columns for alignment, small type throughout.
  Content unchanged from the current `RECOGNITION` array.

## 08 — Coda

- Public presence, not a "Social Media" block: one small mono line —
  `Instagram @soapy.t ↗` / `YouTube @SophieThatcher ↗` — same treatment as
  the current masthead's link row, just relocated here as a closing line
  rather than living in a hero.
- Directly below: the disclaimer reused **verbatim** from
  `components/ui/Footer.tsx` — *"An unofficial fan archive celebrating the
  work and artistry of actress and musician Sophie Thatcher across film,
  television, and music."*
- No buttons, no "Explore the archive" nav block. If a reader wants
  Filmography or Music, primary nav already offers that — this page
  doesn't need to re-sell it.

## Non-goals

- No hero section, no `min-h-[*vh]` forced sections anywhere on the page.
- No CTA buttons (`Button` component not used on this page).
- No gradients, glows, color-mix overlays, or decorative blend layers.
- No photo gallery grid and no lightbox on this page — `PhotoGallery` is
  not used here. It remains in the codebase unmodified (About was its only
  consumer; if unused elsewhere after this change, that's expected, not a
  bug — leave the component in place rather than deleting it speculatively).
- No new content invented beyond what's listed in "Content basis" above —
  existing biography/timeline/recognition data is preserved, re-cut into
  new prose, not rewritten wholesale or padded with unverified detail.
- No changes to Home, Filmography, Music, Film/TV Detail, Profile, Auth,
  Database, or TMDB architecture.
- No new dependencies.

## Components

- `app/(main)/about/page.tsx` — full rewrite, Server Component. Still
  fetches `getPersonImages()` (TMDB, 24h cache) and uses
  `getPortraitUrls()` / `getTmdbImageUrl()`, but selects only 3–4 images
  total (opening has none; Hyde Park/Evanston gets one small inline;
  music interlude optionally one moody frame; closing gets one) instead
  of a 12-photo grid. `revalidate = 3600` and the JSON-LD
  `buildWebPageSchema()` call are unchanged.
- Reuses without modification: `Reveal`, `PageContainer` (`size="dossier"`),
  `Badge`.
- `PhotoGallery` (`components/media/PhotoGallery.tsx`) — no longer
  imported by this page. Left in the codebase as-is (not deleted).
- `Button` — no longer imported by this page (no CTAs).
- No new Client Components. The rewritten page stays a Server Component,
  same as today — there's no interactive state left on the page once the
  lightbox is removed.

## Data Flow

Unchanged sourcing: `getPersonImages()` → `getPortraitUrls()` /
filtered `imagesData.profiles` for the 3–4 selected portraits. `TIMELINE`
and `RECOGNITION` stay as local const arrays with identical data; the page
body prose is written directly (not generated from a loop) since each
movement now has bespoke pacing, but the *facts* it draws from `TIMELINE`
entries are unchanged.

## Accessibility

- Heading hierarchy: one `h1` (name, in the opening fragment), `h2` per
  subsequent movement that has one (the opening fragment and the margin-
  annotation movement may not need their own `h2` if they read as a
  continuation — confirm during implementation that heading order still
  makes sense to a screen-reader user skipping by heading).
- All images keep meaningful `alt` text describing what's shown (no
  generic "Sophie Thatcher archival still" repeated four times — each alt
  describes the specific image/context it illustrates).
- No lightbox to maintain on this page — removes the previous spec's
  biggest a11y-regression surface entirely.
- Focus-visible ring (`focus-ring` utility) preserved on the Instagram/
  YouTube links in the coda.
- Text stays on existing `text-primary`/`text-secondary`/`text-muted`
  tokens, already WCAG AA-verified in `globals.css`; the music interlude's
  darker surface must be re-checked for contrast since it's a new
  background/type-size combination not present in the current page.

## Performance

- No new dependencies.
- Fewer images fetched/rendered than today (3–4 vs. 12 + masthead + bio
  background), so this should be a net performance improvement.
- `next/image` continues to be used for all photography with appropriate
  `sizes`.
- No Client Components on this page (down from one — `PhotoGallery`).
- Existing 3600s ISR revalidation and TMDB 24h `unstable_cache` unchanged.

## Testing / Verification

- `npm run typecheck`, `npm test`, `npm run build` must all pass. About
  has no dedicated test file today; none is added unless the rewrite
  introduces non-trivial logic worth a regression check (the age
  calculation helper, if retained, already has no test today — out of
  scope to add one here unless it moves/changes).
- Manual, in-browser verification (required, not optional, per the
  brief): run `npm run dev`, view `/` then `/about` then `/` again in the
  same session and confirm, by eye, that they no longer read as siblings —
  no shared hero shape, no shared CTA pattern, no shared 12-photo-grid
  silhouette.
- Check all four breakpoints (wide desktop, standard desktop, tablet,
  mobile) — the margin-annotation date treatment in movement 03 and the
  inline-floated image in movement 02 are the two layouts most likely to
  need a distinct mobile treatment (stack rather than float/margin-column).
- Confirm no dangling imports/exports: `Button`, `PhotoGallery`, and the
  old `TimelineEntry`/gallery-mapping logic should not remain imported if
  unused after the rewrite.

## Deliverable

Rewritten `app/(main)/about/page.tsx` matching the eight movements above.
No separate summary doc is required beyond this spec (the previous spec's
"Deliverable" section calling for a `docs/about-redesign-final.md` write-up
is dropped — not needed for a spec this explicit).
