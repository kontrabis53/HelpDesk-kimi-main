import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DirectoryEntry, SearchStat } from '@/types';
import { directoryService } from '@/api/directory';

interface DirectoryStore {
  entries: DirectoryEntry[];
  searchStats: SearchStat[];
  searchQuery: string;
  isLoading: boolean;
  
  fetchEntries: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  recordSearch: (query: string) => void;
  getTopStats: (limit?: number) => SearchStat[];
  addEntry: (entry: any) => Promise<void>;
  updateEntry: (id: string, updates: Partial<DirectoryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useDirectoryStore = create<DirectoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      searchQuery: '',
      isLoading: false,
      searchStats: [
        { query: '306', count: 10, lastSearched: new Date().toISOString() },
        { query: 'Регистратура', count: 8, lastSearched: new Date().toISOString() },
        { query: 'Сисадмин', count: 6, lastSearched: new Date().toISOString() },
        { query: 'Лаборатория', count: 4, lastSearched: new Date().toISOString() },
      ],

      fetchEntries: async () => {
        set({ isLoading: true });
        try {
          const entries = await directoryService.getAll();
          set({ entries, isLoading: false });
        } catch (error: any) {
          console.error('Fetch directory error:', error);
          set({ isLoading: false });
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      recordSearch: (query) => {
        const q = query.trim();
        if (!q || q.length < 3) return;
        
        set((state) => {
          const normalizedQuery = q.toLowerCase();
          const existingStat = state.searchStats.find(s => s.query.toLowerCase() === normalizedQuery);
          
          if (existingStat) {
            return {
              searchStats: state.searchStats.map(s => 
                s.query.toLowerCase() === normalizedQuery 
                  ? { ...s, count: s.count + 1, lastSearched: new Date().toISOString() } 
                  : s
              )
            };
          } else {
            return {
              searchStats: [
                ...state.searchStats,
                { query: q, count: 1, lastSearched: new Date().toISOString() }
              ]
            };
          }
        });
      },

      getTopStats: (limit = 4) => {
        return [...get().searchStats]
          .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime();
          })
          .slice(0, limit);
      },

      addEntry: async (entryData) => {
        const newEntry = await directoryService.create(entryData);
        set((state) => ({
          entries: [newEntry, ...state.entries]
        }));
      },

      updateEntry: async (id, updates) => {
        const updated = await directoryService.update(id, updates);
        set((state) => ({
          entries: state.entries.map(e => e.id === id ? updated : e)
        }));
      },

      deleteEntry: async (id) => {
        await directoryService.delete(id);
        set((state) => ({
          entries: state.entries.filter(e => e.id !== id)
        }));
      }
    }),
    {
      name: 'directory-storage',
      partialize: (state) => ({ searchStats: state.searchStats }),
    }
  )
);
