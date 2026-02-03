import { useState } from 'react';
import type { Role, UserWithRole, ActivityLog, ModuleId, ModulePermission } from '@/types/roles';
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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type AdminTab = 'users' | 'roles' | 'logs' | 'settings';

interface AdminScreenProps {
  roles: Role[];
  users: UserWithRole[];
  logs: ActivityLog[];
  onCreateRole: (_role: Omit<Role, 'id'>) => void;
  onUpdateRole: (_roleId: string, _data: Partial<Role>) => void;
  onDeleteRole: (roleId: string) => void;
  onCreateUser: (_user: Omit<UserWithRole, 'id' | 'createdAt'>) => void;
  onUpdateUser: (_userId: string, _data: Partial<UserWithRole>) => void;
  onDeleteUser: (userId: string) => void;
}

export function AdminScreen({
  roles,
  users,
  logs,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
}: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  const tabs = [
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'roles' as const, label: 'Роли', icon: Shield },
    { id: 'logs' as const, label: 'Логи', icon: ScrollText },
  ];

  // Filter users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
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
    department: '',
    isActive: true,
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
        department: user.department,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        name: '',
        email: '',
        roleId: roles[0]?.id || '',
        department: '',
        isActive: true,
      });
    }
    setShowUserForm(true);
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

  const handleSaveUser = () => {
    if (!userFormData.name.trim() || !userFormData.roleId || !userFormData.department.trim()) {
      return;
    }

    if (editingUser) {
      onUpdateUser(editingUser.id, userFormData);
    } else {
      onCreateUser(userFormData);
    }
    setShowUserForm(false);
    setEditingUser(null);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
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
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
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
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
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
                disabled={!userFormData.name.trim() || !userFormData.roleId || !userFormData.department.trim()}
              >
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
