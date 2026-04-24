import { useState } from 'react';
import type { Role, UserWithRole, ActivityLog, ModuleId, ModulePermission } from '@/types/roles';
import type { RegistrationRequest } from '@/types';
import { moduleLabels, actionLabels } from '@/types/roles';
import { 
  Users, 
  Shield, 
  ScrollText, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  Eye,
  UserPlus,
  Check,
  X,
  MapPin,
  Building as BuildingIcon,
  Layers,
  Monitor,
  FileText,
  Info,
  Loader2
} from 'lucide-react';
import { useLocationStore } from '@/stores/locationStore';
import { useGuideStore } from '@/stores/guideStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AdminTab = 'users' | 'roles' | 'requests' | 'locations' | 'logs' | 'about';

interface AdminScreenProps {
  roles: Role[];
  users: UserWithRole[];
  logs: ActivityLog[];
  requests: RegistrationRequest[];
  onCreateRole: (_role: Omit<Role, 'id'>) => void;
  onUpdateRole: (_roleId: string, _data: Partial<Role>) => void;
  onDeleteRole: (roleId: string) => void;
  onCreateUser: (_user: Omit<UserWithRole, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateUser: (_userId: string, _data: Partial<UserWithRole>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onApproveRequest: (id: string) => Promise<void>;
  onRejectRequest: (id: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function AdminScreen({
  roles,
  users,
  logs,
  requests,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onApproveRequest,
  onRejectRequest,
  onDeleteRequest,
  isLoading = false,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const versions = [
    {
      version: '1.1.1',
      date: '2026-04-23',
      changes: [
        'Исправлены критические ошибки в модулях «Чат» и «База знаний»',
        'Оптимизирована работа Socket.io для стабильного соединения по локальной сети',
        'Разделена логика Справочника сотрудников и Управления пользователями CRM',
        'Удалены лишние пользователи из модуля управления, оставлены только администраторы и техники',
        'Исправлены ошибки типизации TypeScript в компонентах интерфейса'
      ]
    },
    {
      version: '1.1.0',
      date: '2026-04-23',
      changes: [
        'Полный переход со статических mock-данных на реальную базу данных PostgreSQL',
        'Внедрение Docker и Docker Compose для развертывания инфраструктуры',
        'Миграция всех модулей: Заявки, Справочник, База знаний, Инвентарь, Документы',
        'Реализация полноценного API на Fastify',
        'Добавление панели управления сервером (Dashboard) для мониторинга логов'
      ]
    },
    {
      version: '1.0.9.1',
      date: '2026-04-22',
      changes: [
        'Модуль Документы (Android Optimization): Улучшены жесты свайпа и стабильность скролла (overscroll-contain).',
        'Модуль Документы: Включено GPU-ускорение (will-change) для плавной отрисовки индикатора времени.',
        'Модуль Документы: Улучшена видимость индикатора текущего времени на мобильных экранах (контрастная обводка).',
        'Модуль Документы: Заблокировано случайное выделение текста при быстрой навигации по дням.'
      ]
    },
    {
      version: '1.0.9',
      date: '2026-04-22',
      changes: [
        'Модуль Документы (Timeline Pro): Реализован детальный режим временной шкалы (Day Timeline) в стиле iOS.',
        'Модуль Документы: Полная 24-часовая шкала времени (00:00 - 23:00) с ровным шагом в 1 час.',
        'Модуль Документы: Реализована красная линия текущего времени с живым индикатором минут.',
        'Модуль Документы: Автоматическая фокусировка на 07:00 при входе в детальный вид.',
        'Модуль Документы: Адаптивная верстка — недельный вид для Desktop и 2-дневный вид со свайпами для Android/Mobile.',
        'Модуль Справочник: Исправлен ввод тегов — поддержка запятых и пробелов без потери фокуса.',
        'Система: Полная диагностика кода, исправление ошибок типизации и чистка неиспользуемых компонентов.'
      ]
    },
    {
      version: '1.0.8.1',
      date: '2026-04-22',
      changes: [
        'Модуль Документы: Восстановлена видимость полосы прокрутки в десктопной версии.',
        'Модуль Документы: Добавлены кастомные стили скроллбара для темной и светлой темы (тонкий, скругленный).',
        'Интерфейс: Улучшена навигация в режимах списка и плитки.'
      ]
    },
    {
      version: '1.0.8',
      date: '2026-04-22',
      changes: [
        'Модуль Документы: Название месяца перенесено в основную шапку рядом с кнопкой выбора года.',
        'Модуль Документы: Оптимизирована высота строк календаря — текущий месяц занимает основной экран, видна только первая неделя следующего.',
        'Модуль Документы: Исправлен scroll-offset для корректного отображения заголовка месяца при переходе.',
        'Модуль Документы: Восстановлено отображение названий месяцев внутри сетки календаря.',
        'Производительность: Глубокая оптимизация анимаций селектора даты (GPU-ускорение через transform/opacity).',
        'Производительность: Динамическая подгрузка месяцев (±2 года от текущей даты) для мгновенных переходов.'
      ]
    },
    {
      version: '1.0.7.1',
      date: '2026-04-22',
      changes: [
        'Модуль Документы: Исправлено перекрытие заголовка месяца липкой шапкой дней недели.',
        'Интерфейс: Улучшено позиционирование полноэкранного селектора под компактной шапкой.'
      ]
    },
    {
      version: '1.0.7',
      date: '2026-03-25',
      changes: [
        'Модуль Документы: Полное обновление дизайна календаря в стиле iOS 26.',
        'Модуль Документы: Названия месяцев вынесены в отдельную строку и центрированы над первым числом.',
        'Модуль Документы: Название месяца выделяется красным только для ТЕКУЩЕГО месяца (Март), для остальных — стандартный цвет.',
        'Модуль Документы: Увеличен шрифт дней недели в десктопной версии.',
        'Модуль Документы: Настройка высоты ячеек во всех версиях (Desktop, Mobile, Android) — теперь в рабочую область помещается ровно один месяц.',
        'Модуль Документы: Исправлена точность переключения заголовка месяца при скролле (теперь срабатывает быстрее при появлении месяца).',
        'Модуль Документы: Устранены "полеты" календаря при открытии и переходе по датам — теперь переключение происходит мгновенно.',
        'Модуль Документы: Реализовано адаптивное сокращение названий месяцев (Февр., Апр. и т.д.), если заголовок находится близко к краю экрана.',
        'Модуль Документы: Улучшен дизайн сетки календаря — скрыты вертикальные линии, добавлены линии подчеркивания для названий месяцев.',
        'Модуль Документы: Исправлено начальное позиционирование календаря строго на текущем месяце.',
        'Исправление багов: Устранены ошибки с "откатом" скролла и восстановлено выделение текущего числа.'
      ]
    },
    {
      version: '1.0.6',
      date: '2026-03-24',
      changes: [
        'Оптимизация производительности: внедрена ленивая загрузка (Lazy Loading) в Справочнике — теперь модуль открывается мгновенно.',
        'Поиск в Справочнике: добавлена задержка (Debounce) 1 секунда для плавности ввода и снижения нагрузки на устройство.',
        'Поиск в Справочнике: при вводе текста теперь отображаются сразу все найденные результаты.',
        'Улучшение UI: во все поисковые строки приложения добавлен крестик для быстрой очистки поля.',
        'Оптимизация Календаря: исправлен "пролет" месяцев при открытии, теперь календарь сразу фокусируется на текущем дне.',
        'Исправление багов: устранена ошибка TypeScript (scrollToMonth) и обновлена версия в профиле пользователя.'
      ]
    },
    {
      version: '1.0.5',
      date: '2026-03-24',
      changes: [
        'Модуль Справочник: Блок "Часто ищут" теперь работает динамически и сохраняет историю поиска.',
        'Модуль Справочник: Увеличено количество позиций в "Часто ищут" до 4-х.',
        'Модуль Справочник: Оптимизирована сетка (3 в ряд) и перенесено меню поиска для экономии места.',
        'Модуль Справочник: Улучшен дизайн кнопок связи — более мягкий зеленый цвет и крупные цифры.',
        'Обновлен список сотрудников: удалены тестовые записи, добавлено 174 актуальных контакта.',
        'Страница входа: обновлен год копирайта на 2026.'
      ]
    },
    {
      version: '1.0.4',
      date: '2026-03-24',
      changes: [
        'Модуль Документы: Календарь теперь занимает всю рабочую область на мобильных устройствах.',
        'Модуль Документы: Кнопка "Сегодня" сделана прозрачной в стиле iOS (стекло) с эффектом размытия.',
        'Модуль Документы: Исправлена кнопка "Сегодня" — теперь она корректно возвращает к текущему месяцу.',
        'Модуль Документы: Удалена лишняя плавающая кнопка "+" снизу справа.',
        'Модуль Документы: Верхняя кнопка "+" перекрашена в синий цвет.',
        'Исправлены ошибки типизации TypeScript в компоненте календаря.',
        'Добавлен раздел "О программе" в панели управления.'
      ]
    }
  ];

  const { 
    buildings, 
    floors, 
    cabinets, 
    equipment, 
    addBuilding, 
    addFloor, 
    addCabinet, 
    addEquipment 
  } = useLocationStore();

  const {
    guides: technicalGuides,
    addGuide,
    deleteGuide
  } = useGuideStore();

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter requests
  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter logs
  const filteredLogs = logs.filter(l =>
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 50);

  const getRoleById = (roleId: string) => roles.find(r => r.id === roleId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // User form state
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    roleId: '',
    position: '',
    department: '',
    isActive: true,
    username: '',
    password: '',
  });

  // Role form state
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: [] as ModulePermission[],
  });

  const handleOpenUserForm = (user?: UserWithRole) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        name: user.name,
        email: user.email || '',
        roleId: user.roleId,
        position: user.position || '',
        department: user.department || '',
        isActive: user.isActive || false,
        username: user.username || '',
        password: user.password || '',
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        roleId: roles[0]?.id || '',
        position: '',
        department: '',
        isActive: true,
        username: '',
        password: '',
      });
    }
    setShowUserForm(true);
  };

  const handleApproveAndCreateUser = async (request: RegistrationRequest) => {
    setProcessingRequestId(request.id);
    try {
      await onApproveRequest(request.id);
      setEditingUser(null);
      setUserFormData({
        name: request.name,
        email: request.email,
        roleId: roles[0]?.id || '',
        position: '',
        department: request.department,
        isActive: true,
        username: request.email.split('@')[0],
        password: Math.random().toString(36).slice(-8),
      });
      setShowUserForm(true);
      setActiveTab('users');
      toast.success('Заявка одобрена. Заполните данные пользователя.');
    } catch (error) {
      toast.error('Ошибка при одобрении заявки');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleOpenRoleForm = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({
        name: role.name,
        description: role.description,
        color: role.color,
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      const defaultPermissions: ModulePermission[] = [
        { moduleId: 'knowledge', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'tickets', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'documents', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
        { moduleId: 'profile', canView: true, canCreate: false, canEdit: true, canDelete: false },
      ];
      setRoleFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        permissions: defaultPermissions,
      });
    }
    setShowRoleForm(true);
  };

  const handleSaveUser = async () => {
    if (!userFormData.name.trim() || !userFormData.roleId || !(userFormData.department || '').trim()) {
      return;
    }

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, userFormData);
        toast.success('Данные пользователя обновлены');
      } else {
        // Find role object to get role name
        const role = roles.find(r => r.id === userFormData.roleId);
        
        await onCreateUser({
          ...userFormData,
          role: (role?.id as any) || 'user', // This is a workaround, ideally we should type this properly
        } as any);
        toast.success('Пользователь создан');
      }
      setShowUserForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Save user error:', error);
      toast.error('Ошибка при сохранении пользователя');
    }
  };

  const handleSaveRole = () => {
    if (!roleFormData.name.trim() || !roleFormData.description.trim()) {
      return;
    }

    if (editingRole) {
      onUpdateRole(editingRole.id, roleFormData);
    } else {
      onCreateRole(roleFormData);
    }
    setShowRoleForm(false);
    setEditingRole(null);
  };

  const togglePermission = (moduleId: ModuleId, action: 'view' | 'create' | 'edit' | 'delete') => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(perm => {
        if (perm.moduleId === moduleId) {
          const newPerm = { ...perm };
          if (action === 'view') newPerm.canView = !newPerm.canView;
          if (action === 'create') newPerm.canCreate = !newPerm.canCreate;
          if (action === 'edit') newPerm.canEdit = !newPerm.canEdit;
          if (action === 'delete') newPerm.canDelete = !newPerm.canDelete;
          return newPerm;
        }
        return perm;
      }),
    }));
  };

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'roles', label: 'Роли', icon: Shield },
    { id: 'requests', label: 'Запросы', icon: UserPlus },
    { id: 'locations', label: 'Локации', icon: MapPin },
    { id: 'logs', label: 'Логи', icon: ScrollText },
    { id: 'about', label: 'О программе', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 px-4 pt-4 pb-2 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Управление</h1>
        
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-5xl mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Пользователи ({filteredUsers.length})
              </h2>
              <Button onClick={() => handleOpenUserForm()} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </div>

            {filteredUsers.map((user) => {
              const role = getRoleById(user.roleId);
              return (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</span>
                          {!user.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded">
                              Неактивен
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {user.email} • {user.department}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="text-xs px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: role?.color || '#6B7280' }}
                          >
                            {role?.name || 'Нет роли'}
                          </span>
                          {user.lastLogin && (
                            <span className="text-xs text-slate-400">
                              Последний вход: {formatDate(user.lastLogin)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenUserForm(user)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        disabled={isLoading}
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Вы уверены, что хотите удалить пользователя ${user.name}?`)) {
                            try {
                              await onDeleteUser(user.id);
                              toast.success('Пользователь удален');
                            } catch (error) {
                              toast.error('Ошибка при удалении пользователя');
                            }
                          }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Роли ({roles.length})
              </h2>
              <Button onClick={() => handleOpenRoleForm()} size="sm" className="bg-blue-600">
                <Plus className="w-4 h-4 mr-1" />
                Создать роль
              </Button>
            </div>

            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{role.name}</span>
                      {role.isSystem && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          Системная
                        </span>
                      )}
                      <p className="text-sm text-slate-500 dark:text-slate-400">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRoleForm(role);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      title="Редактировать роль"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    {!role.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRole(role.id);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Удалить роль"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                    {expandedRole === role.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Permissions */}
                {expandedRole === role.id && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {role.permissions.map((perm) => (
                        <div 
                          key={perm.moduleId}
                          className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        >
                          <div className="font-medium text-sm text-slate-700 dark:text-slate-200 mb-1">
                            {moduleLabels[perm.moduleId]}
                          </div>
                          <div className="flex gap-1">
                            {perm.canView && (
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                                <Eye className="w-3 h-3 inline" />
                              </span>
                            )}
                            {perm.canCreate && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                +Созд
                              </span>
                            )}
                            {perm.canEdit && (
                              <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                                <Edit2 className="w-3 h-3 inline" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Реестр локаций и оборудования
              </h2>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const name = prompt('Введите название здания:');
                  if (name) addBuilding(name);
                }} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Здание
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buildings Tree */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Структура зданий</h3>
                <div className="space-y-2">
                  {buildings.map(building => (
                    <div key={building.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <BuildingIcon className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-slate-700 dark:text-slate-200">{building.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                          const num = prompt('Введите номер этажа:');
                          if (num) addFloor(building.id, parseInt(num));
                        }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="p-2 space-y-1">
                        {floors.filter(f => f.buildingId === building.id).map(floor => (
                          <div key={floor.id} className="pl-4 py-1">
                            <div className="flex items-center justify-between group">
                              <div className="flex items-center gap-2">
                                <Layers className="w-3 h-3 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Этаж {floor.number}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                const name = prompt('Введите название/номер кабинета:');
                                if (name) addCabinet(building.id, floor.id, name);
                              }}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="pl-4 mt-1 flex flex-wrap gap-1">
                              {cabinets.filter(c => c.floorId === floor.id).map(cabinet => (
                                <div key={cabinet.id} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {cabinet.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Оборудование</h3>
                  <Button size="sm" onClick={() => {
                    const name = prompt('Название оборудования:');
                    const model = prompt('Модель (например, Hamilton C3):');
                    if (name && model) {
                      const cabId = prompt('ID кабинета (например, c2-op1):') || '';
                      addEquipment({ name, model, cabinetId: cabId, department: 'Общий' });
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-1" /> Добавить
                  </Button>
                </div>
                <div className="space-y-2">
                  {equipment.map(item => {
                    const cab = cabinets.find(c => c.id === item.cabinetId);
                    const bld = buildings.find(b => b.id === cab?.buildingId);
                    return (
                      <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</h4>
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md font-bold">{item.model}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span>{bld?.name}, Каб. {cab?.name || 'Не указан'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Technical Guides Management */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Инструкции к оборудованию</h3>
                    <Button size="sm" variant="outline" onClick={() => {
                      const title = prompt('Название инструкции:');
                      const model = prompt('К какому оборудованию (модель):');
                      if (title && model) {
                        addGuide({ 
                          title, 
                          description: 'Техническая документация', 
                          equipmentModels: [model], 
                          fileUrls: [] 
                        });
                      }
                    }}>
                      <Plus className="w-4 h-4 mr-1" /> Добавить
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {technicalGuides.map(guide => (
                      <div key={guide.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{guide.title}</h4>
                            <div className="flex gap-1 mt-1">
                              {guide.equipmentModels.map(m => (
                                <Badge key={m} variant="secondary" className="text-[9px] px-1 py-0">{m}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteGuide(guide.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Запросы на регистрацию ({filteredRequests.length})
              </h2>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                Нет новых запросов
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{request.name}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          request.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          request.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {request.status === 'pending' ? 'Ожидает' : 
                           request.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {request.email} • {request.department}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                        <span className="font-medium text-xs text-slate-400 block mb-1">Причина запроса:</span>
                        {request.reason}
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        Создан: {formatDate(request.createdAt)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveAndCreateUser(request)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={isLoading || processingRequestId === request.id}
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Одобрить
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={async () => {
                              setProcessingRequestId(request.id);
                              try {
                                await onRejectRequest(request.id);
                                toast.success('Заявка отклонена');
                              } catch (error) {
                                toast.error('Ошибка при отклонении заявки');
                              } finally {
                                setProcessingRequestId(null);
                              }
                            }}
                            disabled={isLoading || processingRequestId === request.id}
                          >
                            {processingRequestId === request.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <X className="w-4 h-4 mr-1" />
                            )}
                            Отклонить
                          </Button>
                        </>
                      )}
                      {(request.status === 'approved' || request.status === 'rejected') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            if (!confirm('Вы уверены, что хотите удалить этот запрос?')) return;
                            setProcessingRequestId(request.id);
                            try {
                              await onDeleteRequest(request.id);
                              toast.success('Запрос удален');
                            } catch (error) {
                              toast.error('Ошибка при удалении запроса');
                            } finally {
                              setProcessingRequestId(null);
                            }
                          }}
                          className="text-slate-500 hover:text-red-600"
                          disabled={isLoading || processingRequestId === request.id}
                        >
                          {processingRequestId === request.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Журнал действий ({filteredLogs.length})
            </h2>

            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-sm border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">
                          {log.userName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {log.details || actionLabels[log.action] || log.action}
                      </p>
                      {log.entityName && (
                        <span className="text-xs text-slate-400 mt-1 inline-block">
                          {log.entityName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About Program Tab */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="7" />
                  <circle cx="50" cy="50" r="10" fill="currentColor" />
                  <path d="M50 82V65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                  <path d="M25 45C25 30 36 18 50 18C64 18 75 30 75 45C75 55 65 65 50 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">MEDIN HelpDesk</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Версия {versions[0].version}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">История обновлений</h3>
              <div className="space-y-3">
                {versions.map((v, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/20">
                        v{v.version}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{v.date}</span>
                    </div>
                    <ul className="space-y-2">
                      {v.changes?.map((change, ci) => (
                        <li key={ci} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Имя *</Label>
              <Input
                id="user-name"
                value={userFormData.name}
                onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Имя пользователя"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-username">Логин</Label>
              <Input
                id="user-username"
                value={userFormData.username}
                onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Логин для входа"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Пароль</Label>
              <Input
                id="user-password"
                type="text"
                value={userFormData.password}
                onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Пароль"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Роль *</Label>
              <Select
                value={userFormData.roleId}
                onValueChange={(value) => setUserFormData(prev => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger className="dark:bg-slate-800">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-position">Должность</Label>
              <Input
                id="user-position"
                value={userFormData.position}
                onChange={(e) => setUserFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Например: Системный администратор"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-department">Отдел *</Label>
              <Input
                id="user-department"
                value={userFormData.department}
                onChange={(e) => setUserFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Название отдела"
                className="dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="user-active">Активен</Label>
              <Switch
                id="user-active"
                checked={userFormData.isActive}
                onCheckedChange={(checked) => setUserFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveUser}
                className="flex-1 bg-blue-600"
                disabled={isLoading || !userFormData.name.trim() || !userFormData.roleId || !userFormData.department.trim()}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingUser ? 'Сохранить' : 'Создать'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Form Dialog */}
      <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingRole ? 'Редактировать роль' : 'Создать роль'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role-name" className="text-sm">Название *</Label>
                <Input
                  id="role-name"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Название роли"
                  className="dark:bg-slate-800 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-color" className="text-sm">Цвет</Label>
                <div className="flex gap-2">
                  <Input
                    id="role-color"
                    type="color"
                    value={roleFormData.color}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-14 h-9"
                  />
                  <Input
                    value={roleFormData.color}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#3B82F6"
                    className="flex-1 dark:bg-slate-800 h-9"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-description" className="text-sm">Описание *</Label>
              <Textarea
                id="role-description"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание роли"
                className="dark:bg-slate-800"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Права доступа</Label>
              <div className="border rounded-lg p-2 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-1 px-2 font-medium text-slate-700 dark:text-slate-300 text-xs">Модуль</th>
                        <th className="text-center py-1 px-1 font-medium text-slate-700 dark:text-slate-300 text-xs">Просм.</th>
                        <th className="text-center py-1 px-1 font-medium text-slate-700 dark:text-slate-300 text-xs">Созд.</th>
                        <th className="text-center py-1 px-1 font-medium text-slate-700 dark:text-slate-300 text-xs">Ред.</th>
                        <th className="text-center py-1 px-1 font-medium text-slate-700 dark:text-slate-300 text-xs">Удал.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleFormData.permissions.map((perm) => (
                        <tr key={perm.moduleId} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-700/30">
                          <td className="py-1 px-2 font-medium text-slate-700 dark:text-slate-200 text-xs">
                            {moduleLabels[perm.moduleId]}
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canView}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'view')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canCreate}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'create')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canEdit}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'edit')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canDelete}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'delete')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <Button
              onClick={handleSaveRole}
              className="flex-1 bg-blue-600"
              disabled={!roleFormData.name.trim() || !roleFormData.description.trim()}
            >
              {editingRole ? 'Сохранить' : 'Создать'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleForm(false);
                setEditingRole(null);
              }}
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
