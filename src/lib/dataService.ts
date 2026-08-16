import {
  Couple,
  DatePlan,
  Idea,
  Memory,
  Profile,
} from '@/types/bridge';
import { mockCouple, mockIdeas, mockMemories, mockPlans, mockProfiles } from './mockData';
import { isSupabaseConfigured } from './supabase';

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

// When Supabase is configured, this is where a SupabaseDataService gets
// returned instead. Screens never need to know which one they got.
export function createDataService(): BridgeDataService {
  if (isSupabaseConfigured) {
    // TODO: return new SupabaseDataService() once implemented.
    console.warn('Supabase configured but SupabaseDataService not implemented; using mock.');
  }
  return new MockDataService();
}
