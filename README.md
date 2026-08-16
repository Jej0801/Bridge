# Bridge

Turn shared ideas into actual dates.

Bridge is a private, mobile-first space for couples: save date ideas from TikTok, Instagram, Maps, and anywhere else; turn them into real plans; and keep the dates you actually went on as a scrapbook of memories.

## Stack

- React Native + Expo (SDK 51) with Expo Router
- TypeScript (strict)
- Zustand for client state
- React Hook Form + Zod on forms
- Supabase-ready data layer (runs fully on local mock data by default)

## Getting started

```bash
npm install
npx expo start
```

Open in Expo Go (scan the QR code) or press `i` / `a` for a simulator, `w` for web.

No environment variables are required — without them the app runs on seeded local demo data. Sign in with any email, then create a couple space or enter any invite code.

Type-check with:

```bash
npm run typecheck
```

## Enabling Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`). It creates all tables plus couple-scoped Row Level Security.
3. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Implement `SupabaseDataService` against the `BridgeDataService` interface in `src/lib/dataService.ts`. Screens never talk to Supabase directly, so nothing else changes.

## Project layout

```
app/                  Expo Router routes
  (tabs)/             Home, Ideas, Memories, Settings
  auth/               Onboarding (sign in + couple space)
  ideas/new           Save-an-idea modal
  plans/new, [id]     Plan builder and plan detail
  memories/new, [id]  Log-a-memory modal and memory detail
src/
  components/         Shared UI (ui.tsx, IdeaCard, MemoryCard)
  lib/                dataService (mock + interface), datePlanner, supabase, mockData
  store/              Zustand store (single source of client state)
  theme/              colors / spacing / typography tokens
  types/              Domain types mirroring the SQL schema
supabase/migrations/  0001_init.sql
```

## What's mocked

- **Auth** — any email signs in; swap for `supabase.auth` (OTP or password).
- **Couple invite** — any code joins the seeded couple; real flow should look up `couples.invite_code`.
- **Persistence** — in-memory `MockDataService`; state resets on reload.
- **"Generate plan"** — `src/lib/datePlanner.ts` orders ideas (activity → drinks → food), estimates times/budget, and picks a backup. It returns the same `Itinerary` shape an AI service should produce (`generated_by: 'mock' | 'ai'`).
- **Photos** — placeholder panels; wire to `expo-image-picker` + Supabase Storage (`memory_photos.storage_path`).
- **TikTok/Instagram enrichment** — deliberately not integrated. Ideas arrive via pasted/shared URLs with user-entered metadata; `inferSource()` detects the source from the URL so server-side enrichment (oEmbed/OpenGraph scraping) can be added later without UI changes.

## Suggested next steps

1. Real Supabase auth + `SupabaseDataService`, plus persistence of mock actions to AsyncStorage in the meantime.
2. Native share-sheet intake (`expo-share-intent` or a custom share extension) so links land in the inbox from TikTok/Instagram directly.
3. Server-side link enrichment: fetch OpenGraph/oEmbed metadata to fill title + thumbnail on save.
4. Photo upload for memories (image picker → Supabase Storage → `memory_photos`).
5. Real invite-code join flow with deep links (`bridge://join/CODE`).
6. Replace the mock planner with an AI planning service behind the same `generateItinerary` contract.
7. Push notifications for upcoming planned dates.
