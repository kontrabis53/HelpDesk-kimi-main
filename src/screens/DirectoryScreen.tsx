import { useState, useMemo, useEffect, memo } from 'react';
import { Search, Phone, Send, MapPin, Users, TrendingUp, User, Building, Plus, MoreVertical, Edit, Trash2, X, LayoutGrid, List } from 'lucide-react';

// Memoized Directory Card for performance
const DirectoryCard = memo(({ 
  entry, 
  canManage, 
  onEdit, 
  onDelete, 
  onContactAction,
  otherStaffCount,
  formatDisplayPhone
}: { 
  entry: DirectoryEntry & { isDirectHit?: boolean }, 
  canManage: boolean, 
  onEdit: (e: DirectoryEntry) => void, 
  onDelete: (id: string) => void,
  onContactAction: (type: 'call' | 'telegram', val: string) => void,
  otherStaffCount: number,
  formatDisplayPhone: (phone: string) => string
}) => {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all relative group will-change-transform",
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
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit className="w-4 h-4 mr-2" />
                Изменить
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400"
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-3">
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
            onClick={() => onContactAction('call', entry.internalPhone)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EBF5FF] dark:bg-[#003366] border border-[#BEE3F8] dark:border-[#004C99] hover:scale-[1.08] transition-all duration-200 group/internal"
          >
            <Phone className="w-3.5 h-3.5 text-[#007AFF] dark:text-[#3399FF] fill-[#007AFF] dark:fill-[#3399FF]" />
            <span className="text-sm font-bold text-[#007AFF] dark:text-[#3399FF]">{entry.internalPhone}</span>
          </button>
        </div>

        <div className="flex gap-3">
          {entry.mobilePhone && (
            <Button 
              variant="outline" 
              className={cn(
                "flex-1 h-11 gap-2 rounded-xl transition-all duration-200 border-none bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 hover:scale-[1.05] text-white shadow-sm active:scale-95",
                entry.isDirectHit && "ring-2 ring-green-500/40 scale-[1.02]"
              )}
              onClick={() => onContactAction('call', entry.mobilePhone!)}
            >
              <Phone className="w-4 h-4 fill-white text-white shrink-0" />
              <span className="text-sm font-extrabold whitespace-nowrap tracking-tight">
                {formatDisplayPhone(entry.mobilePhone)}
              </span>
            </Button>
          )}
          {entry.telegram && (
            <Button 
              variant="outline" 
              className={cn(
                "h-11 px-4 gap-2 border-none rounded-xl transition-all duration-200 bg-[#0088CC] hover:bg-[#0077B5] hover:scale-[1.05] text-white shadow-sm active:scale-95",
                entry.isDirectHit && "ring-2 ring-[#0088CC]/40 scale-[1.02]",
                !entry.mobilePhone && "flex-1"
              )}
              onClick={() => onContactAction('telegram', entry.telegram!)}
            >
              <Send className="w-4 h-4 fill-white text-white shrink-0" />
            </Button>
          )}
        </div>
      </div>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.map((tag: string, i: number) => (
            <span key={i} className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-slate-200/50 dark:border-slate-600/50">
              {tag}
            </span>
          ))}
        </div>
      )}

      {otherStaffCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">В этом кабинете также: {otherStaffCount}</p>
        </div>
      )}
    </div>
  );
});

DirectoryCard.displayName = 'DirectoryCard';
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

