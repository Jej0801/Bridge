-- Enhanced date spot fields for AI extraction and enrichment

-- Add new columns to ideas table
alter table public.ideas
  add column if not exists address text,
  add column if not exists estimated_duration_minutes int,
  add column if not exists best_time_of_day text[],
  add column if not exists vibe_tags text[],
  add column if not exists ai_extracted boolean not null default false,
  add column if not exists rating numeric(2,1) check (rating between 1 and 5),
  add column if not exists popular_times jsonb,
  add column if not exists nearby_spots text[],
  add column if not exists phone_number text,
  add column if not exists website_url text,
  add column if not exists hours_of_operation text;

-- Add index for location-based queries (for finding nearby spots)
create index if not exists ideas_location_idx on public.ideas using gist (
  ll_to_earth(latitude, longitude)
) where latitude is not null and longitude is not null;

-- Add index for AI-extracted ideas
create index if not exists ideas_ai_extracted_idx on public.ideas (ai_extracted, couple_id);

-- Add index for vibe tags (GIN index for array operations)
create index if not exists ideas_vibe_tags_idx on public.ideas using gin (vibe_tags);

-- Function to find nearby spots (within X km)
create or replace function public.nearby_ideas(
  idea_lat double precision,
  idea_lng double precision,
  radius_km double precision default 5,
  limit_count int default 10
)
returns table (
  id uuid,
  title text,
  location_name text,
  distance_km double precision
) language sql stable as $$
  select
    i.id,
    i.title,
    i.location_name,
    earth_distance(
      ll_to_earth(idea_lat, idea_lng),
      ll_to_earth(i.latitude, i.longitude)
    ) / 1000 as distance_km
  from public.ideas i
  where
    i.latitude is not null
    and i.longitude is not null
    and earth_distance(
      ll_to_earth(idea_lat, idea_lng),
      ll_to_earth(i.latitude, i.longitude)
    ) / 1000 <= radius_km
  order by distance_km
  limit limit_count;
$$;
