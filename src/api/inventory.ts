import { mockInventory } from '@/data/mockDocuments';
import type { InventoryItem } from '@/types';

// In a real application, this would be an API client making HTTP requests
export const inventoryService = {
  getAll: (): InventoryItem[] => {
    return mockInventory;
  },

  create: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): InventoryItem => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as InventoryItem;
    
    mockInventory.push(newItem);
    return newItem;
  },

  update: (id: string, updates: Partial<InventoryItem>): InventoryItem | undefined => {
    const index = mockInventory.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    
    mockInventory[index] = { ...mockInventory[index], ...updates };
    return mockInventory[index];
  },
  
  delete: (id: string): void => {
    const index = mockInventory.findIndex(i => i.id === id);
    if (index !== -1) {
      mockInventory.splice(index, 1);
    }
  }
};
