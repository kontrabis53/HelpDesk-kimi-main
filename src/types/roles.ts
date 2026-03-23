// Система ролей и прав доступа

import type { User } from './index';

export type ModuleId = 'knowledge' | 'tickets' | 'documents' | 'inventory' | 'directory' | 'chat' | 'parser' | 'admin' | 'profile' | 'guides';

export interface ModulePermission {
  moduleId: ModuleId;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: ModulePermission[];
  isSystem?: boolean; // Системная роль нельзя удалить
}

// Deprecated: Use User from '@/types/index' instead
export type UserWithRole = User;

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'ticket' | 'document' | 'inventory' | 'user' | 'role' | 'settings' | 'login';
  entityId?: string;
  entityName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  defaultTheme: 'light' | 'dark' | 'system';
  allowUserRegistration: boolean;
  requireApprovalForTickets: boolean;
  notificationEmail?: string;
  maintenanceMode: boolean;
}

// Предустановленные роли
export const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем модулям и настройкам системы',
    color: '#8B5CF6',
    isSystem: true,
    permissions: [
      { moduleId: 'knowledge', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'tickets', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'directory', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'parser', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'admin', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'guides', canView: true, canCreate: true, canEdit: true, canDelete: true },
    ],
  },
  {
    id: 'technician',
    name: 'Технический специалист',
    description: 'Доступ к заявкам, базе знаний и складу',
    color: '#3B82F6',
    isSystem: true,
    permissions: [
      { moduleId: 'knowledge', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'tickets', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'documents', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'inventory', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'directory', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'parser', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'guides', canView: true, canCreate: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'user',
    name: 'Пользователь',
    description: 'Базовый доступ - создание заявок и просмотр базы знаний',
    color: '#10B981',
    isSystem: true,
    permissions: [
      { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'tickets', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { moduleId: 'documents', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'directory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'parser', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'profile', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { moduleId: 'guides', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ],
  },
  {
    id: 'viewer',
    name: 'Наблюдатель',
    description: 'Только просмотр заявок и базы знаний',
    color: '#6B7280',
    isSystem: true,
    permissions: [
      { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'tickets', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'documents', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'directory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'chat', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { moduleId: 'parser', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'profile', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { moduleId: 'guides', canView: true, canCreate: false, canEdit: false, canDelete: false },
    ],
  },
];

export const moduleLabels: Record<ModuleId, string> = {
  knowledge: 'База знаний',
  tickets: 'Заявки',
  documents: 'Документы',
  inventory: 'Склад',
  directory: 'Справочник',
  chat: 'Чат',
  parser: 'Парсер',
  admin: 'Управление',
  profile: 'Профиль',
  guides: 'Инструкции',
};

export const moduleIcons: Record<ModuleId, string> = {
  knowledge: 'BookOpen',
  tickets: 'Home',
  documents: 'FileText',
  inventory: 'Package',
  directory: 'Users',
  chat: 'MessageSquare',
  parser: 'Network',
  admin: 'Settings',
  profile: 'User',
  guides: 'Book',
};

export const actionLabels: Record<string, string> = {
  'ticket.created': 'Создана заявка',
  'ticket.updated': 'Обновлена заявка',
  'ticket.deleted': 'Удалена заявка',
  'ticket.status_changed': 'Изменен статус заявки',
  'document.created': 'Создан документ',
  'document.updated': 'Обновлен документ',
  'document.deleted': 'Удален документ',
  'inventory.created': 'Добавлен товар',
  'inventory.updated': 'Обновлен товар',
  'inventory.movement': 'Движение по складу',
  'user.created': 'Создан пользователь',
  'user.updated': 'Обновлен пользователь',
  'user.login': 'Вход в систему',
  'user.logout': 'Выход из системы',
  'role.created': 'Создана роль',
  'role.updated': 'Обновлена роль',
  'role.deleted': 'Удалена роль',
  'settings.updated': 'Обновлены настройки',
};
