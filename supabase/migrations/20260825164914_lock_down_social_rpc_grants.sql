-- CREATE FUNCTION grants EXECUTE to PUBLIC by default unless explicitly
-- revoked -- missed in add_social_features, same class of gap is_admin()
-- already guards against (revoke all ... from public, anon; grant execute
-- ... to authenticated;` in 20260818194726_security_hardening.sql:57-58).
-- Confirmed by the advisor: toggle_follow/toggle_review_like/
-- submit_review_reply (SECURITY DEFINER) and submit_report were all
-- callable by the anon role. Each function's own `auth.uid() is null`
-- check already rejects anon calls functionally, but this closes the gap
-- at the grant layer too, matching house style.

begin;

revoke all on function public.toggle_follow(uuid) from public, anon;
grant execute on function public.toggle_follow(uuid) to authenticated;

revoke all on function public.toggle_review_like(text, uuid) from public, anon;
grant execute on function public.toggle_review_like(text, uuid) to authenticated;

revoke all on function public.submit_review_reply(text, uuid, text) from public, anon;
grant execute on function public.submit_review_reply(text, uuid, text) to authenticated;

revoke all on function public.submit_report(text, uuid, text) from public, anon;
grant execute on function public.submit_report(text, uuid, text) to authenticated;

commit;
