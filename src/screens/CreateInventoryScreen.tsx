import { useState } from 'react';
import type { InventoryCategory, InventoryUnit } from '@/types';
import { inventoryCategoryLabels, inventoryUnitLabels } from '@/types';
import { ArrowLeft, Package, MapPin, DollarSign, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreateInventoryScreenProps {
  onBack: () => void;
  onSubmit: (data: {
    sku: string;
    name: string;
    category: InventoryCategory;
    description: string;
    quantity: number;
    minQuantity: number;
    unit: InventoryUnit;
    location: string;
    supplier?: string;
    price?: number;
  }) => void;
}

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

export function CreateInventoryScreen({ onBack, onSubmit }: CreateInventoryScreenProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('consumables');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('5');
  const [unit, setUnit] = useState<InventoryUnit>('pcs');
  const [location, setLocation] = useState('');
  const [supplier, setSupplier] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!sku.trim() || !name.trim() || !location.trim()) return;
    
    setIsSubmitting(true);
    onSubmit({
      sku: sku.trim(),
      name: name.trim(),
      category,
      description: description.trim(),
      quantity: parseInt(quantity) || 0,
      minQuantity: parseInt(minQuantity) || 5,
      unit,
      location: location.trim(),
      supplier: supplier.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
    });
  };

  const isValid = sku.trim().length > 0 && name.trim().length > 0 && location.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Новый товар</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Артикул (SKU) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Например: CRT-HP-85A"
            className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Название товара <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Картридж HP 85A"
            className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left',
                  category === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Описание
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробное описание товара..."
            className="min-h-[80px] resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Количество
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Единица</Label>
            <div className="grid grid-cols-3 gap-1">
              {units.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setUnit(u.id)}
                  className={cn(
                    'px-2 py-3 rounded-lg text-sm font-medium transition-all',
                    unit === u.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  )}
                >
                  {u.label}
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
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Местоположение на складе <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Например: Склад А, стеллаж 3"
            className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
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
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Добавление...
              </span>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Добавить на склад
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
