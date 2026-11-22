create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  source text not null check (source in ('single', 'batch')),
  input jsonb not null,
  probability double precision not null,
  predicted_yes boolean not null,
  threshold double precision not null,
  model_version text not null
);

create table if not exists public.batch_jobs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  filename text not null,
  n_rows integer not null,
  n_positive integer not null,
  model_version text not null
);

create index if not exists predictions_created_at_idx on public.predictions (created_at desc);

-- Only the API (direct Postgres connection) reads and writes these tables.
-- RLS without policies blocks the public anon/authenticated roles.
alter table public.predictions enable row level security;
alter table public.batch_jobs enable row level security;
