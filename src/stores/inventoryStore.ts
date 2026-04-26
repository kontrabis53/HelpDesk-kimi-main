import { create } from 'zustand';
import type { InventoryItem, InventoryFilter } from '@/types';
import { inventoryService } from '@/api/inventory';

interface InventoryStore {
  items: InventoryItem[];
  filter: InventoryFilter;
  isLoading: boolean;
  
  fetchItems: () => Promise<void>;
  fetchItem: (id: string) => Promise<InventoryItem>;
  setFilter: (filter: Partial<InventoryFilter>) => void;
  createItem: (item: any) => Promise<InventoryItem>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  filter: {},
  isLoading: false,
  
  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await inventoryService.getAll();
      set({ items, isLoading: false });
    } catch (error: any) {
      console.error('Fetch items error:', error);
      set({ isLoading: false });
    }
  },

  fetchItem: async (id) => {
    set({ isLoading: true });
    try {
      const item = await inventoryService.getById(id);
      set((state) => ({
        items: state.items.some(i => i.id === id) 
          ? state.items.map(i => i.id === id ? item : i)
          : [...state.items, item],
        isLoading: false
      }));
      return item;
    } catch (error: any) {
      console.error('Fetch item error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  createItem: async (itemData) => {
    set({ isLoading: true });
    try {
      const newItem = await inventoryService.create(itemData);
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false
      }));
      return newItem;
    } catch (error: any) {
      console.error('Create item error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateItemQuantity: async (id, quantity) => {
    set({ isLoading: true });
    try {
      const updated = await inventoryService.update(id, { quantity });
      set((state) => ({
        items: state.items.map((i) => i.id === id ? updated : i),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update quantity error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateItem: async (id, data) => {
    set({ isLoading: true });
    try {
      const updated = await inventoryService.update(id, data);
      set((state) => ({
        items: state.items.map((i) => i.id === id ? updated : i),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update item error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteItem: async (id) => {
    set({ isLoading: true });
    try {
      await inventoryService.delete(id);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Delete item error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
