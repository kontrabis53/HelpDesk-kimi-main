import { create } from 'zustand';
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

export const useDirectoryStore = create<DirectoryStore>((set, get) => ({
  entries: mockDirectory,
  searchQuery: '',
  // Mock search stats for initial week
  searchStats: [
    { query: '306', count: 45, lastSearched: new Date().toISOString() },
    { query: 'Сисадмин', count: 32, lastSearched: new Date().toISOString() },
    { query: 'Бухгалтерия', count: 28, lastSearched: new Date().toISOString() },
    { query: 'Завхоз', count: 15, lastSearched: new Date().toISOString() },
  ],

  setSearchQuery: (query) => set({ searchQuery: query }),

  recordSearch: (query) => {
    if (!query || query.length < 2) return;
    
    set((state) => {
      const normalizedQuery = query.trim().toLowerCase();
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
            { query: query.trim(), count: 1, lastSearched: new Date().toISOString() }
          ]
        };
      }
    });
  },

  getTopStats: (limit = 3) => {
    return [...get().searchStats]
      .sort((a, b) => b.count - a.count)
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
}));
