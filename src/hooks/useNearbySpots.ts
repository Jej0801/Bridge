import { useState, useEffect } from 'react';
import { useBridgeStore } from '@/store/useBridgeStore';
import { Idea } from '@/types/bridge';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

interface NearbySpot {
  id: string;
  title: string;
  location_name: string | null;
  distance_km: number;
}

/**
 * Find spots near a given location using the nearby_ideas SQL function
 */
export function useNearbySpots(
  latitude: number | null,
  longitude: number | null,
  radiusKm: number = 5,
  limitCount: number = 10
) {
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ideas = useBridgeStore((s) => s.ideas);

  useEffect(() => {
    if (!latitude || !longitude) {
      setNearbySpots([]);
      return;
    }

    async function fetchNearbySpots() {
      // TypeScript guard: we know these are non-null because of the check above
      if (latitude === null || longitude === null) return;

      setLoading(true);
      setError(null);

      try {
        if (isSupabaseConfigured) {
          // Use Supabase function
          const supabase = getSupabase();
          const { data, error: rpcError } = await supabase.rpc('nearby_ideas', {
            idea_lat: latitude,
            idea_lng: longitude,
            radius_km: radiusKm,
            limit_count: limitCount,
          });

          if (rpcError) {
            console.error('Nearby spots RPC error:', rpcError);
            setError(rpcError.message);
            return;
          }

          setNearbySpots(data || []);
        } else {
          // Fallback: calculate distances locally (mock mode)
          const nearby = ideas
            .filter((idea) => idea.latitude != null && idea.longitude != null && idea.id)
            .map((idea) => {
              const distance = calculateDistance(
                latitude,
                longitude,
                idea.latitude as number,
                idea.longitude as number
              );
              return {
                id: idea.id!,
                title: idea.title,
                location_name: idea.location_name,
                distance_km: distance,
              };
            })
            .filter((spot) => spot.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, limitCount);

          setNearbySpots(nearby);
        }
      } catch (err) {
        console.error('Error fetching nearby spots:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch nearby spots');
      } finally {
        setLoading(false);
      }
    }

    fetchNearbySpots();
  }, [latitude, longitude, radiusKm, limitCount, ideas]);

  return { nearbySpots, loading, error };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
