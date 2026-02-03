import { useState } from 'react';
import type { InventoryItem, InventoryCategory } from '@/types';
import { inventoryCategoryLabels, inventoryUnitLabels } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { Search, AlertTriangle, Plus, Minus, MapPin, TrendingDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InventoryScreenProps {
  items: InventoryItem[];
  lowStockItems: InventoryItem[];
  _lowStockItems?: InventoryItem[];
  stats: {
    total: number;
    lowStock: number;
    totalValue: number;
  };
  onItemClick: (item: InventoryItem) => void;
  onAddMovement: (itemId: string, type: 'in' | 'out', quantity: number, reason: string) => void;
  onCreateClick: () => void;
  onSearch: (query: string) => void;
  onFilterLowStock: (show: boolean) => void;
}

const categoryColors: Record<InventoryCategory, string> = {
  spare_parts: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  consumables: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  equipment: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  tools: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export function InventoryScreen({ 
  items, 
  lowStockItems: _lowStockItems,
  stats,
  onItemClick,
  onAddMovement,
  onCreateClick,
  onSearch,
  onFilterLowStock,
}: InventoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [movementQuantity, setMovementQuantity] = useState('1');
  const [movementReason, setMovementReason] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleToggleLowStock = () => {
    const newValue = !showLowStock;
    setShowLowStock(newValue);
    onFilterLowStock(newValue);
  };

  const handleOpenMovement = (item: InventoryItem, type: 'in' | 'out') => {
    setMovementItem(item);
    setMovementType(type);
    setMovementQuantity('1');
    setMovementReason('');
  };

  const handleSubmitMovement = () => {
    if (movementItem && movementQuantity && movementReason) {
      onAddMovement(
        movementItem.id,
        movementType,
        parseInt(movementQuantity),
        movementReason
      );
      setMovementItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Склад</h1>
          <Button onClick={onCreateClick} size="sm" className="bg-blue-600 hover:bg-blue-700">
            + Товар
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
            <div className="text-xs text-blue-500 dark:text-blue-400">позиций</div>
          </div>
          <div className={cn(
            'rounded-lg p-2 text-center',
            stats.lowStock > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
          )}>
            <div className={cn(
              'text-lg font-bold',
              stats.lowStock > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            )}>
              {stats.lowStock}
            </div>
            <div className={cn(
              'text-xs',
              stats.lowStock > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
            )}>
              заканчивается
            </div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-violet-600 dark:text-violet-400">
              {(stats.totalValue / 1000).toFixed(0)}к
            </div>
            <div className="text-xs text-violet-500 dark:text-violet-400">руб</div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 dark:text-slate-100"
            />
          </div>
          <button
            onClick={handleToggleLowStock}
            className={cn(
              'px-3 h-10 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors',
              showLowStock 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200'
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">Заканчивается</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-3 max-w-4xl mx-auto">
        {items.length === 0 ? (
          <EmptyState 
            title="Нет товаров"
            description="Добавьте первый товар на склад"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => {
              const isLowStock = item.quantity <= item.minQuantity;
              return (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className={cn(
                    'bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700',
                    'active:scale-[0.98] transition-transform duration-150 cursor-pointer'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          categoryColors[item.category]
                        )}>
                          {inventoryCategoryLabels[item.category]}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{item.sku}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                        {item.supplier && (
                          <span>Поставщик: {item.supplier}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-3">
                      <div className={cn(
                        'text-lg font-bold',
                        isLowStock ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
                      )}>
                        {item.quantity} {inventoryUnitLabels[item.unit]}
                      </div>
                      {isLowStock && (
                        <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Мало</span>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMovement(item, 'in');
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMovement(item, 'out');
                          }}
                          className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Movement Modal */}
      {movementItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-4">
            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-100">
              {movementType === 'in' ? 'Приход' : 'Расход'}: {movementItem.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Количество</label>
                <Input
                  type="number"
                  min="1"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  className="h-12 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>
              
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Причина / Назначение</label>
                <Input
                  type="text"
                  placeholder={movementType === 'in' ? 'Откуда пришло' : 'Куда расходуется'}
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="h-12 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMovementItem(null)}
                  className="flex-1 dark:border-slate-600 dark:text-slate-300"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmitMovement}
                  disabled={!movementQuantity || !movementReason}
                  className={cn(
                    'flex-1',
                    movementType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  )}
                >
                  Подтвердить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
