import { useState, useCallback, useMemo } from 'react';
import type { InventoryItem, InventoryMovement, InventoryCategory } from '@/types';
import { mockInventory, mockInventoryMovements } from '@/data/mockDocuments';
import { currentUser } from '@/data/mock';

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [movements, setMovements] = useState<InventoryMovement[]>(mockInventoryMovements);
  const [filter, setFilter] = useState<{ category?: InventoryCategory; search?: string; lowStock?: boolean }>({});

  const filteredItems = useMemo(() => {
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
  }, [items, filter]);

  const getLowStockItems = useMemo(() => {
    return items.filter(item => item.quantity <= item.minQuantity);
  }, [items]);

  const getItemById = useCallback((id: string) => {
    return items.find(i => i.id === id);
  }, [items]);

  const getItemMovements = useCallback((itemId: string) => {
    return movements.filter(m => m.itemId === itemId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [movements]);

  const addMovement = useCallback((data: {
    itemId: string;
    type: 'in' | 'out';
    quantity: number;
    reason: string;
    ticketId?: string;
  }) => {
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

    setMovements(prev => [newMovement, ...prev]);
    
    setItems(prev => prev.map(i => {
      if (i.id === data.itemId) {
        const newQuantity = data.type === 'in' 
          ? i.quantity + data.quantity 
          : i.quantity - data.quantity;
        return { ...i, quantity: Math.max(0, newQuantity), updatedAt: new Date().toISOString() };
      }
      return i;
    }));

    return newMovement;
  }, [items]);

  const createItem = useCallback((data: {
    sku: string;
    name: string;
    category: InventoryCategory;
    description: string;
    quantity: number;
    minQuantity: number;
    location: string;
    supplier?: string;
    price?: number;
  }) => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ...data,
      unit: 'pcs',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItem]);
    return newItem;
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      lowStock: getLowStockItems.length,
      totalValue: items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
    };
  }, [items, getLowStockItems.length]);

  return {
    items: filteredItems,
    movements,
    lowStockItems: getLowStockItems,
    filter,
    setFilter,
    getItemById,
    getItemMovements,
    addMovement,
    createItem,
    stats,
  };
}
