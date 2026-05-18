-- Run this in your Supabase SQL editor to create the workspace tables.

create table if not exists characters (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,
  name        text not null,
  age         text,
  physical_description text,
  personality_traits   text,
  relations   text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists characters_project_id_idx on characters (project_id);

create table if not exists lore_entries (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null,
  name        text not null,
  type        text not null check (type in ('lieu', 'faction', 'objet', 'concept')),
  description text,
  character_links text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists lore_entries_project_id_idx on lore_entries (project_id);

create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null unique,
  content     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

create trigger lore_entries_updated_at
  before update on lore_entries
  for each row execute function update_updated_at();

create trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();
