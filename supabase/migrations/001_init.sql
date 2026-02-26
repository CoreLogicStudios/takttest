create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  subscription_status text not null default 'free' check (subscription_status in ('free','pro','trial')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique(org_id,user_id)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  takt_length_days int not null check (takt_length_days > 0),
  period_count int not null check (period_count > 0),
  working_days_mode boolean not null default false,
  logo_url text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table project_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  template_json jsonb not null,
  created_at timestamptz not null default now()
);

create table zones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  order_index int not null,
  group_name text,
  created_at timestamptz not null default now()
);

create table trains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  abbreviation text not null,
  color text not null,
  order_index int not null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  period_index int not null,
  train_id uuid references trains(id) on delete set null,
  status text not null default 'planned' check (status in ('planned','in_progress','complete','blocked')),
  note text,
  constraint_tag text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  unique(project_id, zone_id, period_index)
);

create table baselines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now()
);

create table public_shares (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
