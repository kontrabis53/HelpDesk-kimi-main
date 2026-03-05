import { create } from 'zustand';
import type { InventoryItem, InventoryFilter } from '@/types';
import { inventoryService } from '@/api/inventory';

interface InventoryStore {
  items: InventoryItem[];
  filter: InventoryFilter;
  setFilter: (filter: Partial<InventoryFilter>) => void;
  createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: inventoryService.getAll(),
  filter: {},
  
  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  createItem: (itemData) => {
    const newItem = inventoryService.create(itemData);
    set((state) => ({
      items: [...state.items, newItem]
    }));
  },
  
  updateItemQuantity: (id, quantity) => {
    inventoryService.update(id, { quantity, updatedAt: new Date().toISOString() });
    set((state) => ({
      items: state.items.map((i) => 
        i.id === id ? { ...i, quantity, updatedAt: new Date().toISOString() } : i
      ),
    }));
  },
  
  deleteItem: (id) => {
    inventoryService.delete(id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },
}));
