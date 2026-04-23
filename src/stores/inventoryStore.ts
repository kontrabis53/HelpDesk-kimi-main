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
    const newItem = await inventoryService.create(itemData);
    set((state) => ({
      items: [newItem, ...state.items]
    }));
    return newItem;
  },
  
  updateItemQuantity: async (id, quantity) => {
    const updated = await inventoryService.update(id, { quantity });
    set((state) => ({
      items: state.items.map((i) => i.id === id ? updated : i),
    }));
  },
  
  deleteItem: async (id) => {
    await inventoryService.delete(id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },
}));
