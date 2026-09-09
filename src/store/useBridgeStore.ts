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
import { createAuthService, AuthService } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

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
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  createCouple: (name: string) => Promise<void>;
  joinCouple: (inviteCode: string) => Promise<boolean>;
  updateCouple: (coupleId: string, patch: Partial<Couple>) => Promise<void>;
  updateProfile: (userId: string, patch: Partial<Profile>) => Promise<void>;
  uploadCouplePhoto: (imageUri: string) => Promise<void>;

  loadIdeas: () => Promise<void>;
  loadPlans: () => Promise<void>;
  loadMemories: () => Promise<void>;
  loadCouple: () => Promise<void>;
  currentUser: Profile | null;

  addIdea: (input: NewIdea) => Promise<Idea>;
  updateIdea: (id: string, patch: Partial<Idea>) => Promise<void>;
  addPlan: (input: NewPlan) => Promise<DatePlan>;
  updatePlan: (id: string, patch: Partial<DatePlan>) => Promise<void>;
  addMemory: (input: NewMemory) => Promise<Memory>;

  stats: () => CoupleStats;
  profileName: (userId: string) => string;
}

const service: BridgeDataService = createDataService();
const authService: AuthService = createAuthService();

export const useBridgeStore = create<BridgeState>((set, get) => ({
  hydrated: false,
  signedIn: false,
  currentUserId: 'user-you',
  profiles: [],
  couple: null,
  ideas: [],
  plans: [],
  memories: [],

  get currentUser() {
    const { profiles, currentUserId } = get();
    return profiles.find((p) => p.id === currentUserId) || null;
  },

  hydrate: async () => {
    if (get().hydrated) return;

    // Check if user is authenticated
    const user = await authService.getCurrentUser();
    if (!user) {
      set({ hydrated: true, signedIn: false });
      return;
    }

    // Load data from service
    const data = await service.loadInitial();
    set({
      hydrated: true,
      signedIn: true,
      currentUserId: user.id,
      profiles: data.profiles,
      couple: data.couple,
      ideas: data.ideas,
      plans: data.plans,
      memories: data.memories,
    });
  },

  signIn: async (email: string) => {
    const result = await authService.signInWithEmail(email);
    if (result.error) {
      console.error('Sign in error:', result.error);
      return;
    }

    // With Supabase, user needs to verify OTP. With mock, instant sign in.
    if (!result.needsVerification) {
      const user = await authService.getCurrentUser();
      if (user) {
        set({ signedIn: true, currentUserId: user.id });
      }
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({
      signedIn: false,
      currentUserId: '',
      couple: null,
      profiles: [],
      ideas: [],
      plans: [],
      memories: [],
    });
  },

  createCouple: async (name: string) => {
    const couple = await authService.createCouple(name);
    set({ couple });
  },

  joinCouple: async (inviteCode: string) => {
    const couple = await authService.joinCouple(inviteCode);
    if (couple) {
      set({ couple });
      return true;
    }
    return false;
  },

  updateCouple: async (coupleId, patch) => {
    const { couple } = get();
    if (!couple || couple.id !== coupleId) return;

    // Update locally first
    const updated = { ...couple, ...patch };
    set({ couple: updated });

    // If using Supabase, persist to backend
    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      await supabase
        .from('couples')
        .update(patch)
        .eq('id', coupleId);
    }
  },

  updateProfile: async (userId, patch) => {
    const { profiles } = get();

    // Update locally first
    const updated = profiles.map((p) =>
      p.id === userId ? { ...p, ...patch } : p
    );
    set({ profiles: updated });

    // If using Supabase, persist to backend
    if (isSupabaseConfigured) {
      const supabase = getSupabase();
      await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId);
    }
  },

  uploadCouplePhoto: async (imageUri) => {
    const { couple } = get();
    if (!couple) throw new Error('No couple found');

    // Upload using storage service (handles both Supabase and mock modes)
    const { createStorageService } = require('@/lib/storage');
    const storageService = createStorageService();
    const photoUrl = await storageService.uploadCouplePhoto(couple.id, imageUri);

    await get().updateCouple(couple.id, { photo_url: photoUrl });
  },

  loadIdeas: async () => {
    const { couple } = get();
    if (!couple) return;

    const data = await service.loadInitial();
    set({ ideas: data.ideas });
  },

  loadPlans: async () => {
    const { couple } = get();
    if (!couple) return;

    const data = await service.loadInitial();
    set({ plans: data.plans });
  },

  loadMemories: async () => {
    const { couple } = get();
    if (!couple) return;

    const data = await service.loadInitial();
    set({ memories: data.memories });
  },

  loadCouple: async () => {
    const data = await service.loadInitial();
    set({ couple: data.couple, profiles: data.profiles });
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
