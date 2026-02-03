import { useState } from 'react';
import { ArrowLeft, Building2, Mail, Moon, Sun, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingsScreenProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function SettingsScreen({ onBack, theme, onToggleTheme }: SettingsScreenProps) {
  const [activeSection, setActiveSection] = useState<'appearance' | 'company' | 'notifications'>('appearance');
  const [companyName, setCompanyName] = useState('Медин');
  const [notificationEmail, setNotificationEmail] = useState('help@medin.ru');
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const sections = [
    { id: 'appearance' as const, label: 'Внешний вид', icon: Moon },
    { id: 'company' as const, label: 'Компания', icon: Building2 },
    { id: 'notifications' as const, label: 'Уведомления', icon: Mail },
  ];

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
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Настройки</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Appearance Section */}
        {activeSection === 'appearance' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Внешний вид</h2>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Темная тема</p>
                  <p className="text-sm text-slate-400">Переключить между светлой и темной темой</p>
                </div>
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-violet-500" />
                  )}
                  <Switch checked={theme === 'dark'} onCheckedChange={onToggleTheme} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Section */}
        {activeSection === 'company' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Настройки компании</h2>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Название компании
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Регистрация пользователей</p>
                  <p className="text-sm text-slate-400">Разрешить самостоятельную регистрацию</p>
                </div>
                <Switch checked={allowRegistration} onCheckedChange={setAllowRegistration} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Требовать одобрение заявок</p>
                  <p className="text-sm text-slate-400">Новые заявки требуют подтверждения</p>
                </div>
                <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">Режим обслуживания</p>
                  <p className="text-sm text-slate-400">Временно отключить доступ для пользователей</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Уведомления</h2>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Email для уведомлений
                </label>
                <Input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="help@company.ru"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Новые заявки</p>
                    <p className="text-sm text-slate-400">Уведомлять о создании новых заявок</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Изменение статуса</p>
                    <p className="text-sm text-slate-400">Уведомлять об изменении статуса заявки</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Комментарии</p>
                    <p className="text-sm text-slate-400">Уведомлять о новых комментариях</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Низкий запас на складе</p>
                    <p className="text-sm text-slate-400">Уведомлять когда товар заканчивается</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
}
