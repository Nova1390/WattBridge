-- Controlled cleanup for pre-stable demo rows.
-- Targets only WattBridge mock/demo records created before the seed became idempotent.

begin;

delete from public.approval_requests
where id like 'approval_%';

delete from public.recommendations
where id like 'rec_%';

delete from public.audit_events
where event_type in ('recommendation_created', 'approval_created')
  and summary in (
    'Raccomandazione mock generata con surplus disponibile.',
    'Richiesta approval mock pronta per validare il flusso.'
  )
  and id not in (
    '00000000-0000-4000-8000-000000000201'::uuid,
    '00000000-0000-4000-8000-000000000202'::uuid
  );

insert into public.recommendations (
  id,
  site_id,
  user_id,
  device_id,
  created_at,
  expires_at,
  title,
  reason,
  recommended_action,
  surplus_w,
  status
)
select
  'demo_recommendation_dryer_surplus',
  s.id,
  s.user_id,
  'dryer_mock',
  now(),
  now() + interval '15 minutes',
  'Surplus disponibile',
  'Surplus demo disponibile con asciugatrice disponibile.',
  'prepare_dryer_run',
  ecs.surplus_w,
  'proposed'
from public.sites s
join public.energy_current_state ecs on ecs.site_id = s.id
limit 1
on conflict (id) do update
set
  created_at = excluded.created_at,
  expires_at = excluded.expires_at,
  surplus_w = excluded.surplus_w,
  status = excluded.status;

insert into public.approval_requests (
  id,
  site_id,
  user_id,
  recommendation_id,
  device_id,
  created_at,
  expires_at,
  requested_action,
  safety_summary,
  status
)
select
  'demo_approval_dryer_surplus',
  r.site_id,
  r.user_id,
  r.id,
  r.device_id,
  now(),
  r.expires_at,
  r.recommended_action,
  'Manual approval only. Nessun comando reale viene inviato in questa foundation.',
  'pending'
from public.recommendations r
where r.id = 'demo_recommendation_dryer_surplus'
on conflict (id) do update
set
  created_at = excluded.created_at,
  expires_at = excluded.expires_at,
  status = excluded.status;

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
  '00000000-0000-4000-8000-000000000201'::uuid,
  s.id,
  s.user_id,
  'recommendation_created',
  'system',
  'Raccomandazione mock generata con surplus disponibile.',
  '{"source":"demo_seed"}'::jsonb
from public.sites s
limit 1
on conflict (id) do nothing;

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
  '00000000-0000-4000-8000-000000000202'::uuid,
  s.id,
  s.user_id,
  'approval_created',
  'user',
  'Richiesta approval mock pronta per validare il flusso.',
  '{"source":"demo_seed"}'::jsonb
from public.sites s
limit 1
on conflict (id) do nothing;

commit;
