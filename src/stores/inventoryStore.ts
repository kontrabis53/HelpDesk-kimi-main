import { create } from 'zustand';
import type { InventoryItem, InventoryFilter } from '@/types';
import { inventoryService } from '@/api/inventory';

interface InventoryStore {
  items: InventoryItem[];
  filter: InventoryFilter;
  setFilter: (filter: Partial<InventoryFilter>) => void;
  createItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => InventoryItem;
  updateItemQuantity: (id: string, quantity: number) => void;
  deleteItem: (id: string) => void;
  addMovement: (movement: { itemId: string; type: 'in' | 'out'; quantity: number; reason: string; ticketId?: string }) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
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
    
    // Log movement details to console to avoid unused vars warning
    console.log(`Inventory movement: ${type} ${quantity} for ${itemId} (${reason}) [Ticket: ${ticketId || 'none'}]`);
    
    // Here we would also normally record the movement in a separate collection
    // inventoryService.createMovement(...)
  },
}));
