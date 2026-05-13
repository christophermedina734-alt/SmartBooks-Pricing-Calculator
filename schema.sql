create table if not exists pricing_assumptions (
  id text primary key default 'default',
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  intake jsonb not null,
  result jsonb not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
