import { create } from 'zustand';
import type { InventoryItem, InventoryFilter } from '@/types';
import { inventoryService } from '@/api/inventory';

interface InventoryStore {
  items: InventoryItem[];
  filter: InventoryFilter;
  isLoading: boolean;
  
  fetchItems: () => Promise<void>;
  setFilter: (filter: Partial<InventoryFilter>) => void;
  createItem: (item: any) => Promise<InventoryItem>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
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
    } catch (error) {
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
    } catch (error) {
      console.error('Update quantity error:', error);
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
    } catch (error) {
      console.error('Delete item error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
