import { create } from 'zustand';
import type { Role, ActivityLog, ModuleId, SystemSettings } from '@/types/roles';
import type { User } from '@/types';
import { defaultRoles } from '@/types/roles';
import { users } from '@/data/mock';

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
  users: User[];
  logs: ActivityLog[];
  currentUserId: string;
  settings: SystemSettings;
  
  // Computed
  currentUser: () => User | undefined;
  currentUserRole: () => Role | undefined;
  availableModules: () => ModuleId[];
  
  // Actions
  setRoles: (roles: Role[]) => void;
  setUsers: (users: User[]) => void;
  setSettings: (settings: SystemSettings) => void;
  getRoleById: (roleId: string) => Role | undefined;
  getUserById: (userId: string) => User | undefined;
  hasPermission: (moduleId: ModuleId, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  addLog: (action: string, entityType: ActivityLog['entityType'], entityId?: string, entityName?: string, details?: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  addUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  createRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  // Initial state
  roles: defaultRoles,
  users: users,
  logs: [
    {
      id: '1',
      userId: '1',
      userName: 'Иван Петров',
      action: 'login',
      entityType: 'login',
      details: 'Успешный вход в систему',
      createdAt: '2025-02-03T10:30:00',
    }
  ],
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
    return get().roles.find(r => r.id === user.roleId);
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
    
    // Admin has full access
    if (role.id === 'admin') return true;
    
    const permission = role.permissions.find(p => p.moduleId === moduleId);
    if (!permission) return false;
    
    switch (action) {
      case 'view': return permission.canView;
      case 'create': return permission.canCreate;
      case 'edit': return permission.canEdit;
      case 'delete': return permission.canDelete;
      default: return false;
    }
  },
  
  addLog: (action, entityType, entityId, entityName, details) => {
    const user = get().currentUser();
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: user?.id || 'system',
      userName: user?.name || 'System',
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdAt: new Date().toISOString(),
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs]
    }));
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
  },
  
  addUser: (user) => {
    set((state) => ({
      users: [...state.users, user]
    }));
  },
  
  deleteUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    }));
  },

  createRole: (roleData) => {
    set((state) => ({
      roles: [...state.roles, { ...roleData, id: Date.now().toString() }],
    }));
  },

  updateRole: (id, roleData) => {
    set((state) => ({
      roles: state.roles.map((r) => (r.id === id ? { ...r, ...roleData } : r)),
    }));
  },

  deleteRole: (id) => {
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id),
    }));
  },
}));
