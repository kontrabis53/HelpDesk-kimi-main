import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DirectoryEntry, SearchStat } from '@/types';
import { mockDirectory } from '@/data/mockDirectory';

interface DirectoryStore {
  entries: DirectoryEntry[];
  searchStats: SearchStat[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recordSearch: (query: string) => void;
  getTopStats: (limit?: number) => SearchStat[];
  addEntry: (entry: Omit<DirectoryEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<DirectoryEntry>) => void;
  deleteEntry: (id: string) => void;
}

export const useDirectoryStore = create<DirectoryStore>()(
  persist(
    (set, get) => ({
      entries: mockDirectory,
      searchQuery: '',
      // Initial stats to show something useful
      searchStats: [
        { query: '306', count: 10, lastSearched: new Date().toISOString() },
        { query: 'Регистратура', count: 8, lastSearched: new Date().toISOString() },
        { query: 'Сисадмин', count: 6, lastSearched: new Date().toISOString() },
        { query: 'Лаборатория', count: 4, lastSearched: new Date().toISOString() },
      ],

      setSearchQuery: (query) => set({ searchQuery: query }),

      recordSearch: (query) => {
        const q = query.trim();
        // Condition: search query must be at least 3 characters long to be "frequent"
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
            // Sorting algorithm: 
            // 1. By count (popularity)
            // 2. By date (freshness) if count is equal
            if (b.count !== a.count) return b.count - a.count;
            return new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime();
          })
          .slice(0, limit);
      },

      addEntry: (entryData) => {
        const newEntry: DirectoryEntry = {
          ...entryData,
          id: Date.now().toString(),
        };
        set((state) => ({
          entries: [newEntry, ...state.entries]
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },

      deleteEntry: (id) => {
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
