import { CostLevel, Idea, Itinerary, ItineraryStop, Vibe } from '@/types/bridge';

// Mock plan generator. Deliberately shaped like a service boundary:
// `generateItinerary(input) -> Itinerary` is the exact contract an AI
// planner can implement later (see `generated_by`).

export interface PlannerInput {
  ideas: Idea[];
  vibe: Vibe;
  startTime?: string; // "7:00 PM" style; defaults below
}

const CATEGORY_ORDER: Record<string, number> = {
  activity: 1,
  outdoors: 1,
  event: 2,
  drinks: 3,
  food: 4,
  cheap: 4,
  fancy: 4,
  cozy: 5,
  travel: 0,
  other: 3,
};

const DURATION_BY_CATEGORY: Record<string, number> = {
  food: 90,
  drinks: 75,
  activity: 90,
  event: 120,
  outdoors: 75,
  travel: 180,
  cozy: 90,
  fancy: 120,
  cheap: 60,
  other: 60,
};

const COST_VALUE: Record<CostLevel, number> = { free: 0, $: 20, $$: 55, $$$: 120 };

function parseStart(time: string): { h: number; m: number } {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { h: 18, m: 30 };
  let h = parseInt(match[1], 10) % 12;
  if (match[3].toUpperCase() === 'PM') h += 12;
  return { h, m: parseInt(match[2], 10) };
}

function formatTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function vibeNote(vibe: Vibe, idea: Idea): string {
  switch (vibe) {
    case 'cozy':
      return `Keep it slow — no rushing out of ${idea.location_name ?? 'here'}.`;
    case 'romantic':
      return 'Phones away for this one.';
    case 'adventurous':
      return 'Say yes to whatever comes up here.';
    case 'fancy':
      return 'Dress up a little. It counts.';
    case 'spontaneous':
      return 'Skippable if something better appears.';
    default:
      return idea.description ?? 'No pressure, just show up.';
  }
}

export function generateItinerary(input: PlannerInput): Itinerary {
  const { ideas, vibe } = input;
  if (ideas.length === 0) {
    return {
      stops: [],
      total_minutes: 0,
      budget_estimate: '—',
      backup: null,
      generated_by: 'mock',
    };
  }

  // Order by a rough "shape of a good evening": activity → drinks → food.
  const ordered = [...ideas].sort(
    (a, b) => (CATEGORY_ORDER[a.category] ?? 3) - (CATEGORY_ORDER[b.category] ?? 3)
  );

  // The last idea becomes the backup when there are 3+, so the main plan
  // stays tight and there is always an escape hatch.
  const mainIdeas = ordered.length >= 3 ? ordered.slice(0, -1) : ordered;
  const backupIdea = ordered.length >= 3 ? ordered[ordered.length - 1] : null;

  let { h, m } = parseStart(input.startTime ?? '6:30 PM');
  const stops: ItineraryStop[] = mainIdeas.map((idea, i) => {
    const duration = DURATION_BY_CATEGORY[idea.category] ?? 75;
    const stop: ItineraryStop = {
      order: i + 1,
      title: idea.title,
      idea_id: idea.id,
      start_time: formatTime(h, m),
      duration_minutes: duration,
      note: vibeNote(vibe, idea),
    };
    // Advance clock + 15 min travel buffer between stops.
    const total = m + duration + 15;
    h = (h + Math.floor(total / 60)) % 24;
    m = total % 60;
    return stop;
  });

  const totalMinutes = stops.reduce((sum, s) => sum + s.duration_minutes, 0);
  const low = mainIdeas.reduce((sum, i) => sum + COST_VALUE[i.cost_level] * 0.7, 0);
  const high = mainIdeas.reduce((sum, i) => sum + COST_VALUE[i.cost_level] * 1.4, 0);
  const budget =
    high === 0 ? 'Free' : `$${Math.round(low / 5) * 5}–${Math.round(high / 5) * 5} for two`;

  return {
    stops,
    total_minutes: totalMinutes,
    budget_estimate: budget,
    backup: backupIdea
      ? {
          idea_id: backupIdea.id,
          title: backupIdea.title,
          reason: 'Held in reserve — swap it in if a stop falls through.',
        }
      : null,
    generated_by: 'mock',
  };
}
