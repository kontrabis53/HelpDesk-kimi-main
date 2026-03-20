import { useState, useMemo, useEffect } from 'react';
import { Search, Phone, Send, MapPin, Users, TrendingUp, User, Building, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDirectoryStore } from '@/stores/directoryStore';
import { useRoleStore } from '@/stores/roleStore';
import type { DirectoryEntry } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export function DirectoryScreen() {
  const { entries, getTopStats, recordSearch, addEntry, updateEntry, deleteEntry } = useDirectoryStore();
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const canManage = hasPermission('directory', 'edit');

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsCalendarOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);

  // Helper to format phone number to +373 XXXXXX
  const formatDisplayPhone = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If it starts with 373, strip it to get the rest
    if (digits.startsWith('373')) {
      return `+373 ${digits.substring(3)}`;
    }
    
    // If it starts with 7 (Russian), just for example, we'll still prepend +373 as requested for this system
    // But if it's already a full number, we just want to ensure the space
    return `+373 ${digits}`;
  };

  // Form state
  const [formData, setFormData] = useState<Omit<DirectoryEntry, 'id'>>({
    name: '',
    position: '',
    department: '',
    cabinet: '',
    internalPhone: '',
    mobilePhone: '',
    telegram: '',
    tags: []
  });

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormData({
      name: '',
      position: '',
      department: '',
      cabinet: '',
      internalPhone: '',
      mobilePhone: '',
      telegram: '',
      tags: []
    });
    setIsCalendarOpen(true);
  };

  const handleOpenEdit = (entry: DirectoryEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name,
      position: entry.position,
      department: entry.department,
      cabinet: entry.cabinet,
      internalPhone: entry.internalPhone,
      mobilePhone: entry.mobilePhone || '',
      telegram: entry.telegram || '',
      tags: entry.tags || []
    });
    setIsCalendarOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.position || !formData.cabinet || !formData.internalPhone) {
      toast.error('Заполните обязательные поля');
      return;
    }

    if (editingEntry) {
      updateEntry(editingEntry.id, formData);
      toast.success('Контакт обновлен');
    } else {
      addEntry(formData);
      toast.success('Контакт добавлен');
    }
    setIsCalendarOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот контакт?')) {
      deleteEntry(id);
      toast.success('Контакт удален');
    }
  };
  
  // Adaptive phone/telegram action handler
  const handleContactAction = (type: 'call' | 'telegram', value: string) => {
    if (!value) return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (type === 'call') {
      window.location.href = `tel:${value.replace(/\s+/g, '')}`;
    } else if (type === 'telegram') {
      const username = value.startsWith('@') ? value.substring(1) : value;
      if (isMobile) {
        // Mobile behavior: Give choice (handled by browser or system intent)
        window.location.href = `tg://resolve?domain=${username}`;
        // Fallback to web if app not installed
        setTimeout(() => {
          window.open(`https://t.me/${username}`, '_blank');
        }, 500);
      } else {
        // Desktop behavior: Open web or app
        window.open(`https://t.me/${username}`, '_blank');
      }
    }
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // If query is empty or too short, return all entries sorted by name
    if (!query || query.length < 1) {
      return entries
        .map(entry => ({ ...entry, isDirectHit: false, score: 0 }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    
    const results = entries
      .filter(entry => 
        entry.name.toLowerCase().includes(query) ||
        entry.position.toLowerCase().includes(query) ||
        entry.department.toLowerCase().includes(query) ||
        entry.cabinet.toLowerCase().includes(query) ||
        entry.internalPhone.includes(query) ||
        (entry.mobilePhone && entry.mobilePhone.includes(query)) ||
        (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(query)))
      )
      .map(entry => {
        // Logic to determine if this entry is a "direct hit" (exactly what user searched for)
        const isDirectHit = 
          entry.cabinet.toLowerCase() === query || 
          entry.position.toLowerCase() === query ||
          entry.name.toLowerCase().includes(query) ||
          (entry.tags && entry.tags.some(tag => tag.toLowerCase() === query));
        
        // Calculate relevance score for sorting
        let score = 0;
        if (entry.name.toLowerCase() === query) score += 100;
        else if (entry.name.toLowerCase().startsWith(query)) score += 50;
        
        if (entry.cabinet.toLowerCase() === query) score += 90;
        if (entry.position.toLowerCase() === query) score += 80;
        if (entry.tags && entry.tags.some(tag => tag.toLowerCase() === query)) score += 70;
        if (entry.internalPhone === query) score += 60;
        
        return { ...entry, isDirectHit, score };
      })
      .sort((a, b) => b.score - a.score);

    // If only one result found, force highlight it
    if (results.length === 1) {
      results[0].isDirectHit = true;
    }

    return results;
  }, [searchQuery, entries]);

  // Record search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        recordSearch(searchQuery);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, recordSearch]);

  const topSearches = getTopStats();

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-full">
      {/* Header - Sticky */}
      <div className="sticky top-[-16px] md:top-[-32px] z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-none">Справочник</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Поиск контактов и кабинетов</p>
            </div>
          </div>
          {canManage && (
            <Button onClick={handleOpenAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="ФИО, должность, кабинет или номер..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 text-lg"
          />
        </div>

        {/* Top Searches */}
        {!searchQuery && (
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Часто ищут:</span>
            <div className="flex gap-2">
              {topSearches.map((stat, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(stat.query)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-slate-200 dark:border-slate-600"
                >
                  {stat.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Area - No inner scroll */}
      <div className="p-4 space-y-4 pb-24">
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Ничего не найдено по запросу "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((entry) => (
              <div 
                key={entry.id}
                className={cn(
                  "bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all relative group",
                  entry.isDirectHit 
                    ? "border-blue-500 dark:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:shadow-[0_0_25px_rgba(96,165,250,0.25)] ring-2 ring-blue-500/30 dark:ring-blue-400/40 scale-[1.03] z-10" 
                    : "border-slate-100 dark:border-slate-700 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors",
                      entry.isDirectHit 
                        ? "bg-blue-600 text-white border-blue-400 shadow-inner" 
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800"
                    )}>
                      <User className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1 truncate">
                        {entry.name}
                      </h3>
                      <p className={cn(
                        "text-sm font-medium leading-none",
                        entry.isDirectHit ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {entry.position}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-slate-500 dark:text-slate-400">
                        <Building className="w-3.5 h-3.5" />
                        <span className="text-xs truncate">{entry.department}</span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(entry)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Изменить
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400" 
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Cabinet and Internal Phone */}
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors",
                    entry.isDirectHit 
                      ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30" 
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Каб. {entry.cabinet}</span>
                    </div>
                    <button 
                      onClick={() => handleContactAction('call', entry.internalPhone)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EBF5FF] dark:bg-[#003366] border border-[#BEE3F8] dark:border-[#004C99] hover:scale-[1.08] transition-all duration-200 group/internal"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#3399FF] fill-[#007AFF] dark:fill-[#3399FF]" />
                      <span className="text-sm font-bold text-[#007AFF] dark:text-[#3399FF]">{entry.internalPhone}</span>
                    </button>
                  </div>

                  {/* Mobile and Telegram */}
                  <div className="flex gap-4">
                    {entry.mobilePhone && (
                      <Button 
                        variant="outline" 
                        className={cn(
                          "flex-1 h-10 gap-2 rounded-xl transition-all duration-200 border-none bg-[#28C740] hover:bg-[#28C740] hover:scale-[1.08] text-white shadow-md active:scale-95",
                          entry.isDirectHit && "ring-2 ring-[#28C740]/40 scale-[1.02]"
                        )}
                        onClick={() => handleContactAction('call', entry.mobilePhone!)}
                      >
                        <Phone className="w-4 h-4 fill-white text-white" />
                        <span className="text-xs font-bold whitespace-nowrap">
                          Моб: {formatDisplayPhone(entry.mobilePhone)}
                        </span>
                      </Button>
                    )}
                    {entry.telegram && (
                      <Button 
                        variant="outline" 
                        className={cn(
                          "flex-1 h-10 gap-2 border-none rounded-xl transition-all duration-200 bg-[#0088CC] hover:bg-[#0088CC] hover:scale-[1.08] text-white shadow-md active:scale-95",
                          entry.isDirectHit && "ring-2 ring-[#0088CC]/40 scale-[1.02]"
                        )}
                        onClick={() => handleContactAction('telegram', entry.telegram!)}
                      >
                        <Send className="w-4 h-4 fill-white text-white" />
                        <span className="text-xs font-bold">Telegram</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Others in same cabinet */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">В этом кабинете также:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entries
                      .filter(e => e.cabinet === entry.cabinet && e.id !== entry.id)
                      .slice(0, 3)
                      .map(other => (
                        <span key={other.id} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] truncate max-w-[100px]">
                          {other.name.split(' ')[0]} ({other.position.split(' ')[0]})
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Редактировать контакт' : 'Добавить новый контакт'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">ФИО</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Врач-терапевт"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabinet">Кабинет</Label>
                <Input
                  id="cabinet"
                  value={formData.cabinet}
                  onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                  placeholder="306"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Отделение</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Технический отдел"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internalPhone">Внутр. номер</Label>
                <Input
                  id="internalPhone"
                  value={formData.internalPhone}
                  onChange={(e) => setFormData({ ...formData, internalPhone: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Моб. номер</Label>
                <Input
                  id="mobilePhone"
                  value={formData.mobilePhone}
                  onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                  placeholder="+7 (___) ___ __ __"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (без @)</Label>
              <Input
                id="telegram"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                placeholder="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '') 
                })}
                placeholder="сисадмин, принтер, интернет"
              />
              <p className="text-[10px] text-slate-500 italic">Помогает искать сотрудника по ключевым словам (админ, техник и т.д.)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingEntry ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
