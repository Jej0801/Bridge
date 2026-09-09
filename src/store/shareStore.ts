import { create } from "zustand";
import {
  submitSharedLink,
  listSharedContent,
  waitForEnrichment,
  type SharedContent,
} from "@/lib/shareService";

interface ShareStoreState {
  items: SharedContent[];
  isProcessing: boolean;
  error: string | null;

  ingestSharedUrl: (userId: string, url: string) => Promise<void>;
  loadSharedContent: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useShareStore = create<ShareStoreState>((set) => ({
  items: [],
  isProcessing: false,
  error: null,

  ingestSharedUrl: async (userId: string, url: string) => {
    set({ isProcessing: true, error: null });
    try {
      const created = await submitSharedLink(userId, url);
      // Optimistically show it as pending immediately...
      set((state) => ({ items: [created, ...state.items] }));

      // ...then swap in the enriched version once oEmbed finishes.
      const enriched = await waitForEnrichment(created.id);
      set((state) => ({
        items: state.items.map((item) => (item.id === enriched.id ? enriched : item)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save shared link" });
    } finally {
      set({ isProcessing: false });
    }
  },

  loadSharedContent: async (userId: string) => {
    try {
      const items = await listSharedContent(userId);
      set({ items });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load shared content" });
    }
  },

  clearError: () => set({ error: null }),
}));
