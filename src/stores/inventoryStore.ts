import { create } from 'zustand';
import type { InventoryItem, InventoryFilter, InventoryMovement } from '@/types';
import { inventoryService } from '@/api/inventory';

interface InventoryStore {
  items: InventoryItem[];
  movements: InventoryMovement[];
  filter: InventoryFilter;
  setFilter: (filter: Partial<InventoryFilter>) => void;
  createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  addMovement: (movement: { itemId: string; type: 'in' | 'out'; quantity: number; reason: string; ticketId?: string }) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: inventoryService.getAll(),
  movements: inventoryService.getAllMovements(),
  filter: {},
  
  setFilter: (newFilter) => set((state) => ({ 
    filter: { ...state.filter, ...newFilter } 
  })),
  
  createItem: (itemData) => {
    const newItem = inventoryService.create(itemData);
    set((state) => {
      if (state.items.some(i => i.id === newItem.id)) {
        return state;
      }
      return {
        items: [newItem, ...state.items]
      };
    });
    return newItem;
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

  addMovement: ({ itemId, type, quantity, reason, ticketId }) => {
    const item = get().items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity;
    get().updateItemQuantity(itemId, newQuantity);
    
    const newMovement = inventoryService.createMovement({
      itemId,
      type,
      quantity,
      reason,
      ticketId,
    });

    if (newMovement) {
      set((state) => ({
        movements: [...state.movements, newMovement]
      }));
    }
  },
}));
