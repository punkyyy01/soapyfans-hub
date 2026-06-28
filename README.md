[![License: Polyform NC](https://img.shields.io/badge/License-Polyform%20NC%201.0-blue.svg)](LICENSE)
[![CI](https://github.com/punkyyy01/soapyfans-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/punkyyy01/soapyfans-hub/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-SSR-3ECF8E?logo=supabase)](https://supabase.com)

# SoapyFans Hub

SoapyFans Hub is a fan-made “home base” for Sophie Thatcher: a living archive of credits, pages for individual films/TV entries, and a place for fans to leave short reviews.

This repository exists to power the site — it is not published as a template, starter, or “clone-and-run” project.

## What you’ll find on the site

- Filmography browsing and detail pages
- Fan reviews tied to entries
- Profiles (basic identity + review history)
- A small music corner (releases)

Editorial note: the site’s UI copy is intentionally written to feel like a fan space, not a generic app.

## Data sources & credits

- Movie/TV metadata and images come from TMDB (The Movie Database) via their API.
- User accounts and persisted data live in Supabase.

Uses the TMDB API, but is not endorsed or certified by TMDB.

## Tech (high level)

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase SSR for auth + database
- Vercel Analytics

## Status

Active and evolving. Expect some rough edges while the archive grows.
