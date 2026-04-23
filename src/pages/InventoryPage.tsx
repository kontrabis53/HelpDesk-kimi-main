import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { InventoryScreen } from '@/screens/InventoryScreen';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { InventoryCategory } from '@/types';

export function InventoryPage() {
  const navigate = useNavigate();
  
  const allItems = useInventoryStore((state) => state.items);
  const fetchItems = useInventoryStore((state) => state.fetchItems);
  const updateItemQuantity = useInventoryStore((state) => state.updateItemQuantity);
  const filter = useInventoryStore((state) => state.filter);
  const setFilter = useInventoryStore((state) => state.setFilter);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const addLog = useRoleStore((state) => state.addLog);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const items = useMemo(() => {
    return allItems.filter((item) => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.lowStock && item.quantity > item.minQuantity) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          (item.sku || '').toLowerCase().includes(searchLower) ||
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.location || '').toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, filter]);

  const storeStats = useMemo(() => {
    const lowStock = allItems.filter(item => item.quantity <= item.minQuantity);
    const totalValue = allItems.reduce((sum, item) => sum + ((item.price ?? 0) * item.quantity), 0);
    
    const categories: Record<InventoryCategory, number> = {
      spare_parts: 0,
      consumables: 0,
      equipment: 0,
      tools: 0,
      other: 0,
    };
    
    allItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    
    return {
      totalItems: allItems.length,
      lowStockItems: lowStock.length,
      totalValue,
      categories,
    };
  }, [allItems]);
  
  const handleAddMovement = async (itemId: string, type: 'in' | 'out', quantity: number, reason: string) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = type === 'in' ? item.quantity + quantity : item.quantity - quantity;
    
    if (newQuantity < 0) {
      toast.error('Ошибка', { description: 'Недостаточно товара на складе' });
      return;
    }

    await updateItemQuantity(itemId, newQuantity);
    addLog('inventory.movement', 'inventory', itemId, item.name, `${type === 'in' ? 'Приход' : 'Расход'}: ${quantity} шт. - ${reason}`);
    toast.success(type === 'in' ? 'Приход оформлен' : 'Расход оформлен', {
      description: `${quantity} ед. - ${reason}`,
    });
  };

  const handleItemClick = (item: any) => {
    toast.info(item.name, {
      description: `На складе: ${item.quantity} шт. • Минимум: ${item.minQuantity} шт. • ${item.location}`,
    });
  };
  
  const handleCreateClick = () => {
    if (!hasPermission('inventory', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для добавления товаров' });
      return;
    }
    navigate('/inventory/create');
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };
  
  const handleFilterLowStock = (show: boolean) => {
    setFilter({ lowStock: show });
  };
  
  return (
    <InventoryScreen
      items={items}
      stats={{
        total: storeStats.totalItems,
        lowStock: storeStats.lowStockItems,
        totalValue: storeStats.totalValue,
      }}
      onItemClick={handleItemClick}
      onAddMovement={handleAddMovement}
      onCreateClick={handleCreateClick}
      onSearch={handleSearch}
      onFilterLowStock={handleFilterLowStock}
    />
  );
}
