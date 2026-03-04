import { create } from 'zustand';
import type { Role, UserWithRole, ActivityLog, ModuleId, SystemSettings } from '@/types/roles';
import { defaultRoles } from '@/types/roles';

// Mock users (будут из базы после Phase 2)
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
  {
    id: '5',
    name: 'Дмитрий Соколов',
    email: 'dmitry@medin.ru',
    roleId: 'technician',
    department: 'IT-отдел',
    isActive: true,
    createdAt: '2024-07-15T00:00:00',
    lastLogin: '2025-02-03T08:45:00',
  },
  {
    id: '6',
    name: 'Ольга Морозова',
    email: 'olga@medin.ru',
    roleId: 'user',
    department: 'Бухгалтерия',
    isActive: true,
    createdAt: '2024-05-20T00:00:00',
    lastLogin: '2025-02-02T17:30:00',
  },
];

// Mock current user (в реальности из Auth)
const CURRENT_USER_ID = '1';

const defaultSettings: SystemSettings = {
  companyName: 'Медин',
  defaultTheme: 'system',
  allowUserRegistration: false,
  requireApprovalForTickets: false,
  notificationEmail: 'help@medin.ru',
  maintenanceMode: false,
};

interface RoleStore {
  // State
  roles: Role[];
  users: UserWithRole[];
  logs: ActivityLog[];
  currentUserId: string;
  settings: SystemSettings;
  
  // Computed
  currentUser: () => UserWithRole | undefined;
  currentUserRole: () => Role | undefined;
  availableModules: () => ModuleId[];
  
  // Actions
  setRoles: (roles: Role[]) => void;
  setUsers: (users: UserWithRole[]) => void;
  setSettings: (settings: SystemSettings) => void;
  getRoleById: (roleId: string) => Role | undefined;
  getUserById: (userId: string) => UserWithRole | undefined;
  hasPermission: (moduleId: ModuleId, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  createRole: (role: Omit<Role, 'id'>) => Role;
  updateRole: (roleId: string, data: Partial<Role>) => void;
  deleteRole: (roleId: string) => void;
  createUser: (user: Omit<UserWithRole, 'id' | 'createdAt'>) => UserWithRole;
  updateUser: (userId: string, data: Partial<UserWithRole>) => void;
  deleteUser: (userId: string) => void;
  addLog: (
    action: string,
    entityType: ActivityLog['entityType'],
    entityId?: string,
    entityName?: string,
    details?: string
  ) => void;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  // Initial state
  roles: defaultRoles,
  users: mockUsers,
  logs: [],
  currentUserId: CURRENT_USER_ID,
  settings: defaultSettings,
  
  // Computed selectors
  currentUser: () => {
    const { users, currentUserId } = get();
    return users.find(u => u.id === currentUserId);
  },
  
  currentUserRole: () => {
    const user = get().currentUser();
    if (!user) return undefined;
    return get().getRoleById(user.roleId);
  },
  
  availableModules: () => {
    const role = get().currentUserRole();
    if (!role) return [];
    
    return role.permissions
      .filter(p => p.canView)
      .map(p => p.moduleId);
  },
  
  // Actions
  setRoles: (roles) => set({ roles }),
  
  setUsers: (users) => set({ users }),
  
  setSettings: (settings) => set({ settings }),
  
  getRoleById: (roleId) => {
    return get().roles.find(r => r.id === roleId);
  },
  
  getUserById: (userId) => {
    return get().users.find(u => u.id === userId);
  },
  
  hasPermission: (moduleId, action) => {
    const role = get().currentUserRole();
    if (!role) return false;
    
    const modulePermission = role.permissions.find(p => p.moduleId === moduleId);
    if (!modulePermission) return false;
    
    switch (action) {
      case 'view':
        return modulePermission.canView;
      case 'create':
        return modulePermission.canCreate;
      case 'edit':
        return modulePermission.canEdit;
      case 'delete':
        return modulePermission.canDelete;
      default:
        return false;
    }
  },
  
  createRole: (data) => {
    const { roles } = get();
    const newRole: Role = {
      ...data,
      id: Date.now().toString(),
    };
    set({ roles: [...roles, newRole] });
    
    get().addLog('role.created', 'role', newRole.id, newRole.name, `Создана роль: ${newRole.name}`);
    
    return newRole;
  },
  
  updateRole: (roleId, data) => {
    set((state) => ({
      roles: state.roles.map((role) => {
        if (role.id === roleId) {
          return { ...role, ...data };
        }
        return role;
      }),
    }));
    
    const role = get().getRoleById(roleId);
    get().addLog('role.updated', 'role', roleId, role?.name, `Обновлена роль: ${role?.name}`);
  },
  
  deleteRole: (roleId) => {
    const role = get().getRoleById(roleId);
    
    set((state) => ({
      roles: state.roles.filter(r => r.id !== roleId),
    }));
    
    get().addLog('role.deleted', 'role', roleId, role?.name, `Удалена роль: ${role?.name}`);
  },
  
  createUser: (data) => {
    const { users } = get();
    const newUser: UserWithRole = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set({ users: [...users, newUser] });
    
    get().addLog('user.created', 'user', newUser.id, newUser.name, `Создан пользователь: ${newUser.name}`);
    
    return newUser;
  },
  
  updateUser: (userId, data) => {
    set((state) => ({
      users: state.users.map((user) => {
        if (user.id === userId) {
          return { ...user, ...data };
        }
        return user;
      }),
    }));
    
    const user = get().getUserById(userId);
    get().addLog('user.updated', 'user', userId, user?.name, `Обновлен пользователь: ${user?.name}`);
  },
  
  deleteUser: (userId) => {
    const user = get().getUserById(userId);
    
    set((state) => ({
      users: state.users.filter(u => u.id !== userId),
    }));
    
    get().addLog('user.deleted', 'user', userId, user?.name, `Удален пользователь: ${user?.name}`);
  },
  
  addLog: (action, entityType, entityId, entityName, details) => {
    const user = get().currentUser();
    if (!user) return;
    
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs],
    }));
  },
}));
