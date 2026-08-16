// Core domain types for Bridge. These mirror the Supabase schema in
// supabase/migrations/0001_init.sql so the mock layer and the real
// backend can share one shape.

export type SourceType =
  | 'tiktok'
  | 'instagram'
  | 'maps'
  | 'event'
  | 'restaurant'
  | 'manual'
  | 'other';

export type IdeaCategory =
  | 'food'
  | 'drinks'
  | 'activity'
  | 'event'
  | 'outdoors'
  | 'travel'
  | 'cozy'
  | 'fancy'
  | 'cheap'
  | 'other';

export type CostLevel = 'free' | '$' | '$$' | '$$$';

export type IdeaStatus = 'new' | 'shortlisted' | 'planned' | 'done' | 'archived';

export type Vibe =
  | 'cozy'
  | 'romantic'
  | 'adventurous'
  | 'casual'
  | 'fancy'
  | 'spontaneous';

export type PlanStatus = 'draft' | 'planned' | 'completed' | 'canceled';

export type AestheticTheme = 'warm' | 'film' | 'night' | 'minimal' | 'colorful';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Couple {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface CoupleMember {
  couple_id: string;
  user_id: string;
  role: 'owner' | 'partner';
  joined_at: string;
}

export interface Idea {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  description: string | null;
  source_type: SourceType;
  source_url: string | null;
  thumbnail_url: string | null;
  category: IdeaCategory;
  tags: string[];
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  cost_level: CostLevel;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

export interface ItineraryStop {
  order: number;
  title: string;
  idea_id: string | null;
  start_time: string; // e.g. "6:30 PM"
  duration_minutes: number;
  note: string;
}

export interface Itinerary {
  stops: ItineraryStop[];
  total_minutes: number;
  budget_estimate: string;
  backup: { idea_id: string | null; title: string; reason: string } | null;
  generated_by: 'mock' | 'ai';
}

export interface DatePlan {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  scheduled_at: string | null;
  location_name: string | null;
  vibe: Vibe;
  estimated_cost: CostLevel;
  notes: string | null;
  itinerary_json: Itinerary | null;
  status: PlanStatus;
  idea_ids: string[]; // join table date_plan_ideas, flattened for the client
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  date_plan_id: string | null;
  created_by: string;
  title: string;
  occurred_at: string;
  location_name: string | null;
  notes: string | null;
  song_title: string | null;
  song_artist: string | null;
  aesthetic_theme: AestheticTheme;
  food_rating: number | null; // 1–5
  vibe_rating: number | null;
  value_rating: number | null;
  overall_rating: number | null;
  would_do_again: boolean;
  idea_ids: string[];
  photos: MemoryPhoto[];
  created_at: string;
  updated_at: string;
}

export interface MemoryPhoto {
  id: string;
  memory_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CoupleStats {
  dates_logged: number;
  ideas_saved: number;
  favorite_category: IdeaCategory | null;
}

// Labels used across the UI so wording stays consistent.
export const SOURCE_LABELS: Record<SourceType, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  maps: 'Maps',
  event: 'Event',
  restaurant: 'Restaurant',
  manual: 'Note',
  other: 'Link',
};

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  food: 'Food',
  drinks: 'Drinks',
  activity: 'Activity',
  event: 'Event',
  outdoors: 'Outdoors',
  travel: 'Travel',
  cozy: 'Cozy',
  fancy: 'Fancy',
  cheap: 'Cheap',
  other: 'Other',
};

export const VIBE_LABELS: Record<Vibe, string> = {
  cozy: 'Cozy',
  romantic: 'Romantic',
  adventurous: 'Adventurous',
  casual: 'Casual',
  fancy: 'Fancy',
  spontaneous: 'Spontaneous',
};

export const THEME_LABELS: Record<AestheticTheme, string> = {
  warm: 'Warm',
  film: 'Film',
  night: 'Night',
  minimal: 'Minimal',
  colorful: 'Colorful',
};
