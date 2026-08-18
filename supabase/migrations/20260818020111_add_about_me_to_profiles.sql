-- Migration: Add about_me extended text field to profiles table
-- Supports multiline text up to 2000 characters for personal archive descriptions

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS about_me TEXT NULL;

COMMENT ON COLUMN public.profiles.about_me IS 'Extended freeform personal description (max 2000 chars), with line breaks and paragraph spacing preserved.';