import { useLocationStore } from '@/stores/locationStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DirectoryScreen() {
  const { entries, fetchEntries, getTopStats, recordSearch, addEntry, updateEntry, deleteEntry } = useDirectoryStore();
  const { departments } = useLocationStore();
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const canManage = hasPermission('directory', 'edit');

  const [searchQuery, setSearchQuery] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [tagInputValue, setTagInputValue] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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

  // Update tag input value when formData.tags changes
  useEffect(() => {
    if (formData.tags) {
      const tagsStr = formData.tags.join(', ');
      // Only update if current input doesn't match the normalized string
      // and we are not in the middle of typing a separator
      if (!tagInputValue.endsWith(',') && !tagInputValue.endsWith(', ') && tagsStr !== tagInputValue) {
        setTagInputValue(tagsStr);
      }
    }
  }, [formData.tags, tagInputValue]);

  const handleTagInputChange = (value: string) => {
    setTagInputValue(value);
    
    // Convert input string to array for formData
    const tagsArray = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  // Debounce search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Reset visible count when searching
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery]);

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
    setTagInputValue('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry: DirectoryEntry) => {
    setEditingEntry(entry);
    setFormData({
      name: entry.name || '',
      position: entry.position || '',
      department: entry.department || '',
      cabinet: entry.cabinet || '',
      internalPhone: entry.internalPhone || '',
      mobilePhone: entry.mobilePhone || '',
      telegram: entry.telegram || '',
      tags: entry.tags || []
    });
    setTagInputValue(entry.tags?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.position || !formData.cabinet || !formData.internalPhone) {
      toast.error('Заполните обязательные поля');
      return;
    }

    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, formData);
        toast.success('Контакт обновлен');
      } else {
        await addEntry(formData);
        toast.success('Контакт добавлен');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Submit directory entry error:', error);
      toast.error('Ошибка при сохранении');
    }
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
        (entry.name || '').toLowerCase().includes(query) ||
        (entry.position || '').toLowerCase().includes(query) ||
        (entry.department || '').toLowerCase().includes(query) ||
        (entry.cabinet || '').toLowerCase().includes(query) ||
        (entry.internalPhone || '').includes(query) ||
        (entry.mobilePhone || '').includes(query) ||
        (entry.tags && entry.tags.some(tag => (tag || '').toLowerCase().includes(query)))
      )
      .map(entry => {
        // Logic to determine if this entry is a "direct hit" (exactly what user searched for)
        const nameLower = (entry.name || '').toLowerCase();
        const posLower = (entry.position || '').toLowerCase();
        const cabLower = (entry.cabinet || '').toLowerCase();

        const isDirectHit = 
          cabLower === query || 
          posLower === query ||
          nameLower.includes(query) ||
          (entry.tags && entry.tags.some(tag => (tag || '').toLowerCase() === query));
        
        // Calculate relevance score for sorting
        let score = 0;
        if (nameLower === query) score += 100;
        else if (nameLower.startsWith(query)) score += 50;
        
        if (cabLower === query) score += 90;
        if (posLower === query) score += 80;
        if (entry.tags && entry.tags.some(tag => (tag || '').toLowerCase() === query)) score += 70;
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

  const displayedResults = useMemo(() => {
    // If user is searching, show everything found immediately
    if (searchQuery) return searchResults;
    // Otherwise, use pagination for the full list
    return searchResults.slice(0, visibleCount);
  }, [searchResults, visibleCount, searchQuery]);

  const hasMore = !searchQuery && searchResults.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  // Record search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        recordSearch(searchQuery);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, recordSearch]);

  const topSearches = getTopStats(4);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 h-full flex flex-col overflow-hidden">
      {/* Header - Sticky */}
      <div className="z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
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
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'list' 
                    ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
                title="Вид списком"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'grid' 
                    ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
                title="Вид плиткой"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            {canManage && (
              <Button onClick={handleOpenAdd} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            )}
          </div>
        </div>

        {/* Search Row */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="ФИО, должность, кабинет или номер..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 bg-slate-100 dark:bg-slate-700 border-0 focus-visible:ring-blue-500 text-lg"
            />
            {localSearchQuery && (
              <button
                onClick={() => {
                  setLocalSearchQuery('');
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Top Searches - Visible on both Mobile and Desktop */}
          {!localSearchQuery && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Часто ищут:</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {topSearches.map((stat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLocalSearchQuery(stat.query);
                      setSearchQuery(stat.query);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-slate-200 dark:border-slate-600 whitespace-nowrap active:scale-95 shadow-sm"
                  >
                    {stat.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Ничего не найдено по запросу "{searchQuery}"</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Сотрудник</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Контакты</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Локация</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {displayedResults.map((entry) => (
                    <tr key={entry.id} className={cn(
                      "hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group",
                      entry.isDirectHit && "bg-blue-50/30 dark:bg-blue-900/10"
                    )}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors",
                            entry.isDirectHit 
                              ? "bg-blue-600 text-white border-blue-400 shadow-inner" 
                              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800"
                          )}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                              {entry.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                              {entry.position} • {entry.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleContactAction('call', entry.internalPhone)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
                          >
                            <Phone className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold">{entry.internalPhone}</span>
                          </button>
                          {entry.mobilePhone && (
                            <button 
                              onClick={() => handleContactAction('call', entry.mobilePhone!)}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform"
                              title={formatDisplayPhone(entry.mobilePhone)}
                            >
                              <Phone className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          {entry.telegram && (
                            <button 
                              onClick={() => handleContactAction('telegram', entry.telegram!)}
                              className="p-1.5 rounded-lg bg-[#0088CC]/10 border border-[#0088CC]/20 text-[#0088CC] hover:scale-105 transition-transform"
                            >
                              <Send className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Каб. {entry.cabinet}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canManage && (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(entry)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedResults.map((entry) => (
              <DirectoryCard
                key={entry.id}
                entry={entry}
                canManage={canManage}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onContactAction={handleContactAction}
                otherStaffCount={entries.filter(e => e.cabinet === entry.cabinet && e.id !== entry.id).length}
                formatDisplayPhone={formatDisplayPhone}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center py-4">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold px-8"
            >
              Загрузить еще
            </Button>
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Должность</Label>
                <Input
                  id="position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Врач-терапевт"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cabinet">Кабинет</Label>
                <Input
                  id="cabinet"
                  value={formData.cabinet || ''}
                  onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                  placeholder="306"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Отделение</Label>
              <Select
                value={departments.find(d => d.name === formData.department)?.id || ""}
                onValueChange={(value) => {
                  const dept = departments.find(d => d.id === value);
                  if (dept) {
                    setFormData(prev => ({ ...prev, department: dept.name }));
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700">
                  <SelectValue placeholder="Выберите отделение" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internalPhone">Внутр. номер</Label>
                <Input
                  id="internalPhone"
                  value={formData.internalPhone || ''}
                  onChange={(e) => setFormData({ ...formData, internalPhone: e.target.value })}
                  placeholder="101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobilePhone">Моб. номер</Label>
                <Input
                  id="mobilePhone"
                  value={formData.mobilePhone || ''}
                  onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                  placeholder="+7 (___) ___ __ __"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram (без @)</Label>
              <Input
                id="telegram"
                value={formData.telegram || ''}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                placeholder="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Теги (через запятую)</Label>
              <Input
                id="tags"
                value={tagInputValue || ''}
                onChange={(e) => handleTagInputChange(e.target.value)}
                placeholder="сисадмин, принтер, интернет"
              />
              <p className="text-[10px] text-slate-500 italic">Помогает искать сотрудника по ключевым словам (админ, техник и т.д.)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingEntry ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
