import { useNavigate } from 'react-router-dom';
import { InventoryScreen } from '@/screens/InventoryScreen';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function InventoryPage() {
  const navigate = useNavigate();
  
  const items = useInventoryStore((state) => state.filteredItems());
  const lowStockItems = useInventoryStore((state) => state.lowStockItems());
  const stats = useInventoryStore((state) => state.stats());
  const addMovement = useInventoryStore((state) => state.addMovement);
  const setFilter = useInventoryStore((state) => state.setFilter);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const addLog = useRoleStore((state) => state.addLog);
  
  const handleItemClick = (item: any) => {
    toast.info(item.name, {
      description: `На складе: ${item.quantity} шт. • Минимум: ${item.minQuantity} шт. • ${item.location}`,
    });
  };
  
  const handleAddMovement = (itemId: string, type: 'in' | 'out', quantity: number, reason: string) => {
    addMovement({ itemId, type, quantity, reason });
    const item = items.find(i => i.id === itemId);
    addLog('inventory.movement', 'inventory', itemId, item?.name, `${type === 'in' ? 'Приход' : 'Расход'}: ${quantity} шт. - ${reason}`);
    toast.success(type === 'in' ? 'Приход оформлен' : 'Расход оформлен', {
      description: `${quantity} ед. - ${reason}`,
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
      lowStockItems={lowStockItems}
      _lowStockItems={lowStockItems}
      stats={stats}
      onItemClick={handleItemClick}
      onAddMovement={handleAddMovement}
      onCreateClick={handleCreateClick}
      onSearch={handleSearch}
      onFilterLowStock={handleFilterLowStock}
    />
  );
}
