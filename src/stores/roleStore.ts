import { create } from 'zustand';
import type { Role, ActivityLog, ModuleId, SystemSettings } from '@/types/roles';
import type { User } from '@/types';
import { useAuthStore } from './authStore';
import apiClient from '@/api/client/apiClient';

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
  settings: SystemSettings;
  isLoading: boolean;
  
  // Computed
  currentUser: () => User | undefined;
  currentUserRole: () => Role | undefined;
  availableModules: () => ModuleId[];
  
  // Actions
  fetchRoles: () => Promise<void>;
  fetchUsers: () => Promise<void>,
  initStatusListener: () => void;
  setRoles: (roles: Role[]) => void;
  setUsers: (users: User[]) => void;
  setSettings: (settings: SystemSettings) => void;
  getRoleById: (roleId: string) => Role | undefined;
  getUserById: (userId: string) => User | undefined;
  hasPermission: (moduleId: ModuleId, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  addLog: (action: string, entityType: ActivityLog['entityType'], entityId?: string, entityName?: string, details?: string) => void;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (id: string, role: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  // Initial state
  roles: [],
  users: [],
  isLoading: false,
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
  settings: defaultSettings,

  fetchRoles: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/roles');
      set({ roles: response.data || [], isLoading: false });
    } catch (error: any) {
      console.error('Fetch roles error:', error);
      set({ isLoading: false });
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching users from:', apiClient.defaults.baseURL + '/users');
      const response = await apiClient.get('/users');
      set({ users: response.data || [], isLoading: false });
    } catch (error: any) {
      console.error('Fetch users error:', error);
      set({ isLoading: false });
    }
  },

  initStatusListener: () => {
    const handler = (e: any) => {
      const { userId, isOnline } = e.detail;
      set(state => ({
        users: state.users.map((u: User) => u.id === userId ? { ...u, isOnline } : u)
      }));
    };
    
    window.addEventListener('user_status_updated', handler);
    return () => window.removeEventListener('user_status_updated', handler);
  },
  
  // Computed selectors
  currentUser: () => {
    // Get current user from AuthStore
    return useAuthStore.getState().user || undefined;
  },
  
  currentUserRole: () => {
    const user = get().currentUser();
    if (!user) return undefined;
    return get().roles.find(r => r.id === (user.roleId || user.role));
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
    return get().users.find((u: User) => u.id === userId);
  },
  
  hasPermission: (moduleId, action) => {
    const role = get().currentUserRole();
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
  },
  
  addLog: (action, entityType, entityId, entityName, details) => {
    const user = get().currentUser();
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: user?.id || 'system',
      userName: user?.name || 'Система',
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ logs: [newLog, ...state.logs] }));
  },
  
  updateUser: async (userId, data) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.patch(`/users/${userId}`, data);
      set(state => ({
        users: state.users.map((u: User) => u.id === userId ? { ...u, ...response.data } : u),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update user error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  addUser: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/register', userData);
      set(state => ({
        users: [response.data, ...state.users],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Add user error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
  
  deleteUser: async (userId) => {
    set({ isLoading: true });
    try {
      await apiClient.delete(`/users/${userId}`);
      set(state => ({
        users: state.users.filter((u: User) => u.id !== userId),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Delete user error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createRole: async (roleData) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/roles', {
        ...roleData,
        id: roleData.name.toLowerCase().replace(/\s+/g, '-') // Temporary ID generation if backend expects it
      });
      set(state => ({
        roles: [...state.roles, response.data],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Create role error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateRole: async (id, roleData) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.patch(`/roles/${id}`, roleData);
      set(state => ({
        roles: state.roles.map(r => r.id === id ? { ...r, ...response.data } : r),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Update role error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true });
    try {
      await apiClient.delete(`/roles/${id}`);
      set(state => ({
        roles: state.roles.filter(r => r.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Delete role error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
