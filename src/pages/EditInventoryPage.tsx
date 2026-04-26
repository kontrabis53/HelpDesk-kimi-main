import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MapPin, DollarSign, Building, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { inventorySchema, type InventoryFormValues } from '@/lib/schemas';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import { inventoryCategoryLabels, inventoryUnitLabels } from '@/types';
import type { InventoryCategory, InventoryUnit } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const categories: { id: InventoryCategory; label: string }[] = [
  { id: 'spare_parts', label: inventoryCategoryLabels.spare_parts },
  { id: 'consumables', label: inventoryCategoryLabels.consumables },
  { id: 'equipment', label: inventoryCategoryLabels.equipment },
  { id: 'tools', label: inventoryCategoryLabels.tools },
  { id: 'other', label: inventoryCategoryLabels.other },
];

const units: { id: InventoryUnit; label: string }[] = [
  { id: 'pcs', label: inventoryUnitLabels.pcs },
  { id: 'kg', label: inventoryUnitLabels.kg },
  { id: 'l', label: inventoryUnitLabels.l },
  { id: 'm', label: inventoryUnitLabels.m },
  { id: 'box', label: inventoryUnitLabels.box },
];

export function EditInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const items = useInventoryStore((state) => state.items);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const deleteItem = useInventoryStore((state) => state.deleteItem);
  const fetchItem = useInventoryStore((state) => state.fetchItem);
  const addLog = useRoleStore((state) => state.addLog);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const item = items.find((i) => i.id === id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
  });

  useEffect(() => {
    const loadItem = async () => {
      if (id && !item) {
        try {
          await fetchItem(id);
        } catch (error) {
          toast.error('Товар не найден');
          navigate('/inventory');
        }
      }
    };
    loadItem();
  }, [id, item, fetchItem, navigate]);

  useEffect(() => {
    if (item) {
      reset({
        sku: item.sku,
        name: item.name,
        category: item.category as any,
        description: item.description || '',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unit: item.unit as any,
        location: item.location || '',
        supplier: item.supplier || '',
        price: item.price || 0,
      });
    }
  }, [item, reset]);

  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');

  const onFormSubmit = async (data: InventoryFormValues) => {
    if (!id) return;
    try {
      await updateItem(id, data);
      addLog('inventory.updated', 'inventory', id, data.name, `Изменен товар: ${data.name}`);
      toast.success('Товар обновлен', {
        description: `${data.name} успешно сохранен`,
      });
      navigate('/inventory');
    } catch (error) {
      toast.error('Ошибка при обновлении товара');
    }
  };

  const handleDelete = async () => {
    if (!id || !item) return;
    try {
      await deleteItem(id);
      addLog('inventory.deleted', 'inventory', id, item.name, `Удален товар: ${item.name}`);
      toast.success('Товар удален');
      navigate('/inventory');
    } catch (error) {
      toast.error('Ошибка при удалении товара');
    }
  };

  if (!item) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-1.5 px-3 py-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Редактирование товара</h1>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Артикул (SKU) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sku"
            {...register('sku')}
            placeholder="Например: CRT-HP-85A"
            className={cn("h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.sku && "border-red-500")}
          />
          {errors.sku && <span className="text-xs text-red-500">{errors.sku.message}</span>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Название товара <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Например: Картридж HP 85A"
            className={cn("h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.name && "border-red-500")}
          />
          {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue('category', cat.id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-center border',
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {errors.category && <span className="text-xs text-red-500">{errors.category.message}</span>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Описание
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Подробное описание товара..."
            className={cn("min-h-[100px] resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.description && "border-red-500")}
          />
          {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Текущий остаток
            </Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { valueAsNumber: true })}
              className={cn("h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.quantity && "border-red-500")}
            />
            {errors.quantity && <span className="text-xs text-red-500">{errors.quantity.message}</span>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Единица</Label>
            <div className="grid grid-cols-3 gap-1">
              {units.map((u_unit) => (
                <button
                  key={u_unit.id}
                  type="button"
                  onClick={() => setValue('unit', u_unit.id)}
                  className={cn(
                    'px-1 py-3 rounded-lg text-[10px] sm:text-xs font-medium transition-all border',
                    selectedUnit === u_unit.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  )}
                >
                  {u_unit.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Min Quantity */}
        <div className="space-y-2">
          <Label htmlFor="minQuantity" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Минимальный запас (для уведомления)
          </Label>
          <Input
            id="minQuantity"
            type="number"
            min="0"
            {...register('minQuantity', { valueAsNumber: true })}
            className={cn("h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.minQuantity && "border-red-500")}
          />
          {errors.minQuantity && <span className="text-xs text-red-500">{errors.minQuantity.message}</span>}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Местоположение на складе <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Например: Склад А, стеллаж 3"
            className={cn("h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100", errors.location && "border-red-500")}
          />
          {errors.location && <span className="text-xs text-red-500">{errors.location.message}</span>}
        </div>

        {/* Supplier and Price */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl space-y-4">
          <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Дополнительно
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-sm text-slate-600 dark:text-slate-400">
              Поставщик
            </Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Название поставщика"
              className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Цена за единицу (₽)
            </Label>
            <Input
              id="price"
              type="number"
              {...register('price', { valueAsNumber: true })}
              placeholder="0"
              className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 pb-10 space-y-4">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inventory')}
              className="flex-1 h-12 text-base font-medium"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-12 text-base font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Сохранение...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Удалить товар
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {item.name}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
