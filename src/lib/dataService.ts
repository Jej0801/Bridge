import {
  Couple,
  DatePlan,
  Idea,
  Memory,
  Profile,
} from '@/types/bridge';
import { mockCouple, mockIdeas, mockMemories, mockPlans, mockProfiles } from './mockData';
import { getSupabase, isSupabaseConfigured } from './supabase';

// Data access boundary. The rest of the app only ever talks to a
// BridgeDataService. Today there is one implementation (in-memory mock);
// a SupabaseDataService can be dropped in without touching screens.

export interface NewIdea
  extends Omit<Idea, 'id' | 'couple_id' | 'created_by' | 'created_at' | 'updated_at'> {}

export interface NewPlan
  extends Omit<DatePlan, 'id' | 'couple_id' | 'created_by' | 'created_at' | 'updated_at'> {}

export interface NewMemory
  extends Omit<Memory, 'id' | 'couple_id' | 'created_by' | 'photos' | 'created_at' | 'updated_at'> {}

export interface BridgeDataService {
  loadInitial(): Promise<{
    profiles: Profile[];
    couple: Couple | null;
    ideas: Idea[];
    plans: DatePlan[];
    memories: Memory[];
  }>;
  createIdea(input: NewIdea, userId: string, coupleId: string): Promise<Idea>;
  updateIdea(id: string, patch: Partial<Idea>): Promise<Idea>;
  createPlan(input: NewPlan, userId: string, coupleId: string): Promise<DatePlan>;
  updatePlan(id: string, patch: Partial<DatePlan>): Promise<DatePlan>;
  createMemory(input: NewMemory, userId: string, coupleId: string): Promise<Memory>;
}

