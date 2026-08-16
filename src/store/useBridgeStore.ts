import { create } from 'zustand';
import {
  Couple,
  CoupleStats,
  DatePlan,
  Idea,
  IdeaCategory,
  Memory,
  Profile,
} from '@/types/bridge';
import {
  BridgeDataService,
  createDataService,
  NewIdea,
  NewMemory,
  NewPlan,
} from '@/lib/dataService';

// Single client-side store. Screens read state and call actions; the
// actions delegate persistence to the data service.

interface BridgeState {
  hydrated: boolean;
  // Auth is mocked locally: signedIn + hasCouple gate the router.
  signedIn: boolean;
  currentUserId: string;
  profiles: Profile[];
  couple: Couple | null;
  ideas: Idea[];
  plans: DatePlan[];
  memories: Memory[];

  hydrate: () => Promise<void>;
  signIn: (email: string) => void;
  signOut: () => void;
  createCouple: (name: string) => void;
  joinCouple: (inviteCode: string) => boolean;

  addIdea: (input: NewIdea) => Promise<Idea>;
  updateIdea: (id: string, patch: Partial<Idea>) => Promise<void>;
  addPlan: (input: NewPlan) => Promise<DatePlan>;
  updatePlan: (id: string, patch: Partial<DatePlan>) => Promise<void>;
  addMemory: (input: NewMemory) => Promise<Memory>;

  stats: () => CoupleStats;
  profileName: (userId: string) => string;
}

const service: BridgeDataService = createDataService();

export const useBridgeStore = create<BridgeState>((set, get) => ({
  hydrated: false,
  signedIn: false,
  currentUserId: 'user-you',
  profiles: [],
  couple: null,
  ideas: [],
  plans: [],
  memories: [],

  hydrate: async () => {
    if (get().hydrated) return;
    const data = await service.loadInitial();
    set({
      hydrated: true,
      profiles: data.profiles,
      ideas: data.ideas,
      plans: data.plans,
      memories: data.memories,
      // Couple is attached on sign-in/join in this mock pass.
    });
  },

  signIn: (_email: string) => {
    set({ signedIn: true });
  },

  signOut: () => set({ signedIn: false, couple: null }),

  createCouple: (name: string) => {
    const couple: Couple = {
      id: 'couple-1',
      name: name.trim() || 'Us',
      invite_code: 'BRIDGE-7K2M',
      created_at: new Date().toISOString(),
    };
    set({ couple });
  },

  joinCouple: (inviteCode: string) => {
    // Mock: any non-empty code joins the seeded couple space.
    if (!inviteCode.trim()) return false;
    set({
      couple: {
        id: 'couple-1',
        name: 'Us',
        invite_code: inviteCode.trim().toUpperCase(),
        created_at: new Date().toISOString(),
      },
    });
    return true;
  },

  addIdea: async (input) => {
    const { currentUserId, couple } = get();
    const idea = await service.createIdea(input, currentUserId, couple?.id ?? 'couple-1');
    set((s) => ({ ideas: [idea, ...s.ideas] }));
    return idea;
  },

  updateIdea: async (id, patch) => {
    const updated = await service.updateIdea(id, patch);
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? updated : i)) }));
  },

  addPlan: async (input) => {
    const { currentUserId, couple } = get();
    const plan = await service.createPlan(input, currentUserId, couple?.id ?? 'couple-1');
    set((s) => ({ plans: [plan, ...s.plans] }));
    // Ideas pulled into a plan advance to "planned".
    for (const ideaId of input.idea_ids) {
      await get().updateIdea(ideaId, { status: 'planned' });
    }
    return plan;
  },

  updatePlan: async (id, patch) => {
    const updated = await service.updatePlan(id, patch);
    set((s) => ({ plans: s.plans.map((p) => (p.id === id ? updated : p)) }));
  },

  addMemory: async (input) => {
    const { currentUserId, couple } = get();
    const memory = await service.createMemory(input, currentUserId, couple?.id ?? 'couple-1');
    set((s) => ({ memories: [memory, ...s.memories] }));
    for (const ideaId of input.idea_ids) {
      await get().updateIdea(ideaId, { status: 'done' });
    }
    return memory;
  },

  stats: () => {
    const { ideas, memories } = get();
    const active = ideas.filter((i) => i.status !== 'archived');
    const counts = new Map<IdeaCategory, number>();
    for (const idea of active) {
      counts.set(idea.category, (counts.get(idea.category) ?? 0) + 1);
    }
    let favorite: IdeaCategory | null = null;
    let max = 0;
    counts.forEach((count, category) => {
      if (count > max) {
        max = count;
        favorite = category;
      }
    });
    return {
      dates_logged: memories.length,
      ideas_saved: active.length,
      favorite_category: favorite,
    };
  },

  profileName: (userId: string) => {
    return get().profiles.find((p) => p.id === userId)?.display_name ?? 'Partner';
  },
}));
