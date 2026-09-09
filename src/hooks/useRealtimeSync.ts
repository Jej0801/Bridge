import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useBridgeStore } from '@/store/useBridgeStore';

/**
 * Hook to subscribe to real-time updates for the couple's data
 * Automatically syncs ideas, plans, and memories when partner makes changes
 */
export function useRealtimeSync() {
  const coupleId = useBridgeStore((s) => s.couple?.id);
  const loadIdeas = useBridgeStore((s) => s.loadIdeas);
  const loadPlans = useBridgeStore((s) => s.loadPlans);
  const loadMemories = useBridgeStore((s) => s.loadMemories);

  useEffect(() => {
    if (!isSupabaseConfigured || !coupleId) {
      return;
    }

    const supabase = getSupabase();
    const channels: RealtimeChannel[] = [];

    // Subscribe to ideas changes
    const ideasChannel = supabase
      .channel(`ideas:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'ideas',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          console.log('Ideas realtime update:', payload);
          // Reload ideas when any change occurs
          loadIdeas();
        }
      )
      .subscribe((status) => {
        console.log('Ideas channel status:', status);
      });

    channels.push(ideasChannel);

    // Subscribe to date plans changes
    const plansChannel = supabase
      .channel(`plans:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_plans',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          console.log('Plans realtime update:', payload);
          loadPlans();
        }
      )
      .subscribe((status) => {
        console.log('Plans channel status:', status);
      });

    channels.push(plansChannel);

    // Subscribe to memories changes
    const memoriesChannel = supabase
      .channel(`memories:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          console.log('Memories realtime update:', payload);
          loadMemories();
        }
      )
      .subscribe((status) => {
        console.log('Memories channel status:', status);
      });

    channels.push(memoriesChannel);

    // Subscribe to couple profile changes
    const coupleChannel = supabase
      .channel(`couple:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'couples',
          filter: `id=eq.${coupleId}`,
        },
        (payload) => {
          console.log('Couple profile updated:', payload);
          // Reload couple data
          const loadCouple = useBridgeStore.getState().loadCouple;
          loadCouple();
        }
      )
      .subscribe((status) => {
        console.log('Couple channel status:', status);
      });

    channels.push(coupleChannel);

    // Cleanup: unsubscribe from all channels
    return () => {
      console.log('Unsubscribing from realtime channels');
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [coupleId, loadIdeas, loadPlans, loadMemories]);
}

/**
 * Hook to show when partner is actively viewing/editing
 * Uses Realtime Presence to track online status
 */
export function usePresence() {
  const coupleId = useBridgeStore((s) => s.couple?.id);
  const currentUserId = useBridgeStore((s) => s.currentUserId);
  const currentUser = useBridgeStore((s) => s.currentUser);

  useEffect(() => {
    if (!isSupabaseConfigured || !coupleId || !currentUserId) {
      return;
    }

    const supabase = getSupabase();

    // Create a presence channel
    const presenceChannel = supabase.channel(`presence:${coupleId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    // Track presence
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('Presence state:', state);

        // You can use this to show "Partner is online" indicators
        const onlineUsers = Object.keys(state);
        console.log('Online users:', onlineUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as present
          await presenceChannel.track({
            user_id: currentUserId,
            display_name: currentUser?.display_name || 'Unknown',
            online_at: new Date().toISOString(),
          });
        }
      });

    // Cleanup
    return () => {
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [coupleId, currentUserId, currentUser?.display_name]);
}
