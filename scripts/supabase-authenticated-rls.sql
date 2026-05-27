-- Authenticated RLS harness for the linked WattBridge Supabase project.
-- Requires an existing demo site created by the dashboard seed action.
-- Every check intentionally raises division-by-zero if the expected RLS behavior fails.

begin;
select set_config('request.jwt.claim.sub', (select user_id::text from public.sites limit 1), false);
set local role authenticated;
select case when count(*) = 1 then 1 else ('expected_1_got_' || count(*))::int end as own_sites_visible
from public.sites;
rollback;

begin;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000000', false);
set local role authenticated;
select case when count(*) = 0 then 1 else ('expected_0_got_' || count(*))::int end as other_user_sites_hidden
from public.sites;
rollback;

begin;
select set_config('request.jwt.claim.sub', (select user_id::text from public.sites limit 1), false);
set local role authenticated;

insert into public.audit_events (
  id,
  site_id,
  user_id,
  event_type,
  actor,
  summary,
  metadata
)
select
  '00000000-0000-4000-8000-000000000299'::uuid,
  id,
  user_id,
  'recommendation_created',
  'system',
  'Authenticated RLS harness audit insert.',
  '{"source":"supabase-authenticated-rls.sql"}'::jsonb
from public.sites
limit 1;

select case when count(*) = 1 then 1 else ('expected_1_got_' || count(*))::int end as own_audit_insert_visible
from public.audit_events
where id = '00000000-0000-4000-8000-000000000299'::uuid;

with updated as (
  update public.audit_events
  set summary = 'Authenticated RLS harness should not update audit.'
  where id = '00000000-0000-4000-8000-000000000299'::uuid
  returning 1
)
select case when count(*) = 0 then 1 else ('expected_0_got_' || count(*))::int end as own_audit_update_blocked
from updated;

with deleted as (
  delete from public.audit_events
  where id = '00000000-0000-4000-8000-000000000299'::uuid
  returning 1
)
select case when count(*) = 0 then 1 else ('expected_0_got_' || count(*))::int end as own_audit_delete_blocked
from deleted;

rollback;
