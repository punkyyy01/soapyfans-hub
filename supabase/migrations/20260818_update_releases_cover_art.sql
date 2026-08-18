-- Migration: Configure verified cover_art_url for cataloged music releases
-- Updates Pivot & Scrape and other releases with high-resolution artwork URLs

UPDATE public.releases
SET cover_art_url = 'https://f4.bcbits.com/img/a3529195480_10.jpg'
WHERE title ILIKE '%Pivot%Scrape%' OR release_type = 'ep';

COMMENT ON COLUMN public.releases.cover_art_url IS 'Public artwork URL for the release (Spotify CDN, Bandcamp, or Supabase Storage).';
