import { mockInventory, mockInventoryMovements } from '@/data/mockDocuments';
import type { InventoryItem, InventoryMovement } from '@/types';
import { currentUser } from '@/data/mock';

// In a real application, this would be an API client making HTTP requests
export const inventoryService = {
  getAll: (): InventoryItem[] => {
    return mockInventory;
  },

  getAllMovements: (): InventoryMovement[] => {
    return mockInventoryMovements;
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

  createMovement: (movement: Omit<InventoryMovement, 'id' | 'createdAt' | 'author' | 'item'>): InventoryMovement | undefined => {
    const item = mockInventory.find(i => i.id === movement.itemId);
    if (!item) return undefined;

    const newMovement: InventoryMovement = {
      ...movement,
      id: Date.now().toString(),
      item,
      createdAt: new Date().toISOString(),
      author: currentUser, // Using imported currentUser mock
    };
    
    mockInventoryMovements.push(newMovement);
    return newMovement;
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
