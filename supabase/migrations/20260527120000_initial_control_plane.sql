create extension if not exists pgcrypto;

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  timezone text not null default 'Europe/Rome',
  location_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  display_name text not null,
  status text not null default 'unknown',
  last_success_at timestamptz,
  last_error_at timestamptz,
  capabilities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.devices (
  id text primary key,
  integration_id uuid not null references public.integrations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  display_name text not null,
  device_type text not null,
  capabilities jsonb not null default '[]'::jsonb,
  status text not null default 'unknown',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_capability_snapshots (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  captured_at timestamptz not null default now(),
  component_id text not null,
  capability_id text not null,
  capability_version integer,
  attributes jsonb not null default '{}'::jsonb,
  commands jsonb not null default '[]'::jsonb,
  is_observable boolean not null default true,
  is_controllable boolean not null default false,
  wattbridge_mapping jsonb not null default '{}'::jsonb
);

create table public.energy_current_state (
  site_id uuid primary key references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp timestamptz not null,
  production_w numeric not null default 0,
  consumption_w numeric not null default 0,
  grid_import_w numeric not null default 0,
  grid_export_w numeric not null default 0,
  surplus_w numeric not null default 0,
  self_consumption_w numeric not null default 0,
  quality text not null default 'mock',
  updated_at timestamptz not null default now()
);

create table public.device_current_state (
  device_id text primary key references public.devices(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  operating_state text not null default 'unknown',
  power_w numeric,
  energy_wh numeric,
  raw_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.recommendations (
  id text primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text references public.devices(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  title text not null,
  reason text not null,
  recommended_action text not null,
  surplus_w numeric not null default 0,
  status text not null default 'proposed'
);

create table public.approval_requests (
  id text primary key,
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text not null references public.recommendations(id) on delete cascade,
  device_id text references public.devices(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  requested_action text not null,
  safety_summary text not null,
  status text not null default 'pending',
  approved_at timestamptz,
  approved_from text
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  actor text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.sites enable row level security;
alter table public.integrations enable row level security;
alter table public.devices enable row level security;
alter table public.device_capability_snapshots enable row level security;
alter table public.energy_current_state enable row level security;
alter table public.device_current_state enable row level security;
alter table public.recommendations enable row level security;
alter table public.approval_requests enable row level security;
alter table public.audit_events enable row level security;

create policy "Authenticated users manage own sites" on public.sites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own integrations" on public.integrations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own devices" on public.devices
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own capability snapshots" on public.device_capability_snapshots
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own energy state" on public.energy_current_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own device state" on public.device_current_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own recommendations" on public.recommendations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users manage own approvals" on public.approval_requests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users read own audit events" on public.audit_events
  for select to authenticated
  using (user_id = auth.uid());

create policy "Authenticated users append own audit events" on public.audit_events
  for insert to authenticated
  with check (user_id = auth.uid());

create index integrations_site_id_idx on public.integrations(site_id);
create index devices_site_id_idx on public.devices(site_id);
create index recommendations_site_status_idx on public.recommendations(site_id, status);
create index approval_requests_site_status_idx on public.approval_requests(site_id, status);
create index audit_events_site_created_idx on public.audit_events(site_id, created_at desc);