let counter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${counter++}`;
const now = () => new Date().toISOString();

class MockDataService implements BridgeDataService {
  private ideas = [...mockIdeas];
  private plans = [...mockPlans];
  private memories = [...mockMemories];

  async loadInitial() {
    return {
      profiles: mockProfiles,
      couple: mockCouple,
      ideas: this.ideas,
      plans: this.plans,
      memories: this.memories,
    };
  }

  async createIdea(input: NewIdea, userId: string, coupleId: string): Promise<Idea> {
    const idea: Idea = {
      ...input,
      id: newId('idea'),
      couple_id: coupleId,
      created_by: userId,
      created_at: now(),
      updated_at: now(),
    };
    this.ideas = [idea, ...this.ideas];
    return idea;
  }

  async updateIdea(id: string, patch: Partial<Idea>): Promise<Idea> {
    const idx = this.ideas.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Idea not found: ${id}`);
    const updated = { ...this.ideas[idx], ...patch, updated_at: now() };
    this.ideas[idx] = updated;
    return updated;
  }

  async createPlan(input: NewPlan, userId: string, coupleId: string): Promise<DatePlan> {
    const plan: DatePlan = {
      ...input,
      id: newId('plan'),
      couple_id: coupleId,
      created_by: userId,
      created_at: now(),
      updated_at: now(),
    };
    this.plans = [plan, ...this.plans];
    return plan;
  }

  async updatePlan(id: string, patch: Partial<DatePlan>): Promise<DatePlan> {
    const idx = this.plans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Plan not found: ${id}`);
    const updated = { ...this.plans[idx], ...patch, updated_at: now() };
    this.plans[idx] = updated;
    return updated;
  }

  async createMemory(input: NewMemory, userId: string, coupleId: string): Promise<Memory> {
    const memory: Memory = {
      ...input,
      id: newId('memory'),
      couple_id: coupleId,
      created_by: userId,
      photos: [],
      created_at: now(),
      updated_at: now(),
    };
    this.memories = [memory, ...this.memories];
    return memory;
  }
}

class SupabaseDataService implements BridgeDataService {
  private supabase = getSupabase();

  async loadInitial() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      return {
        profiles: [],
        couple: null,
        ideas: [],
        plans: [],
        memories: [],
      };
    }

    // Load user's profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Load couple membership
    const { data: membership } = await this.supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return {
        profiles: profile ? [profile] : [],
        couple: null,
        ideas: [],
        plans: [],
        memories: [],
      };
    }

    // Load couple data
    const { data: couple } = await this.supabase
      .from('couples')
      .select('*')
      .eq('id', membership.couple_id)
      .single();

    // Load partner profile
    const { data: partnerMembership } = await this.supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', membership.couple_id)
      .neq('user_id', user.id)
      .single();

    let profiles = profile ? [profile] : [];
    if (partnerMembership) {
      const { data: partnerProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerMembership.user_id)
        .single();
      if (partnerProfile) profiles.push(partnerProfile);
    }

    // Load ideas
    const { data: ideas } = await this.supabase
      .from('ideas')
      .select('*')
      .eq('couple_id', membership.couple_id)
      .order('created_at', { ascending: false });

    // Load plans with idea IDs
    const { data: plansRaw } = await this.supabase
      .from('date_plans')
      .select('*, date_plan_ideas(idea_id)')
      .eq('couple_id', membership.couple_id)
      .order('created_at', { ascending: false });

    const plans = plansRaw?.map((p: any) => ({
      ...p,
      idea_ids: p.date_plan_ideas?.map((dpi: any) => dpi.idea_id) || [],
      date_plan_ideas: undefined,
    })) || [];

    // Load memories with idea IDs and photos
    const { data: memoriesRaw } = await this.supabase
      .from('memories')
      .select('*, memory_ideas(idea_id), memory_photos(*)')
      .eq('couple_id', membership.couple_id)
      .order('occurred_at', { ascending: false });

    const memories = memoriesRaw?.map((m: any) => ({
      ...m,
      idea_ids: m.memory_ideas?.map((mi: any) => mi.idea_id) || [],
      photos: m.memory_photos?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [],
      memory_ideas: undefined,
      memory_photos: undefined,
    })) || [];

    return {
      profiles,
      couple: couple || null,
      ideas: ideas || [],
      plans,
      memories,
    };
  }

  async createIdea(input: NewIdea, userId: string, coupleId: string): Promise<Idea> {
    const { data, error } = await this.supabase
      .from('ideas')
      .insert({
        ...input,
        couple_id: coupleId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateIdea(id: string, patch: Partial<Idea>): Promise<Idea> {
    const { data, error } = await this.supabase
      .from('ideas')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createPlan(input: NewPlan, userId: string, coupleId: string): Promise<DatePlan> {
    // Create the plan
    const { data: plan, error: planError } = await this.supabase
      .from('date_plans')
      .insert({
        couple_id: coupleId,
        created_by: userId,
        title: input.title,
        scheduled_at: input.scheduled_at,
        location_name: input.location_name,
        vibe: input.vibe,
        estimated_cost: input.estimated_cost,
        notes: input.notes,
        itinerary_json: input.itinerary_json,
        status: input.status,
      })
      .select()
      .single();

    if (planError) throw planError;

    // Insert idea associations
    if (input.idea_ids.length > 0) {
      const { error: ideaError } = await this.supabase
        .from('date_plan_ideas')
        .insert(
          input.idea_ids.map((idea_id) => ({
            date_plan_id: plan.id,
            idea_id,
          }))
        );

      if (ideaError) throw ideaError;
    }

    return { ...plan, idea_ids: input.idea_ids };
  }

  async updatePlan(id: string, patch: Partial<DatePlan>): Promise<DatePlan> {
    const { data, error } = await this.supabase
      .from('date_plans')
      .update({
        title: patch.title,
        scheduled_at: patch.scheduled_at,
        location_name: patch.location_name,
        vibe: patch.vibe,
        estimated_cost: patch.estimated_cost,
        notes: patch.notes,
        itinerary_json: patch.itinerary_json,
        status: patch.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If idea_ids are being updated, handle the join table
    if (patch.idea_ids) {
      // Delete existing associations
      await this.supabase
        .from('date_plan_ideas')
        .delete()
        .eq('date_plan_id', id);

      // Insert new associations
      if (patch.idea_ids.length > 0) {
        await this.supabase
          .from('date_plan_ideas')
          .insert(
            patch.idea_ids.map((idea_id) => ({
              date_plan_id: id,
              idea_id,
            }))
          );
      }

      return { ...data, idea_ids: patch.idea_ids };
    }

    // Fetch current idea_ids if not updating them
    const { data: planIdeas } = await this.supabase
      .from('date_plan_ideas')
      .select('idea_id')
      .eq('date_plan_id', id);

    return {
      ...data,
      idea_ids: planIdeas?.map((pi: any) => pi.idea_id) || [],
    };
  }

  async createMemory(input: NewMemory, userId: string, coupleId: string): Promise<Memory> {
    // Create the memory
    const { data: memory, error: memoryError } = await this.supabase
      .from('memories')
      .insert({
        couple_id: coupleId,
        created_by: userId,
        date_plan_id: input.date_plan_id,
        title: input.title,
        occurred_at: input.occurred_at,
        location_name: input.location_name,
        notes: input.notes,
        song_title: input.song_title,
        song_artist: input.song_artist,
        aesthetic_theme: input.aesthetic_theme,
        food_rating: input.food_rating,
        vibe_rating: input.vibe_rating,
        value_rating: input.value_rating,
        overall_rating: input.overall_rating,
        would_do_again: input.would_do_again,
      })
      .select()
      .single();

    if (memoryError) throw memoryError;

    // Insert idea associations
    if (input.idea_ids.length > 0) {
      const { error: ideaError } = await this.supabase
        .from('memory_ideas')
        .insert(
          input.idea_ids.map((idea_id) => ({
            memory_id: memory.id,
            idea_id,
          }))
        );

      if (ideaError) throw ideaError;
    }

    return { ...memory, idea_ids: input.idea_ids, photos: [] };
  }
}

// When Supabase is configured, this is where a SupabaseDataService gets
// returned instead. Screens never need to know which one they got.
export function createDataService(): BridgeDataService {
  if (isSupabaseConfigured) {
    return new SupabaseDataService();
  }
  return new MockDataService();
}
