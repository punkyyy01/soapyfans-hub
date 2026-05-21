# SoapyFans Hub — Project Guide

Fan site for Sophie Thatcher (TMDB person ID: 1981044). Built with Next.js 15 App Router, TypeScript, Tailwind CSS, Supabase, and TMDB API.

## Architecture

### Routing

Route groups keep concerns separated without affecting URLs:

- `app/(auth)/` — unauthenticated routes (`/login`)
- `app/(main)/` — main app routes (`/`, `/films`, `/films/[id]`)
- `app/layout.tsx` — root layout shared by all routes

### Supabase

Three clients, each for a different runtime context:

| File | Context | When to use |
|------|---------|-------------|
| `utils/supabase/client.ts` | Browser | Client Components (`'use client'`) |
| `utils/supabase/server.ts` | Server | Server Components, Route Handlers, Server Actions |
| `utils/supabase/middleware.ts` | Edge/Middleware | `middleware.ts` only |

Supabase project ID: `tcskvcmtcsaxyfoselvb`

### TMDB

All TMDB calls live in `utils/tmdb.ts`. Responses are cached 1 hour via `next: { revalidate: 3600 }`.

- `getPersonCredits(personId?)` — filmography (defaults to Sophie Thatcher)
- `getMovieDetails(movieId)` — full movie info
- `getTmdbImageUrl(path, size?)` — constructs image CDN URL

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (public)
TMDB_API_KEY                  # TMDB v3 API key (server-only, no NEXT_PUBLIC_)
```

`TMDB_API_KEY` is server-only intentionally — never expose it to the browser.

## Key conventions

- Server Components by default; add `'use client'` only when needed (interactivity, browser APIs, hooks)
- Data fetching happens in Server Components via `async/await` — no `useEffect` for initial data
- `utils/supabase/server.ts` must be `await`ed before use (cookies() is async in Next.js 15)
- Auth enforcement is currently disabled in middleware — uncomment the redirect block when Discord auth is wired up

## Pending

- Discord OAuth via Supabase Auth
- Auth-gated content
- Database schema (fan lists, favorites)
