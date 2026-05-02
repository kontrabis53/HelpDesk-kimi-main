import { Mail, Building2, LogOut, Settings, Bell, Moon, Sun, ChevronRight, Info, Loader2, Stethoscope, Camera, Trash2, X, Check, Image as ImageIcon, Smile, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import type { Role } from '@/types/roles';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface ProfileScreenProps {
  stats: {
    total: number;
    new: number;
    in_progress: number;
    waiting: number;
    resolved: number;
  };
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  userRole?: Role;
}

export function ProfileScreen({ stats, theme, onToggleTheme, onOpenSettings, userRole }: ProfileScreenProps) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUserSettings = useAuthStore((state) => state.updateUserSettings);
  
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [isEmojiMode, setIsEmojiMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memojis = ['👦', '👧', '👨‍💻', '👩‍💻', '🦸', '🦹', '🐱', '🐶', '🦊', '🦁', '🐸', '🐨'];
  const monogramColors = [
    'bg-amber-400', 'bg-blue-500', 'bg-emerald-500', 
    'bg-rose-500', 'bg-violet-500', 'bg-slate-700'
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleNotifications = async (checked: boolean) => {
    setIsUpdatingNotifications(true);
    try {
      await updateUserSettings({ notificationsEnabled: checked });
    } catch (error) {
      toast.error('Не удалось обновить настройки уведомлений');
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarEditor(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 2МБ');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setTempAvatar(base64);
      setIsEmojiMode(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectEmoji = (emoji: string) => {
    setTempAvatar(emoji);
    setIsEmojiMode(true);
  };

  const handleSelectMonogram = (colorClass: string) => {
    // We'll store monogram as a special string "monogram:colorClass"
    setTempAvatar(`monogram:${colorClass}`);
    setIsEmojiMode(false);
  };

  const handleSaveAvatar = async () => {
    if (!tempAvatar) return;
    setIsUploadingAvatar(true);
    try {
      console.log('Saving avatar:', tempAvatar);
      await updateUserSettings({ avatar: tempAvatar });
      console.log('Avatar updated successfully');
      toast.success('Аватар обновлен');
      setShowAvatarEditor(false);
      setTempAvatar(null);
    } catch (error) {
      console.error('Save avatar error:', error);
      toast.error('Не удалось сохранить аватар');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Log user changes for debugging
  useEffect(() => {
    console.log('ProfileScreen: User updated', user?.avatar);
  }, [user?.avatar]);

  const handleResetAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      await updateUserSettings({ avatar: null });
      toast.success('Аватар сброшен');
      setShowAvatarEditor(false);
      setTempAvatar(null);
    } catch (error) {
      toast.error('Не удалось сбросить аватар');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const statItems = [
    { label: 'Всего', value: stats.total, color: 'bg-slate-500' },
    { label: 'Новые', value: stats.new, color: 'bg-blue-500' },
    { label: 'В работе', value: stats.in_progress, color: 'bg-amber-500' },
    { label: 'Ожидание', value: stats.waiting, color: 'bg-violet-500' },
    { label: 'Решенные', value: stats.resolved, color: 'bg-emerald-500' },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Профиль</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* User Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
              <UserAvatar 
                avatarUrl={user.avatar} 
                name={user.name} 
                userRole={userRole} 
                sizeClass="w-24 h-24" 
                textClass="text-4xl"
                className="border-4"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>

              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</h2>
              <div className="flex items-center gap-2 text-base text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                <Building2 className="w-4.5 h-4.5" />
                <span>{user.department}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: userRole?.color || '#6B7280' }}
                >
                  {userRole?.name || 'Пользователь'}
                </span>
                {user.position && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {user.position}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* iOS Style Avatar Editor Dialog */}
        <Dialog open={showAvatarEditor} onOpenChange={(open) => {
          if (!open) {
            setShowAvatarEditor(false);
            setTempAvatar(null);
          }
        }}>
          <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none bg-[#F2F2F7] dark:bg-black rounded-[32px] shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Редактирование аватара</DialogTitle>
            </DialogHeader>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <button 
                onClick={() => {
                  setShowAvatarEditor(false);
                  setTempAvatar(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
                <button className="px-4 py-1 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">Аватар</button>
                <button className="px-4 py-1 rounded-full text-xs font-bold text-slate-400">Постер</button>
              </div>

              <button 
                onClick={handleSaveAvatar}
                disabled={!tempAvatar || isUploadingAvatar}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  tempAvatar ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-300"
                )}
              >
                {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-8">
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              
              {/* Preview Circle */}
              <div className="relative group">
                <div className="w-48 h-48 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl">
                  <UserAvatar 
                    avatarUrl={tempAvatar || user.avatar} 
                    name={user.name} 
                    userRole={userRole} 
                    sizeClass="w-full h-full" 
                    textClass="text-7xl"
                    className="border-0"
                  />
                </div>
                
                {(tempAvatar || user.avatar) && (
                  <button 
                    onClick={handleResetAvatar}
                    className="absolute -top-1 -right-1 w-8 h-8 bg-slate-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors border-2 border-white dark:border-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <button className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-900 dark:text-white">
                Настроить
              </button>

              {/* Grid Options (iOS Style) */}
              <div className="w-full space-y-6 overflow-y-auto max-h-[300px] px-6 py-2 custom-scrollbar">
                {/* Photo Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Фото &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    {/* Render up to 3 previous avatars from history */}
                    {user.avatarHistory?.map((histAvatar, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setTempAvatar(histAvatar)}
                        className={cn(
                          "aspect-square rounded-full overflow-hidden transition-all hover:scale-110",
                          tempAvatar === histAvatar && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                        )}
                      >
                        <UserAvatar 
                          avatarUrl={histAvatar} 
                          name={user.name} 
                          userRole={userRole} 
                          sizeClass="w-full h-full" 
                          textClass="text-lg"
                        />
                      </button>
                    ))}
                    {/* Fill empty slots if history is less than 3 */}
                    {Array.from({ length: Math.max(0, 3 - (user.avatarHistory?.length || 0)) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square rounded-full bg-slate-300/30 dark:bg-slate-700/30 overflow-hidden" />
                    ))}
                  </div>
                </div>

                {/* Memoji Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Memoji &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Smile className="w-6 h-6" />
                    </button>
                    {memojis.map((emoji, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSelectEmoji(emoji)}
                        className={cn(
                          "aspect-square rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110",
                          idx % 4 === 0 ? "bg-blue-100" : idx % 4 === 1 ? "bg-amber-100" : idx % 4 === 2 ? "bg-emerald-100" : "bg-rose-100",
                          tempAvatar === emoji && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monogram Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Монограмма &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Aa</button>
                    {monogramColors.map((color, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSelectMonogram(color)}
                        className={cn(
                          "aspect-square rounded-full flex items-center justify-center text-xl font-bold text-white transition-all hover:scale-110",
                          color,
                          tempAvatar === `monogram:${color}` && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                        )}
                      >
                        {user.name.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Статистика заявок</h3>
          <div className="grid grid-cols-5 gap-2">
            {statItems.map((item) => (
              <div key={item.label} className="text-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
                  item.color
                )}>
                  <span className="text-white font-bold text-sm">{item.value}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* App Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Настройки</h3>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Settings Button */}
            <button 
              onClick={onOpenSettings}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-700 dark:text-slate-200">Настройки приложения</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Внешний вид, уведомления, компания</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </button>

            {/* Theme Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  isDark ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                  {isDark ? (
                    <Moon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Темная тема</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {isDark ? 'Включена' : 'Выключена'}
                  </p>
                </div>
              </div>
              <Switch checked={isDark} onCheckedChange={onToggleTheme} />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  {isUpdatingNotifications ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Уведомления</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {isUpdatingNotifications ? 'Обновление...' : 'Оповещения о статусе сотрудников'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={user.notificationsEnabled || false} 
                onCheckedChange={handleToggleNotifications}
                disabled={isUpdatingNotifications}
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Связаться с поддержкой</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">help@medin.ru</p>
                </div>
              </div>
            </div>

            {/* About Page Link */}
            <button 
              onClick={() => navigate('/about')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-slate-700 dark:text-slate-200">О программе</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Версия, история обновлений, тех. стек</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3 text-red-600 dark:text-red-400 active:scale-[0.99] transition-transform"
            >
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium">Выйти из аккаунта</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Выход из системы</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите выйти из своей учетной записи?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Выйти
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="pt-8 text-center pb-8">
          <p className="text-xs font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
            Медин v1.2.6 Current
          </p>
        </div>
      </div>
    </div>
  );
}
