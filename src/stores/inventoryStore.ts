import { create } from 'zustand';
import type { InventoryItem, InventoryMovement, InventoryCategory } from '@/types';
import { mockInventory, mockInventoryMovements } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

interface InventoryFilter {
  category?: InventoryCategory;
  search?: string;
  lowStock?: boolean;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  categories: Record<InventoryCategory, number>;
}

interface InventoryStore {
  // State
  items: InventoryItem[];
  movements: InventoryMovement[];
  filter: InventoryFilter;
  
  // Computed
  filteredItems: () => InventoryItem[];
  lowStockItems: () => InventoryItem[];
  stats: () => InventoryStats;
  
  // Actions
  setItems: (items: InventoryItem[]) => void;
  setFilter: (filter: InventoryFilter) => void;
  getItemById: (id: string) => InventoryItem | undefined;
  getItemMovements: (itemId: string) => InventoryMovement[];
  createItem: (data: {
    sku: string;
    name: string;
    category: InventoryCategory;
    description: string;
    quantity: number;
    minQuantity: number;
    unit: 'pcs' | 'kg' | 'l' | 'm' | 'box';
    price: number;
    location: string;
  }) => InventoryItem;
  updateItem: (itemId: string, data: Partial<InventoryItem>) => void;
  deleteItem: (itemId: string) => void;
  addMovement: (data: {
    itemId: string;
    type: 'in' | 'out';
    quantity: number;
    reason: string;
    ticketId?: string;
  }) => InventoryMovement | null;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  // Initial state
  items: mockInventory,
  movements: mockInventoryMovements,
  filter: {},
  
  // Computed selectors
  filteredItems: () => {
    const { items, filter } = get();
    return items.filter((item) => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.lowStock && item.quantity > item.minQuantity) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          item.sku.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  },
  
  lowStockItems: () => {
    const { items } = get();
    return items.filter(item => item.quantity <= item.minQuantity);
  },
  
  stats: () => {
    const { items } = get();
    const lowStock = items.filter(item => item.quantity <= item.minQuantity);
    const totalValue = items.reduce((sum, item) => sum + ((item.price ?? 0) * item.quantity), 0);
    
    const categories: Record<InventoryCategory, number> = {
      spare_parts: 0,
      consumables: 0,
      equipment: 0,
      tools: 0,
      other: 0,
    };
    
    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return {
      totalItems: items.length,
      lowStockItems: lowStock.length,
      totalValue,
      categories,
    };
  },
  
  // Actions
  setItems: (items) => set({ items }),
  
  setFilter: (filter) => set({ filter }),
  
  getItemById: (id) => {
    return get().items.find(i => i.id === id);
  },
  
  getItemMovements: (itemId) => {
    const { movements } = get();
    return movements
      .filter(m => m.itemId === itemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  createItem: (data) => {
    const { items } = get();
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ items: [...items, newItem] });
    return newItem;
  },
  
  updateItem: (itemId, data) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      }),
    }));
  },
  
  deleteItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(i => i.id !== itemId),
    }));
  },
  
  addMovement: (data) => {
    const { items, movements } = get();
    const item = items.find(i => i.id === data.itemId);
    if (!item) return null;

    const newMovement: InventoryMovement = {
      id: Date.now().toString(),
      itemId: data.itemId,
      item,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      ticketId: data.ticketId,
      createdAt: new Date().toISOString(),
      author: currentUser,
    };

    // Update item quantity
    const newQuantity = data.type === 'in' 
      ? item.quantity + data.quantity 
      : item.quantity - data.quantity;

    set((state) => ({
      movements: [newMovement, ...movements],
      items: state.items.map((i) => {
        if (i.id === data.itemId) {
          return {
            ...i,
            quantity: newQuantity,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      }),
    }));

    return newMovement;
  },
}));
