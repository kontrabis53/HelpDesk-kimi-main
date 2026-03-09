import { useNavigate } from 'react-router-dom';
import { CreateInventoryScreen } from '@/screens/CreateInventoryScreen';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { InventoryFormValues } from '@/lib/schemas';

export function CreateInventoryPage() {
  const navigate = useNavigate();
  const createItem = useInventoryStore((state) => state.createItem);
  const addLog = useRoleStore((state) => state.addLog);
  
  const handleBack = () => {
    navigate('/inventory');
  };
  
  const handleSubmit = (data: InventoryFormValues) => {
    const newItem = createItem(data);
    addLog('inventory.created', 'inventory', newItem.id, newItem.name, `Добавлен товар: ${newItem.name}`);
    toast.success('Товар добавлен', {
      description: `${newItem.name} (${newItem.sku}) добавлен на склад`,
    });
    navigate('/inventory');
  };
  
  return (
    <CreateInventoryScreen
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
