-- Close the two security-advisor warnings introduced by the username fix:
-- pin the sanitizer's search_path, and remove public API exposure of the
-- trigger-only handle_new_user() SECURITY DEFINER function.
ALTER FUNCTION public.sanitize_username_candidate(text) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
