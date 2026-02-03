import { Mail, Building2, LogOut, Settings, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { Role } from '@/types/roles';

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

// Mock current user - in real app would come from auth
const currentUser = {
  id: '1',
  name: 'Иван Петров',
  email: 'ivan@medin.ru',
  role: 'admin',
  department: 'IT-отдел',
  avatar: undefined,
};

export function ProfileScreen({ stats, theme, onToggleTheme, onOpenSettings, userRole }: ProfileScreenProps) {
  const isDark = theme === 'dark';

  const statItems = [
    { label: 'Всего', value: stats.total, color: 'bg-slate-500' },
    { label: 'Новые', value: stats.new, color: 'bg-blue-500' },
    { label: 'В работе', value: stats.in_progress, color: 'bg-amber-500' },
    { label: 'Ожидание', value: stats.waiting, color: 'bg-violet-500' },
    { label: 'Решенные', value: stats.resolved, color: 'bg-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Профиль</h1>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* User Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: userRole?.color || '#3B82F6' }}
            >
              <span className="text-2xl font-bold text-white">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{currentUser.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                <Building2 className="w-4 h-4" />
                <span>{currentUser.department}</span>
              </div>
              <div className="mt-2">
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: userRole?.color || '#6B7280' }}
                >
                  {userRole?.name || 'Пользователь'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
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
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Уведомления</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Push-уведомления о новых заявках</p>
                </div>
              </div>
              <Switch defaultChecked />
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
          </div>
        </div>

        {/* Logout */}
        <button className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3 text-red-600 dark:text-red-400 active:scale-[0.99] transition-transform">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium">Выйти из аккаунта</span>
        </button>

        {/* Version */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Медин v3.0.0
        </p>
      </div>
    </div>
  );
}
