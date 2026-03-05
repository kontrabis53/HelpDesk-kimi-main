import { useState, useRef } from 'react';
import type { DocumentType } from '@/types';
import { documentTypeLabels } from '@/types';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, DollarSign, FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CreateDocumentScreenProps {
  onBack: () => void;
  initialData?: {
    title: string;
    type: DocumentType;
    description: string;
    equipmentName?: string;
    equipmentLocation?: string;
    repairDate?: string;
    repairCost?: number;
    partsUsed?: string[];
    fileUrl?: string;
    fileName?: string;
  };
  onSubmit: (data: {
    title: string;
    type: DocumentType;
    description: string;
    equipmentName?: string;
    equipmentLocation?: string;
    repairDate?: string;
    repairCost?: number;
    partsUsed?: string[];
    fileUrl?: string;
    fileName?: string;
  }) => void;
  isEditing?: boolean;
}

const documentTypes: { id: DocumentType; label: string }[] = [
  { id: 'act', label: documentTypeLabels.act },
  { id: 'repair', label: documentTypeLabels.repair },
  { id: 'maintenance', label: documentTypeLabels.maintenance },
  { id: 'inventory', label: documentTypeLabels.inventory },
  { id: 'other', label: documentTypeLabels.other },
];

export function CreateDocumentScreen({ onBack, onSubmit, initialData, isEditing = false }: CreateDocumentScreenProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<DocumentType>(initialData?.type || 'act');
  const [description, setDescription] = useState(initialData?.description || '');
  const [equipmentName, setEquipmentName] = useState(initialData?.equipmentName || '');
  const [equipmentLocation, setEquipmentLocation] = useState(initialData?.equipmentLocation || '');
  
  // Initialize date with current date if not editing, or use existing date
  const [repairDate, setRepairDate] = useState<Date | undefined>(
    initialData?.repairDate ? new Date(initialData.repairDate) : new Date()
  );
  
  const [repairCost, setRepairCost] = useState(initialData?.repairCost?.toString() || '');
  const [partsUsed, setPartsUsed] = useState(initialData?.partsUsed?.join(', ') || '');
  const [file, setFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<{ url: string; name: string } | null>(
    initialData?.fileUrl ? { url: initialData.fileUrl, name: initialData.fileName || 'Документ' } : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой', { description: 'Максимальный размер файла 10 МБ' });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/jpg', 
      'text/plain',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Неверный формат файла', { description: 'Разрешены PDF, JPG, TXT, Word и Excel' });
      return;
    }

    setFile(selectedFile);
    setExistingFile(null); // Clear existing file if new one is selected
  };

  const removeFile = () => {
    setFile(null);
    setExistingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isValid = title.trim() !== '' && description.trim() !== '';
  
    // Check if form data has changed compared to initial data
  const hasChanges = isEditing ? (
    title !== (initialData?.title || '') ||
    type !== (initialData?.type || 'act') ||
    description !== (initialData?.description || '') ||
    equipmentName !== (initialData?.equipmentName || '') ||
    equipmentLocation !== (initialData?.equipmentLocation || '') ||
    (repairDate ? format(repairDate, 'yyyy-MM-dd') : '') !== (initialData?.repairDate || '') ||
    repairCost !== (initialData?.repairCost?.toString() || '') ||
    partsUsed !== (initialData?.partsUsed?.join(', ') || '') ||
    file !== null ||
    (existingFile === null && initialData?.fileUrl) // File was removed
  ) : true;

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    
    // In a real app, we would upload the file to a server here and get a URL back.
    // For this mock, we'll create a fake URL or object URL.
    let fileUrl = existingFile?.url;
    let fileName = existingFile?.name;

    if (file) {
      fileUrl = URL.createObjectURL(file);
      fileName = file.name;
    }
    
    onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      equipmentName: equipmentName.trim() || undefined,
      equipmentLocation: equipmentLocation.trim() || undefined,
      repairDate: repairDate ? format(repairDate, 'yyyy-MM-dd') : undefined,
      repairCost: repairCost ? parseFloat(repairCost) : undefined,
      partsUsed: partsUsed.trim() ? partsUsed.split(',').map(p => p.trim()) : undefined,
      fileUrl,
      fileName,
    });
  };

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
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isEditing ? 'Редактирование документа' : 'Новый документ'}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Main Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Основная информация</h2>
          
          <div className="space-y-2">
            <Label htmlFor="title">Название документа</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Акт осмотра оборудования"
              className="bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="space-y-2">
            <Label>Тип документа</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {documentTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center border',
                    type === t.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание документа..."
              className="bg-slate-50 dark:bg-slate-900 min-h-[120px]"
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Файл документа</Label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.txt,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
            />
            
            {file || existingFile ? (
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-lg w-full max-w-sm">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {file ? file.name : existingFile?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Существующий файл'}
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2"
                  >
                    Выберите файл
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  PDF, JPG, TXT, Word или Excel (макс. 10 MB)
                </p>
              </div>
            )}
          </div>
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

            <div className="space-y-2 flex flex-col">
              <Label htmlFor="repairDate" className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Дата
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "h-11 justify-start text-left font-normal bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100",
                      !repairDate && "text-muted-foreground"
                    )}
                  >
                    {repairDate ? format(repairDate, "dd MMMM yyyy", { locale: ru }) : <span>Выберите дату</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={repairDate}
                    onSelect={(date) => {
                      setRepairDate(date);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
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
            disabled={!isValid || isSubmitting || (isEditing && !hasChanges)}
            className="w-full h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isEditing ? 'Сохранение...' : 'Создание...'}
              </span>
            ) : (
              isEditing ? 'Сохранить изменения' : 'Создать документ'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
