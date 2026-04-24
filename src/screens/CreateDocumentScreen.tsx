import { useState, useRef, useMemo } from 'react';
import type { DocumentType, DocumentStatus } from '@/types';
import { documentTypeLabels, documentStatusLabels } from '@/types';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, DollarSign, FileText, Upload, X, Hash, Book, ChevronRight, Info } from 'lucide-react';
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
import { useLocationStore } from '@/stores/locationStore';
import { useGuideStore } from '@/stores/guideStore';
import { Badge } from '@/components/ui/badge';

interface CreateDocumentScreenProps {
  onBack: () => void;
  initialData?: {
    number?: string;
    title: string;
    type: DocumentType;
    status?: DocumentStatus;
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
    number?: string;
    title: string;
    type: DocumentType;
    status: DocumentStatus;
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

const documentStatuses: { id: DocumentStatus; label: string }[] = [
  { id: 'active', label: documentStatusLabels.active },
  { id: 'draft', label: documentStatusLabels.draft },
  { id: 'archived', label: documentStatusLabels.archived },
];

export function CreateDocumentScreen({ onBack, onSubmit, initialData, isEditing = false }: CreateDocumentScreenProps) {
  const { getEquipmentByModel, getCabinetById, getBuildingById } = useLocationStore();
  const { guides: allTechnicalGuides } = useGuideStore();

  const [number, setNumber] = useState(initialData?.number || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<DocumentType>(initialData?.type || 'act');
  const [status, setStatus] = useState<DocumentStatus>(initialData?.status || 'active');
  const [description, setDescription] = useState(initialData?.description || '');
  const [equipmentName, setEquipmentName] = useState(initialData?.equipmentName || '');
  const [equipmentLocation, setEquipmentLocation] = useState(initialData?.equipmentLocation || '');
  
  // Auto-detect location and related guides based on equipment name
  const relatedData = useMemo(() => {
    if (!equipmentName || equipmentName.length < 3) return { location: null, guides: [] };
    
    const equipment = getEquipmentByModel(equipmentName);
    let locationStr = '';
    
    if (equipment) {
      const cabinet = getCabinetById(equipment.cabinetId);
      const building = cabinet ? getBuildingById(cabinet.buildingId) : null;
      if (cabinet && building) {
        locationStr = `${building.name}, Каб. ${cabinet.name}`;
      }
    }

    const relatedGuides = allTechnicalGuides.filter(g => 
      g.equipmentModels?.some(m => equipmentName.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(equipmentName.toLowerCase())) ||
      g.title.toLowerCase().includes(equipmentName.toLowerCase())
    );

    return { 
      location: locationStr, 
      guides: relatedGuides 
    };
  }, [equipmentName, getEquipmentByModel, getCabinetById, getBuildingById, allTechnicalGuides]);

  // Effect to update location automatically if found
  useState(() => {
    if (relatedData.location && !equipmentLocation) {
      setEquipmentLocation(relatedData.location);
    }
  });
  
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
    number !== (initialData?.number || '') ||
    title !== (initialData?.title || '') ||
    type !== (initialData?.type || 'act') ||
    status !== (initialData?.status || 'active') ||
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
      number: number.trim() || undefined,
      title: title.trim(),
      type,
      status,
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-4 py-3 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
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
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg transition-all group"
        >
          <span className="text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Закрыть</span>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-6 pb-32">
          {/* Main Info */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Основная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number" className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                Инвентарный номер
              </Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="АКТ-2026-001"
                className="bg-slate-50 dark:bg-slate-900 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                {documentStatuses.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className={cn(
                      'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all',
                      status === s.id
                        ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название документа</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Акт осмотра оборудования"
              className="bg-slate-50 dark:bg-slate-900 h-11"
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

        {/* Equipment Info */}
        {showEquipmentFields && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Объект обслуживания</h2>
              {relatedData.location && equipmentLocation !== relatedData.location && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-7 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  onClick={() => setEquipmentLocation(relatedData.location!)}
                >
                  <MapPin className="w-3 h-3 mr-1" /> Уточнить локацию
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentName">Название оборудования</Label>
                <div className="relative">
                  <Input
                    id="equipmentName"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Например: Hamilton C3"
                    className="bg-slate-50 dark:bg-slate-900 h-11"
                  />
                  {relatedData.location && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] animate-in fade-in zoom-in duration-300">
                        Найдено
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentLocation">Локация</Label>
                <Input
                  id="equipmentLocation"
                  value={equipmentLocation}
                  onChange={(e) => setEquipmentLocation(e.target.value)}
                  placeholder="Корпус, этаж, кабинет"
                  className="bg-slate-50 dark:bg-slate-900 h-11"
                />
              </div>
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

            {/* Related Guides Section */}
            {(relatedData.guides?.length ?? 0) > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Связанные инструкции</h3>
                </div>
                <div className="space-y-2">
                  {relatedData.guides?.map(guide => (
                    <div 
                      key={guide.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group cursor-pointer"
                      onClick={() => window.open(`/knowledge/${guide.id}`, '_blank')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{guide.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500">Инструкция</span>
                                {guide.fileUrls && guide.fileUrls.length > 0 && (
                              <Badge variant="secondary" className="text-[8px] h-4 px-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-none">
                                + {guide.fileUrls.length} файл(а)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg">
                  <Info className="w-3 h-3 text-blue-500" />
                  Инструкции подобраны автоматически на основе названия оборудования
                </div>
              </div>
            )}
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
    </div>
  );
}
