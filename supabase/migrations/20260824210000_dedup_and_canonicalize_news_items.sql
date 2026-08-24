-- Add normalized_title and canonical_url to news_items for robust deduplication.
-- Prevents duplicate stories across different feeds, outlets, and timeframes.

begin;

alter table public.news_items
  add column if not exists normalized_title text,
  add column if not exists canonical_url text;

-- Helper SQL function to normalize titles in Postgres consistent with TypeScript utils/news.ts
create or replace function public.normalize_news_title_sql(raw_title text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  if raw_title is null then
    return null;
  end if;

  cleaned := raw_title;
  -- Replace common HTML entities
  cleaned := replace(cleaned, '&amp;', '&');
  cleaned := replace(cleaned, '&quot;', '"');
  cleaned := replace(cleaned, '&#039;', '''');
  cleaned := replace(cleaned, '&apos;', '''');
  cleaned := replace(cleaned, '&#8217;', '''');
  cleaned := replace(cleaned, '&#8216;', '''');
  cleaned := replace(cleaned, '&nbsp;', ' ');
  cleaned := replace(cleaned, '&#8211;', '-');
  cleaned := replace(cleaned, '&#8212;', '-');

  -- Strip common prefixes (e.g. Exclusive:, Interview:)
  cleaned := regexp_replace(cleaned, '^(exclusive|interview|watch|review|update|first look):\s*', '', 'i');

  -- Strip trailing outlet suffix (e.g. " - Variety", " | Collider", " — THR")
  cleaned := regexp_replace(cleaned, '\s+[-|—–·]\s+[^-|—–·]+$', '', 'g');

  -- Lowercase and strip punctuation/non-alphanumeric chars
  cleaned := lower(cleaned);
  cleaned := regexp_replace(cleaned, '[^\w\s]', '', 'g');
  cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');
  cleaned := trim(cleaned);

  return cleaned;
end;
$$;

-- Backfill normalized_title for existing records
update public.news_items
set normalized_title = public.normalize_news_title_sql(title)
where normalized_title is null;

-- Clean up existing duplicate approved items:
-- Keep the row with image_url or the earlier row; reject subsequent duplicates.
with duplicates as (
  select id,
         row_number() over (
           partition by coalesce(nullif(normalized_title, ''), title)
           order by case when image_url is not null then 0 else 1 end, created_at asc
         ) as rank_num
  from public.news_items
  where status = 'approved'
)
update public.news_items
set status = 'rejected'
where id in (
  select id from duplicates where rank_num > 1
);

-- Index normalized_title and canonical_url
create index if not exists news_items_normalized_title_idx
  on public.news_items (normalized_title);

create index if not exists news_items_canonical_url_idx
  on public.news_items (canonical_url);

commit;
