import { getSupabase, isSupabaseConfigured } from './supabase';
import { Couple, Profile } from '@/types/bridge';

// Auth service that works with both mock and real Supabase auth
export interface AuthService {
  signInWithEmail(email: string): Promise<{ needsVerification: boolean; error?: string }>;
  verifyOTP(email: string, token: string): Promise<{ success: boolean; error?: string }>;
  getCurrentUser(): Promise<{ id: string; email: string } | null>;
  signOut(): Promise<void>;
  createProfile(displayName: string): Promise<Profile>;
  createCouple(name: string): Promise<Couple>;
  joinCouple(inviteCode: string): Promise<Couple | null>;
  getCouple(): Promise<Couple | null>;
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = 'BRIDGE-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class SupabaseAuthService implements AuthService {
  private supabase = getSupabase();

  async signInWithEmail(email: string): Promise<{ needsVerification: boolean; error?: string }> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        // emailRedirectTo is only needed for web, can be omitted for mobile
        shouldCreateUser: true,
      },
    });

    if (error) {
      return { needsVerification: false, error: error.message };
    }

    return { needsVerification: true };
  }

  async verifyOTP(email: string, token: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user?.email) return null;
    return { id: user.id, email: user.email };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async createProfile(displayName: string): Promise<Profile> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    // Check if profile already exists
    const { data: existing } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) return existing;

    // Create new profile
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createCouple(name: string): Promise<Couple> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    const inviteCode = generateInviteCode();

    // Create couple
    const { data: couple, error: coupleError } = await this.supabase
      .from('couples')
      .insert({
        name: name.trim() || 'Us',
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (coupleError) throw coupleError;

    // Add user as owner
    const { error: memberError } = await this.supabase
      .from('couple_members')
      .insert({
        couple_id: couple.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return couple;
  }

  async joinCouple(inviteCode: string): Promise<Couple | null> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No authenticated user');

    // Find couple by invite code
    const { data: couple, error: findError } = await this.supabase
      .from('couples')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single();

    if (findError || !couple) return null;

    // Check if already a member
    const { data: existing } = await this.supabase
      .from('couple_members')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('user_id', user.id)
      .single();

    if (existing) return couple;

    // Add user as partner
    const { error: memberError } = await this.supabase
      .from('couple_members')
      .insert({
        couple_id: couple.id,
        user_id: user.id,
        role: 'partner',
      });

    if (memberError) throw memberError;

    return couple;
  }

  async getCouple(): Promise<Couple | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data: membership } = await this.supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .single();

    if (!membership) return null;

    const { data: couple } = await this.supabase
      .from('couples')
      .select('*')
      .eq('id', membership.couple_id)
      .single();

    return couple || null;
  }
}

class MockAuthService implements AuthService {
  private mockUser: { id: string; email: string } | null = null;
  private mockCouple: Couple | null = null;

  async signInWithEmail(email: string): Promise<{ needsVerification: boolean; error?: string }> {
    // Mock: instantly sign in
    this.mockUser = { id: 'user-you', email };
    return { needsVerification: false };
  }

  async verifyOTP(_email: string, _token: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    return this.mockUser;
  }

  async signOut(): Promise<void> {
    this.mockUser = null;
    this.mockCouple = null;
  }

  async createProfile(displayName: string): Promise<Profile> {
    return {
      id: 'user-you',
      display_name: displayName,
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
  }

  async createCouple(name: string): Promise<Couple> {
    this.mockCouple = {
      id: 'couple-1',
      name: name.trim() || 'Us',
      photo_url: null,
      invite_code: 'BRIDGE-7K2M',
      created_at: new Date().toISOString(),
    };
    return this.mockCouple;
  }

  async joinCouple(inviteCode: string): Promise<Couple | null> {
    if (!inviteCode.trim()) return null;
    this.mockCouple = {
      id: 'couple-1',
      name: 'Us',
      photo_url: null,
      invite_code: inviteCode.trim().toUpperCase(),
      created_at: new Date().toISOString(),
    };
    return this.mockCouple;
  }

  async getCouple(): Promise<Couple | null> {
    return this.mockCouple;
  }
}

export function createAuthService(): AuthService {
  if (isSupabaseConfigured) {
    return new SupabaseAuthService();
  }
  return new MockAuthService();
}
