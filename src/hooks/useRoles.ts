import { useState, useCallback, useMemo } from 'react';
import type { Role, UserWithRole, ActivityLog, SystemSettings } from '@/types/roles';
import { defaultRoles } from '@/types/roles';

// Mock users
const mockUsers: UserWithRole[] = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@medin.ru',
    roleId: 'admin',
    department: 'IT-отдел',
    isActive: true,
    createdAt: '2024-01-01T00:00:00',
    lastLogin: '2025-02-03T10:30:00',
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria@medin.ru',
    roleId: 'user',
    department: 'Регистратура',
    isActive: true,
    createdAt: '2024-02-15T00:00:00',
    lastLogin: '2025-02-02T16:45:00',
  },
  {
    id: '3',
    name: 'Алексей Иванов',
    email: 'alexey@medin.ru',
    roleId: 'technician',
    department: 'Техотдел',
    isActive: true,
    createdAt: '2024-03-10T00:00:00',
    lastLogin: '2025-02-03T09:15:00',
  },
  {
    id: '4',
    name: 'Елена Козлова',
    email: 'elena@medin.ru',
    roleId: 'viewer',
    department: 'Администрация',
    isActive: false,
    createdAt: '2024-06-01T00:00:00',
    lastLogin: '2025-01-20T11:00:00',
  },
];

// Mock logs
const mockLogs: ActivityLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Иван Петров',
    action: 'user.login',
    entityType: 'login',
    details: 'Вход в систему',
    createdAt: '2025-02-03T10:30:00',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Мария Сидорова',
    action: 'ticket.created',
    entityType: 'ticket',
    entityId: '1',
    entityName: '#1001',
    details: 'Создана заявка: Не работает принтер',
    createdAt: '2025-02-01T09:30:00',
  },
  {
    id: '3',
    userId: '1',
    userName: 'Иван Петров',
    action: 'ticket.status_changed',
    entityType: 'ticket',
    entityId: '2',
    entityName: '#1002',
    details: 'Статус изменен на "В работе"',
    createdAt: '2025-02-01T10:20:00',
  },
  {
    id: '4',
    userId: '3',
    userName: 'Алексей Иванов',
    action: 'inventory.movement',
    entityType: 'inventory',
    entityId: '1',
    entityName: 'Картридж HP 85A',
    details: 'Расход: 2 шт. - Замена в кабинете 205',
    createdAt: '2025-01-28T14:00:00',
  },
];

const defaultSettings: SystemSettings = {
  companyName: 'Медин',
  defaultTheme: 'system',
  allowUserRegistration: false,
  requireApprovalForTickets: false,
  notificationEmail: 'help@medin.ru',
  maintenanceMode: false,
};

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [users, setUsers] = useState<UserWithRole[]>(mockUsers);
  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [currentUserId] = useState<string>('1'); // Текущий пользователь

  // Получить текущего пользователя с ролью
  const currentUserWithRole = useMemo(() => {
    const user = users.find(u => u.id === currentUserId);
    const role = roles.find(r => r.id === user?.roleId);
    return { user, role };
  }, [users, roles, currentUserId]);

  // Проверить доступ к модулю
  const hasPermission = useCallback((moduleId: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
    const { role } = currentUserWithRole;
    if (!role) return false;
    
    const permission = role.permissions.find(p => p.moduleId === moduleId);
    if (!permission) return false;

    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  }, [currentUserWithRole]);

  // Получить доступные модули
  const availableModules = useMemo(() => {
    return roles
      .find(r => r.id === currentUserWithRole.role?.id)
      ?.permissions.filter(p => p.canView)
      .map(p => p.moduleId) || [];
  }, [roles, currentUserWithRole.role]);

  // CRUD для ролей
  const createRole = useCallback((data: Omit<Role, 'id'>) => {
    const newRole: Role = {
      ...data,
      id: `role_${Date.now()}`,
    };
    setRoles(prev => [...prev, newRole]);
    addLog('role.created', 'role', newRole.id, newRole.name, `Создана роль: ${newRole.name}`);
    return newRole;
  }, []);

  const updateRole = useCallback((roleId: string, data: Partial<Role>) => {
    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        const updated = { ...r, ...data };
        addLog('role.updated', 'role', r.id, r.name, `Обновлена роль: ${r.name}`);
        return updated;
      }
      return r;
    }));
  }, []);

  const deleteRole = useCallback((roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      throw new Error('Нельзя удалить системную роль');
    }
    setRoles(prev => prev.filter(r => r.id !== roleId));
    addLog('role.deleted', 'role', roleId, role?.name, `Удалена роль: ${role?.name}`);
  }, [roles]);

  // CRUD для пользователей
  const createUser = useCallback((data: Omit<UserWithRole, 'id' | 'createdAt'>) => {
    const newUser: UserWithRole = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    addLog('user.created', 'user', newUser.id, newUser.name, `Создан пользователь: ${newUser.name}`);
    return newUser;
  }, []);

  const updateUser = useCallback((userId: string, data: Partial<UserWithRole>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...data };
        addLog('user.updated', 'user', u.id, u.name, `Обновлен пользователь: ${u.name}`);
        return updated;
      }
      return u;
    }));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addLog('user.deleted', 'user', userId, user?.name, `Удален пользователь: ${user?.name}`);
  }, [users]);

  // Логирование
  const addLog = useCallback((action: string, entityType: ActivityLog['entityType'], entityId?: string, entityName?: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      userId: currentUserId,
      userName: currentUserWithRole.user?.name || 'Система',
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Храним последние 1000 логов
  }, [currentUserId, currentUserWithRole.user]);

  // Настройки
  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      addLog('settings.updated', 'settings', undefined, undefined, 'Обновлены системные настройки');
      return updated;
    });
  }, [addLog]);

  // Фильтрация логов
  const filterLogs = useCallback((filters: {
    userId?: string;
    entityType?: ActivityLog['entityType'];
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) => {
    return logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.entityType && log.entityType !== filters.entityType) return false;
      if (filters.dateFrom && new Date(log.createdAt) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(log.createdAt) > new Date(filters.dateTo)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches = 
          log.userName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.details?.toLowerCase().includes(searchLower) ||
          log.entityName?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs]);

  return {
    // Данные
    roles,
    users,
    logs,
    settings,
    currentUserWithRole,
    availableModules,
    
    // Проверка прав
    hasPermission,
    
    // Роли
    createRole,
    updateRole,
    deleteRole,
    
    // Пользователи
    createUser,
    updateUser,
    deleteUser,
    
    // Логи
    addLog,
    filterLogs,
    
    // Настройки
    updateSettings,
  };
}
