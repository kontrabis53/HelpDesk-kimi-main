import { useState } from 'react';
import type { DocumentType } from '@/types';
import { documentTypeLabels } from '@/types';
import { ArrowLeft, Calendar, MapPin, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreateDocumentScreenProps {
  onBack: () => void;
  onSubmit: (data: {
    title: string;
    type: DocumentType;
    description: string;
    equipmentName?: string;
    equipmentLocation?: string;
    repairDate?: string;
    repairCost?: number;
    partsUsed?: string[];
  }) => void;
}

const documentTypes: { id: DocumentType; label: string }[] = [
  { id: 'act', label: documentTypeLabels.act },
  { id: 'repair', label: documentTypeLabels.repair },
  { id: 'maintenance', label: documentTypeLabels.maintenance },
  { id: 'inventory', label: documentTypeLabels.inventory },
  { id: 'other', label: documentTypeLabels.other },
];

export function CreateDocumentScreen({ onBack, onSubmit }: CreateDocumentScreenProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('act');
  const [description, setDescription] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentLocation, setEquipmentLocation] = useState('');
  const [repairDate, setRepairDate] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      equipmentName: equipmentName.trim() || undefined,
      equipmentLocation: equipmentLocation.trim() || undefined,
      repairDate: repairDate || undefined,
      repairCost: repairCost ? parseFloat(repairCost) : undefined,
      partsUsed: partsUsed.trim() ? partsUsed.split(',').map(p => p.trim()) : undefined,
    });
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  const showEquipmentFields = type === 'repair' || type === 'maintenance' || type === 'act';
  const showCostFields = type === 'repair';

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
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Новый документ</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Название документа <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Акт ремонта принтера"
            className="h-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Тип документа</Label>
          <div className="grid grid-cols-2 gap-2">
            {documentTypes.map((docType) => (
              <button
                key={docType.id}
                onClick={() => setType(docType.id)}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-all text-left',
                  type === docType.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                )}
              >
                {docType.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Описание <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробное описание..."
            className="min-h-[100px] resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Equipment Fields */}
        {showEquipmentFields && (
          <div className="space-y-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
            <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Информация об оборудовании
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="equipmentName" className="text-sm text-slate-600 dark:text-slate-400">
                Название оборудования
              </Label>
              <Input
                id="equipmentName"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                placeholder="Например: HP LaserJet Pro M404"
                className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentLocation" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Расположение
              </Label>
              <Input
                id="equipmentLocation"
                value={equipmentLocation}
                onChange={(e) => setEquipmentLocation(e.target.value)}
                placeholder="Например: Кабинет 205"
                className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repairDate" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Дата
              </Label>
              <Input
                id="repairDate"
                type="date"
                value={repairDate}
                onChange={(e) => setRepairDate(e.target.value)}
                className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Cost Fields */}
        {showCostFields && (
          <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <h3 className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Стоимость ремонта
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="repairCost" className="text-sm text-amber-600 dark:text-amber-400">
                Сумма (₽)
              </Label>
              <Input
                id="repairCost"
                type="number"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                placeholder="0"
                className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partsUsed" className="text-sm text-amber-600 dark:text-amber-400">
                Использованные запчасти (через запятую)
              </Label>
              <Input
                id="partsUsed"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
                placeholder="Картридж, кабель, ..."
                className="h-11 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
        )}

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
                Создание...
              </span>
            ) : (
              'Создать документ'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
