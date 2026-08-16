-- Bridge initial schema. Mirrors src/types/bridge.ts.
-- Apply with: supabase db push (or run in the SQL editor).

create extension if not exists "pgcrypto";

-- Profiles extend auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Us',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  title text not null,
  description text,
  source_type text not null default 'manual'
    check (source_type in ('tiktok','instagram','maps','event','restaurant','manual','other')),
  source_url text,
  thumbnail_url text,
  category text not null default 'other'
    check (category in ('food','drinks','activity','event','outdoors','travel','cozy','fancy','cheap','other')),
  tags text[] not null default '{}',
  location_name text,
  latitude double precision,
  longitude double precision,
  cost_level text not null default '$$' check (cost_level in ('free','$','$$','$$$')),
  status text not null default 'new'
    check (status in ('new','shortlisted','planned','done','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.date_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  title text not null,
  scheduled_at timestamptz,
  location_name text,
  vibe text not null default 'casual'
    check (vibe in ('cozy','romantic','adventurous','casual','fancy','spontaneous')),
  estimated_cost text not null default '$$' check (estimated_cost in ('free','$','$$','$$$')),
  notes text,
  itinerary_json jsonb,
  status text not null default 'draft'
    check (status in ('draft','planned','completed','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.date_plan_ideas (
  date_plan_id uuid not null references public.date_plans (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  primary key (date_plan_id, idea_id)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  date_plan_id uuid references public.date_plans (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  title text not null,
  occurred_at timestamptz not null,
  location_name text,
  notes text,
  song_title text,
  song_artist text,
  aesthetic_theme text not null default 'warm'
    check (aesthetic_theme in ('warm','film','night','minimal','colorful')),
  food_rating int check (food_rating between 1 and 5),
  vibe_rating int check (vibe_rating between 1 and 5),
  value_rating int check (value_rating between 1 and 5),
  overall_rating int check (overall_rating between 1 and 5),
  would_do_again boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memory_ideas (
  memory_id uuid not null references public.memories (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,
  primary key (memory_id, idea_id)
);

create table public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index ideas_couple_status_idx on public.ideas (couple_id, status);
create index date_plans_couple_idx on public.date_plans (couple_id, scheduled_at);
create index memories_couple_idx on public.memories (couple_id, occurred_at desc);

-- Row Level Security: everything is scoped to the couple you belong to.
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.ideas enable row level security;
alter table public.date_plans enable row level security;
alter table public.date_plan_ideas enable row level security;
alter table public.memories enable row level security;
alter table public.memory_ideas enable row level security;
alter table public.memory_photos enable row level security;

create or replace function public.is_couple_member(target_couple uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = target_couple and user_id = auth.uid()
  );
$$;

create policy "read own profile and partner" on public.profiles
  for select using (
    id = auth.uid() or exists (
      select 1 from public.couple_members me
      join public.couple_members them on me.couple_id = them.couple_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "insert own profile" on public.profiles
  for insert with check (id = auth.uid());

create policy "members read couple" on public.couples
  for select using (public.is_couple_member(id));
create policy "anyone can create couple" on public.couples
  for insert with check (true);

create policy "read own membership rows" on public.couple_members
  for select using (user_id = auth.uid() or public.is_couple_member(couple_id));
create policy "join couple" on public.couple_members
  for insert with check (user_id = auth.uid());

create policy "couple crud ideas" on public.ideas
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "couple crud plans" on public.date_plans
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "couple crud plan ideas" on public.date_plan_ideas
  for all using (
    exists (select 1 from public.date_plans p
            where p.id = date_plan_id and public.is_couple_member(p.couple_id))
  );

create policy "couple crud memories" on public.memories
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

create policy "couple crud memory ideas" on public.memory_ideas
  for all using (
    exists (select 1 from public.memories m
            where m.id = memory_id and public.is_couple_member(m.couple_id))
  );

create policy "couple crud memory photos" on public.memory_photos
  for all using (
    exists (select 1 from public.memories m
            where m.id = memory_id and public.is_couple_member(m.couple_id))
  );
