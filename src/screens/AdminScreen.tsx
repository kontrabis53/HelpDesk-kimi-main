import { useState, useEffect } from 'react';
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
  ArrowUpDown,
  UserPlus,
  Check,
  X,
  MapPin,
  Building as BuildingIcon,
  Layers,
  Monitor,
  Stethoscope,
  FlaskConical,
  Activity,
  ClipboardList,
  Search as SearchIcon,
  Loader2,
  ShieldAlert,
  Settings,
  EyeOff,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { useLocationStore } from '@/stores/locationStore';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { DataCables } from '@/components/DataCables';

type AdminTab = 'users' | 'roles' | 'requests' | 'locations' | 'logs';

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
  onDeleteUser: (userId: string, masterPassword?: string) => Promise<void>;
  onApproveRequest: (id: string) => Promise<void>;
  onRejectRequest: (id: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function AdminScreen({
  roles = [],
  users = [],
  logs = [],
  requests = [],
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
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeactivateOption, setShowDeactivateOption] = useState(false);
  const [locationView, setLocationView] = useState<'floors' | 'departments' | 'equipment'>('floors');
  const [editingBuilding, setEditingBuilding] = useState<string | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [userToBlock, setUserToBlock] = useState<UserWithRole | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  // Custom Dialog States for Locations Registry
  const [locationDialog, setLocationDialog] = useState<{
    isOpen: boolean;
    type: 'building' | 'floor' | 'department' | 'cabinet' | 'equipment';
    mode: 'add' | 'edit' | 'delete';
    title: string;
    description?: string;
    inputValue?: string;
    inputDescription?: string;
    buildingId?: string;
    floorId?: string;
    id?: string;
    model?: string;
    cabinetId?: string;
    icon?: string;
    color?: string;
  }>({
    isOpen: false,
    type: 'building',
    mode: 'add',
    title: '',
    model: '',
    cabinetId: '',
    icon: 'Stethoscope',
    color: '#10B981',
  });

  const deptConfigs = [
    { name: 'ЛКО', icon: 'Stethoscope', color: '#3B82F6', label: 'Лечебно-консультативное' },
    { name: 'ДО', icon: 'Search', color: '#10B981', label: 'Диагностическое' },
    { name: 'КДЛ', icon: 'FlaskConical', color: '#8B5CF6', label: 'Лаборатория' },
    { name: 'АХО', icon: 'Building', color: '#6B7280', label: 'Хозяйственное' },
    { name: 'Хирургия', icon: 'Activity', color: '#EF4444', label: 'Хирургия' },
    { name: 'Клиника Live', icon: 'ClipboardList', color: '#F59E0B', label: 'Регистратура' },
  ];

  const getDeptIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Stethoscope': return Stethoscope;
      case 'Search': return SearchIcon;
      case 'FlaskConical': return FlaskConical;
      case 'Building': return BuildingIcon;
      case 'Activity': return Activity;
      case 'ClipboardList': return ClipboardList;
      default: return Stethoscope;
    }
  };

  const closeLocationDialog = () => {
    setLocationDialog(prev => ({ ...prev, isOpen: false }));
    setMasterPassword('');
  };

  const { 
    buildings, 
    floors, 
    departments, 
    cabinets, 
    equipment, 
    isLoading: isLocationsLoading,
    fetchData, 
    addBuilding, 
    updateBuilding, 
    deleteBuilding,
    reorderBuildings,
    reorderCabinets,
    addFloor, 
    updateFloor,
    deleteFloor,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addCabinet, 
    updateCabinet,
    deleteCabinet,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    isLocked,
    setIsLocked
  } = useLocationStore();

  const [lockDialog, setLockDialog] = useState({
    isOpen: false,
    password: ''
  });

  const handleToggleLock = () => {
    if (!isLocked) {
      setIsLocked(true);
      toast.success('Позиции заблокированы');
    } else {
      setLockDialog({ isOpen: true, password: '' });
    }
  };

  const confirmUnlock = () => {
    if (lockDialog.password === 'root') {
      setIsLocked(false);
      setLockDialog({ isOpen: false, password: '' });
      toast.success('Позиции разблокированы');
    } else {
      toast.error('Неверный мастер-пароль');
    }
  };

  useEffect(() => {
    if (activeTab === 'locations') {
      fetchData();
    }
  }, [activeTab, fetchData]);

  const autoStyleDepartments = async () => {
    let count = 0;
    for (const dept of departments) {
      const config = deptConfigs.find(c => 
        dept.name.toLowerCase().includes(c.name.toLowerCase()) || 
        (c.label && dept.name.toLowerCase().includes(c.label.toLowerCase()))
      );
      if (config && (!dept.icon || !dept.color)) {
        await updateDepartment(dept.id, { icon: config.icon, color: config.color });
        count++;
      }
    }
    if (count > 0) toast.success(`Стили применены к ${count} отделениям`);
  };

  const [confirmMove, setConfirmMove] = useState<{
    isOpen: boolean;
    type: 'building' | 'cabinet';
    id: string;
    direction: 'up' | 'down';
    targetName: string;
    itemName: string;
  }>({
    isOpen: false,
    type: 'building',
    id: '',
    direction: 'up',
    targetName: '',
    itemName: ''
  });

  const [resizingBuilding, setResizingBuilding] = useState<{ id: string, startX: number, startWidth: number } | null>(null);

  useEffect(() => {
    if (!resizingBuilding) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizingBuilding.startX;
      const newWidth = Math.max(250, resizingBuilding.startWidth + deltaX);
      const buildingEl = document.getElementById(`building-${resizingBuilding.id}`);
      if (buildingEl) buildingEl.style.width = `${newWidth}px`;
    };

    const handleMouseUp = async (e: MouseEvent) => {
      const deltaX = e.clientX - resizingBuilding.startX;
      const finalWidth = Math.max(250, resizingBuilding.startWidth + deltaX);
      await updateBuilding(resizingBuilding.id, { width: finalWidth });
      setResizingBuilding(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingBuilding, updateBuilding]);

  const handleConfirmedMove = async () => {
    const { type, id, direction } = confirmMove;
    if (type === 'building') {
      const sortedBuildings = [...buildings].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = sortedBuildings.findIndex(b => b.id === id);
      let newIndex: number;

      const dropTargetId = (window as any)._dropBuildingTargetId;
      if (dropTargetId) {
        newIndex = sortedBuildings.findIndex(b => b.id === dropTargetId);
        delete (window as any)._dropBuildingTargetId;
      } else {
        newIndex = direction === 'up' ? index - 1 : index + 1;
      }

      if (newIndex < 0) newIndex = 0;
      if (newIndex >= sortedBuildings.length) newIndex = sortedBuildings.length - 1;

      const updatedBuildings = [...sortedBuildings];
      const [moved] = updatedBuildings.splice(index, 1);
      updatedBuildings.splice(newIndex, 0, moved);
      
      const orders = updatedBuildings.map((b, i) => ({ id: b.id, order: i }));
      console.log('[DND] Reordering buildings:', orders);
      await reorderBuildings(orders);
    } else {
      const cabinet = cabinets.find(c => c.id === id);
      if (!cabinet) return;
      const floorCabinets = cabinets
        .filter(c => c.floorId === cabinet.floorId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
      const index = floorCabinets.findIndex(c => c.id === id);
      let newIndex: number;

      // Check if this was a drop action
      const dropTargetId = (window as any)._dropTargetId;
      if (dropTargetId) {
        newIndex = floorCabinets.findIndex(c => c.id === dropTargetId);
        delete (window as any)._dropTargetId;
      } else {
        newIndex = direction === 'up' ? index - 1 : index + 1;
      }

      // Safeguard for index bounds
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= floorCabinets.length) newIndex = floorCabinets.length - 1;

      const updatedFloorCabinets = [...floorCabinets];
      const [moved] = updatedFloorCabinets.splice(index, 1);
      updatedFloorCabinets.splice(newIndex, 0, moved);
      
      // Map new order based on current floor context only
      const orders = updatedFloorCabinets.map((c, i) => ({ id: c.id, order: i }));
      
      console.log('[DND] Reordering cabinets:', orders);
      await reorderCabinets(orders);
    }
    setConfirmMove(prev => ({ ...prev, isOpen: false }));
    toast.success('Порядок изменен');
  };

  const handleLocationAction = async () => {
    const { type, mode, inputValue, inputDescription, buildingId, floorId, id, model, cabinetId, icon, color } = locationDialog;
    
    // Special case for unlocking with master password
    if (mode === 'delete' && !id && type === 'building' && locationDialog.title === 'Разблокировать реестр') {
      if (masterPassword === 'root') {
        setIsLocked(false);
        toast.success('Доступ разрешен');
        setMasterPassword('');
        closeLocationDialog();
      } else {
        toast.error('Неверный мастер-пароль');
      }
      return;
    }

    if (mode === 'delete' && id) {
      if (type === 'building') {
        const hasFloors = floors.some(f => f.buildingId === id);
        if (hasFloors) {
          toast.error('Нельзя удалить здание: в нем есть этажи');
          return;
        }
        await deleteBuilding(id);
        toast.success('Здание удалено');
      } else if (type === 'floor') {
        const hasCabinets = cabinets.some(c => c.floorId === id);
        if (hasCabinets) {
          toast.error('Нельзя удалить этаж: на нем есть кабинеты');
          return;
        }
        await deleteFloor(id);
        toast.success('Этаж удален');
      } else if (type === 'cabinet') {
        const hasEquipment = equipment.some(e => e.cabinetId === id);
        if (hasEquipment) {
          toast.error('Нельзя удалить кабинет: в нем есть оборудование');
          return;
        }
        await deleteCabinet(id);
        toast.success('Кабинет удален');
      } else if (type === 'department') {
        const hasCabinets = cabinets.some(c => c.departmentId === id);
        const hasUsers = users.some(u => u.departmentId === id);
        if (hasCabinets || hasUsers) {
          toast.error('Нельзя удалить отделение: за ним закреплены кабинеты или сотрудники');
          return;
        }
        await deleteDepartment(id);
        toast.success('Отделение удалено');
      } else if (type === 'equipment') {
        await deleteEquipment(id);
        toast.success('Оборудование удалено');
      }
      closeLocationDialog();
      return;
    }

    if (!inputValue?.trim() && locationDialog.mode !== 'delete') return;
    const val = inputValue || '';

    if (type === 'building') {
      if (mode === 'add') await addBuilding(val);
      else if (id) await updateBuilding(id, { name: val });
      toast.success(mode === 'add' ? 'Здание добавлено' : 'Здание обновлено');
    } else if (type === 'floor') {
      // Extract number from input (e.g., "этаж 3" -> 3, "4" -> 4)
      const numMatch = val.match(/\d+/);
      if (!numMatch) {
        toast.error('Введите номер этажа (цифру)');
        return;
      }
      const floorNumber = parseInt(numMatch[0]);
      
      if (mode === 'add' && buildingId) {
        await addFloor(buildingId, floorNumber);
        toast.success('Этаж добавлен');
      } else if (mode === 'edit' && id) {
        await updateFloor(id, floorNumber);
        toast.success('Этаж обновлен');
      }
    } else if (type === 'department') {
      if (mode === 'add') await addDepartment(val, undefined, icon, color);
      else if (id) await updateDepartment(id, { name: val, icon, color });
      toast.success(mode === 'add' ? 'Отделение добавлено' : 'Отделение обновлено');
    } else if (type === 'cabinet' && buildingId && floorId) {
      if (mode === 'add' || mode === 'edit') {
        // Extract only numbers from the "number" field
        const numMatch = val.match(/\d+/);
        if (!numMatch) {
          toast.error('Введите номер кабинета (цифру)');
          return;
        }
        const cabinetNum = numMatch[0];
        const fullCabinetName = inputDescription?.trim() 
          ? `Каб. ${cabinetNum}. ${inputDescription.trim()}`
          : `Каб. ${cabinetNum}`;

        if (mode === 'add') {
          await addCabinet(buildingId, floorId, fullCabinetName);
          toast.success('Кабинет добавлен');
        } else if (mode === 'edit' && id) {
          await updateCabinet(id, { name: fullCabinetName });
          toast.success('Кабинет обновлен');
        }
      }
    } else if (type === 'equipment') {
      if (mode === 'add' || mode === 'edit') {
        if (!model?.trim()) {
          toast.error('Введите модель оборудования');
          return;
        }
        if (!cabinetId) {
          toast.error('Выберите кабинет');
          return;
        }
        const cab = cabinets.find(c => c.id === cabinetId);
        const dept = departments.find(d => d.id === cab?.departmentId);
        
        if (mode === 'add') {
          await addEquipment({ 
            name: val, 
            model, 
            cabinetId, 
            department: dept?.name || 'Общий' 
          });
          toast.success('Оборудование добавлено');
        } else if (id) {
          await updateEquipment(id, {
            name: val,
            model,
            cabinetId,
            department: dept?.name || 'Общий'
          });
          toast.success('Оборудование обновлено');
        }
      }
    }

    closeLocationDialog();
  };

  const [roleFormData, setRoleFormData] = useState<Omit<Role, 'id'>>({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: [
      { moduleId: 'tickets', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'guides', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
    ]
  });

  const [userFormData, setUserFormData] = useState<Omit<UserWithRole, 'id' | 'createdAt'>>({
    username: '',
    name: '',
    email: '',
    password: '',
    roleId: '',
    role: 'user',
    position: '',
    department: '',
    isActive: true,
    showGreeting: true,
    greetingText: 'Добро пожаловать в систему Медин!'
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRequests = requests.filter(request => 
    request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePermission = (role: Role, moduleId: ModuleId, permission: keyof Omit<ModulePermission, 'moduleId'>) => {
    const newPermissions = role.permissions.map(p => 
      p.moduleId === moduleId ? { ...p, [permission]: !p[permission] } : p
    );
    onUpdateRole(role.id, { permissions: newPermissions });
  };

  const togglePermission = (moduleId: ModuleId, field: keyof Omit<ModulePermission, 'moduleId'>) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.moduleId === moduleId ? { ...p, [field]: !p[field] } : p
      )
    }));
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      name: user.name,
      email: user.email || '',
      password: '', // Не показываем пароль
      roleId: user.roleId,
      role: user.role,
      position: user.position || '',
      department: user.department,
      isActive: user.isActive,
      showGreeting: user.showGreeting ?? true,
      greetingText: user.greetingText || 'Добро пожаловать в систему Медин!'
    });
    setShowUserForm(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: [...role.permissions]
    });
    setShowRoleForm(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // If user was active and is now being deactivated, show confirmation
        if (editingUser.isActive && !userFormData.isActive) {
          setUserToBlock(editingUser);
          return;
        }
        await onUpdateUser(editingUser.id, userFormData);
        toast.success('Пользователь обновлен');
      } else {
        await onCreateUser(userFormData);
        toast.success('Пользователь создан');
      }
      setShowUserForm(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при сохранении');
    }
  };

  const handleConfirmBlock = async () => {
    if (!userToBlock) return;
    setIsBlocking(true);
    try {
      if (editingUser) {
        // Called from within edit form
        await onUpdateUser(userToBlock.id, userFormData);
        toast.success('Пользователь обновлен и заблокирован');
        setShowUserForm(false);
        setEditingUser(null);
      } else {
        // Called from quick action button
        await onUpdateUser(userToBlock.id, { isActive: !userToBlock.isActive });
        toast.success(userToBlock.isActive ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      }
      setUserToBlock(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка при блокировке');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleSaveRole = () => {
    if (editingRole) {
      onUpdateRole(editingRole.id, roleFormData);
      toast.success('Роль обновлена');
    } else {
      onCreateRole(roleFormData);
      toast.success('Роль создана');
    }
    setShowRoleForm(false);
    setEditingRole(null);
  };

  const handleApproveAndCreateUser = async (request: RegistrationRequest) => {
    setProcessingRequestId(request.id);
    try {
      await onApproveRequest(request.id);
      toast.success('Заявка одобрена');
    } catch (error: any) {
      toast.error('Ошибка при одобрении заявки');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            ПАНЕЛЬ УПРАВЛЕНИЯ
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Система администрирования Медин</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Быстрый поиск..." 
            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800 w-fit">
        {[
          { id: 'users', label: 'Пользователи', icon: Users },
          { id: 'roles', label: 'Роли и Права', icon: Shield },
          { id: 'locations', label: 'Реестр', icon: MapPin },
          { id: 'logs', label: 'Журнал', icon: ScrollText },
          { id: 'requests', label: 'Запросы', icon: UserPlus, count: requests.filter(r => r.status === 'pending').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Пользователи ({filteredUsers.length})
              </h2>
              <Button 
                onClick={() => {
                  setEditingUser(null);
                  setUserFormData({
                    username: '',
                    name: '',
                    email: '',
                    password: '',
                    roleId: roles[0]?.id || '',
                    role: 'user',
                    position: '',
                    department: '',
                    isActive: true,
                    showGreeting: true,
                    greetingText: 'Добро пожаловать в систему Медин!'
                  });
                  setShowUserForm(true);
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-wider h-9"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Добавить
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 w-[45%]">Пользователь</th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 w-[15%]">Роль</th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 w-[10%]">Отделение</th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 w-[18%]">Должность</th>
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-400 text-right w-[12%]">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group"
                      >
                        <td className="px-4 py-3 overflow-hidden">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <UserAvatar 
                                avatarUrl={user.avatar} 
                                name={user.name} 
                                userRole={roles.find(r => r.id === user.roleId)} 
                                sizeClass="w-12 h-12" 
                                textClass="text-lg"
                                className="border border-blue-100 dark:border-blue-800/50"
                              />
                              <div className={cn(
                                "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800",
                                user.isOnline ? "bg-emerald-500" : "bg-red-500"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">{user.name}</div>
                                {!user.isActive && (
                                  <div className="px-2.5 py-1 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-bold rounded flex items-center gap-2 shrink-0 shadow-sm shadow-red-500/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Заблокирован
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-medium uppercase tracking-tighter mt-0.5 truncate">@{user.username || 'user'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const userRole = roles.find(r => r.id === user.roleId);
                            return (
                              <Badge 
                                variant="secondary" 
                                className="text-sm font-bold whitespace-nowrap px-2 py-0.5 max-w-full truncate border shadow-sm"
                                style={{ 
                                  backgroundColor: userRole ? `${userRole.color}15` : undefined,
                                  color: userRole?.color || undefined,
                                  borderColor: userRole ? `${userRole.color}30` : undefined
                                }}
                              >
                                {userRole?.name || user.role}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-base text-slate-500 dark:text-slate-400 font-medium truncate">
                            <Shield className="w-4 h-4 shrink-0" />
                            <span className="truncate">{user.department}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-base text-slate-500 dark:text-slate-400 font-medium truncate">
                            {user.position || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                              title="Редактировать"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                if (user.isActive) {
                                  setUserToBlock(user);
                                } else {
                                  onUpdateUser(user.id, { isActive: true });
                                  toast.success('Пользователь разблокирован');
                                }
                              }}
                              className={cn(
                                "p-2 rounded-lg transition-colors shrink-0 group/block",
                                user.isActive 
                                  ? "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500" 
                                  : "bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40"
                              )}
                              title={user.isActive ? "Заблокировать" : "Разблокировать"}
                            >
                              {user.isActive ? (
                                <>
                                  <Eye className="w-5 h-5 group-hover/block:hidden" />
                                  <EyeOff className="w-5 h-5 hidden group-hover/block:block" />
                                </>
                              ) : (
                                <EyeOff className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-600 transition-colors shrink-0"
                              disabled={isLoading}
                              title="Удалить"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Роли и Права доступа</h2>
              <Button 
                onClick={() => {
                  setEditingRole(null);
                  setRoleFormData({
                    name: '',
                    description: '',
                    color: '#3B82F6',
                    permissions: [
                      { moduleId: 'tickets', canView: true, canCreate: false, canEdit: false, canDelete: false },
                      { moduleId: 'inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
                      { moduleId: 'knowledge', canView: true, canCreate: false, canEdit: false, canDelete: false },
                      { moduleId: 'users', canView: false, canCreate: false, canEdit: false, canDelete: false },
                      { moduleId: 'admin', canView: false, canCreate: false, canEdit: false, canDelete: false },
                    ]
                  });
                  setShowRoleForm(true);
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-wider h-9"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Новая роль
              </Button>
            </div>

            <div className="space-y-4">
              {filteredRoles.map((role) => (
                <div 
                  key={role.id} 
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-3 h-10 rounded-full" 
                        style={{ backgroundColor: role.color }} 
                      />
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{role.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRole(role.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
                      >
                        {expandedRole === role.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  {expandedRole === role.id && (
                    <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="pt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {role.permissions.map((perm) => (
                          <div 
                            key={perm.moduleId}
                            className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600/50"
                          >
                            <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {moduleLabels[perm.moduleId]}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor={`perm-${role.id}-${perm.moduleId}-view`} className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Просмотр</label>
                                <Checkbox 
                                  id={`perm-${role.id}-${perm.moduleId}-view`}
                                  checked={perm.canView}
                                  onCheckedChange={() => handleTogglePermission(role, perm.moduleId, 'canView')}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label htmlFor={`perm-${role.id}-${perm.moduleId}-create`} className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Создание</label>
                                <Checkbox 
                                  id={`perm-${role.id}-${perm.moduleId}-create`}
                                  checked={perm.canCreate}
                                  onCheckedChange={() => handleTogglePermission(role, perm.moduleId, 'canCreate')}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label htmlFor={`perm-${role.id}-${perm.moduleId}-edit`} className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer">Ред-ние</label>
                                <Checkbox 
                                  id={`perm-${role.id}-${perm.moduleId}-edit`}
                                  checked={perm.canEdit}
                                  onCheckedChange={() => handleTogglePermission(role, perm.moduleId, 'canEdit')}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label htmlFor={`perm-${role.id}-${perm.moduleId}-delete`} className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer text-red-400/80">Удаление</label>
                                <Checkbox 
                                  id={`perm-${role.id}-${perm.moduleId}-delete`}
                                  checked={perm.canDelete}
                                  onCheckedChange={() => handleTogglePermission(role, perm.moduleId, 'canDelete')}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-6 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
              {isLocationsLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    Реестр локаций и оборудования
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Управление структурой зданий, этажей и медицинских отделений</p>
                </div>
                
                <div className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl flex gap-1 shadow-inner border border-slate-200/50 dark:border-slate-800">
                  <button
                    onClick={() => setLocationView('floors')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                      locationView === 'floors' 
                        ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <BuildingIcon className="w-3.5 h-3.5" />
                    ЗДАНИЕ
                  </button>
                  <button
                    onClick={() => setLocationView('departments')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                      locationView === 'departments' 
                        ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    ОТДЕЛЕНИЯ
                  </button>
                  <button
                    onClick={() => setLocationView('equipment')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                      locationView === 'equipment' 
                        ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    ОБОРУДОВАНИЕ
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleToggleLock} 
                  variant={isLocked ? "destructive" : "outline"} 
                  size="sm" 
                  className={cn(
                    "h-9 px-3 gap-2",
                    !isLocked && "border-blue-200 text-blue-600 hover:bg-blue-50"
                  )}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Заблокировано
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Свободно
                    </>
                  )}
                </Button>
                <Separator orientation="vertical" className="h-8 hidden md:block" />
                {!isLocked && (
                  <Button onClick={() => {
                    if (locationView === 'floors') {
                      setLocationDialog({
                        isOpen: true,
                        type: 'building',
                        mode: 'add',
                        title: 'Добавить новое здание',
                        inputValue: ''
                      });
                    } else if (locationView === 'departments') {
                      setLocationDialog({
                        isOpen: true,
                        type: 'department',
                        mode: 'add',
                        title: 'Добавить новое отделение',
                        inputValue: '',
                        icon: 'Stethoscope',
                        color: '#10B981'
                      });
                    } else if (locationView === 'equipment') {
                      setLocationDialog({
                        isOpen: true,
                        type: 'equipment',
                        mode: 'add',
                        title: 'Добавить новое оборудование',
                        inputValue: '',
                        model: '',
                        cabinetId: ''
                      });
                    }
                  }} size="sm" variant="default" className="h-9 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4 mr-1" /> {locationView === 'floors' ? 'Здание' : locationView === 'departments' ? 'Отделение' : 'Оборудование'}
                  </Button>
                )}
              </div>
            </div>

            <div className="w-full relative">
              <DataCables locationView={locationView} />
              {/* Main Panel */}
              <div className="space-y-4">
                {locationView === 'floors' ? (
                  <div className="flex flex-wrap justify-between gap-y-10 gap-x-6 w-full px-4">
                    {[...buildings]
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((building, index, sortedBuildings) => (
                      <div 
                        key={building.id} 
                        id={`building-${building.id}`}
                        draggable={!resizingBuilding && !isLocked}
                        style={{ 
                          width: building.width && building.width > 0 ? `${building.width}px` : '350px',
                          maxWidth: 'calc(100vw - 48px)',
                          minWidth: '280px'
                        }}
                        onDragStart={(e) => {
                          if (resizingBuilding || isLocked) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('buildingId', building.id);
                          e.currentTarget.classList.add('opacity-50');
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove('opacity-50');
                        }}
                        onDragOver={(e) => {
                          if (isLocked) return;
                          e.preventDefault();
                          e.currentTarget.classList.add('ring-2', 'ring-blue-500', 'ring-offset-4');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-4');
                        }}
                        onDrop={async (e) => {
                          if (isLocked) return;
                          e.preventDefault();
                          e.currentTarget.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-4');
                          const draggedId = e.dataTransfer.getData('buildingId');
                          
                          if (draggedId && draggedId !== building.id) {
                            const draggedBld = buildings.find(b => b.id === draggedId);
                            if (draggedBld) {
                              setConfirmMove({
                                isOpen: true,
                                type: 'building',
                                id: draggedId,
                                direction: 'down',
                                itemName: draggedBld.name,
                                targetName: building.name
                              });
                              (window as any)._dropBuildingTargetId = building.id;
                            }
                          }
                        }}
                        className={cn(
                          "bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full group/bld relative transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
                          !isLocked && "cursor-move active:cursor-grabbing"
                        )}
                      >
                        {/* Building Roof */}
                        <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-900/40 border-l-2 border-t-2 border-slate-200 dark:border-slate-700 rotate-45 -z-10 group-hover/bld:border-blue-300 dark:group-hover/bld:border-blue-700 transition-colors" />
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 z-10" />
                        
                        {/* Resize Handle */}
                        {!isLocked && (
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500 transition-colors z-20"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const el = document.getElementById(`building-${building.id}`);
                              setResizingBuilding({
                                id: building.id,
                                startX: e.clientX,
                                startWidth: el?.offsetWidth || 350
                              });
                            }}
                          />
                        )}

                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 h-14">
                          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                            {!isLocked && (
                              <div className="flex flex-col gap-0.5 opacity-0 group-hover/bld:opacity-100 transition-opacity">
                                {index > 0 && (
                                  <button 
                                    onClick={() => setConfirmMove({
                                      isOpen: true,
                                      type: 'building',
                                      id: building.id,
                                      direction: 'up',
                                      itemName: building.name,
                                      targetName: sortedBuildings[index - 1].name
                                    })}
                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                )}
                                {index < sortedBuildings.length - 1 && (
                                  <button 
                                    onClick={() => setConfirmMove({
                                      isOpen: true,
                                      type: 'building',
                                      id: building.id,
                                      direction: 'down',
                                      itemName: building.name,
                                      targetName: sortedBuildings[index + 1].name
                                    })}
                                    className="text-slate-400 hover:text-blue-500 transition-colors"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                            <BuildingIcon className="w-4 h-4 text-blue-500 shrink-0" />
                            {editingBuilding === building.id ? (
                              <div className="flex items-center gap-1 w-full">
                                <Input 
                                  value={editName} 
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-7 text-sm py-0"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editName) {
                                      updateBuilding(building.id, { name: editName });
                                      setEditingBuilding(null);
                                    }
                                    if (e.key === 'Escape') setEditingBuilding(null);
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500" onClick={() => {
                                  if (editName) {
                                    updateBuilding(building.id, { name: editName });
                                    setEditingBuilding(null);
                                  }
                                }}><Check className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <span 
                                className={cn(
                                  "text-lg font-bold text-slate-700 dark:text-slate-200 truncate transition-colors",
                                  !isLocked && "cursor-pointer hover:text-blue-600"
                                )}
                                onClick={() => {
                                  if (isLocked) return;
                                  setEditingBuilding(building.id);
                                  setEditName(building.name);
                                }}
                                title={isLocked ? "" : "Нажмите, чтобы переименовать"}
                              >
                                {building.name}
                              </span>
                            )}
                          </div>
                          {!isLocked && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" title="Добавить этаж" onClick={() => {
                                setLocationDialog({
                                  isOpen: true,
                                  type: 'floor',
                                  mode: 'add',
                                  title: `Добавить этаж в "${building.name}"`,
                                  inputValue: '',
                                  buildingId: building.id
                                });
                              }}>
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                title="Удалить здание" 
                                onClick={() => {
                                  setLocationDialog({
                                    isOpen: true,
                                    type: 'building',
                                    mode: 'delete',
                                    title: 'Удалить здание?',
                                    description: `Вы уверены, что хотите удалить здание "${building.name}"? Это действие нельзя отменить.`,
                                    id: building.id
                                  });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="p-3 flex-1">
                          <div className="space-y-4">
                            {floors.filter(f => f.buildingId === building.id).sort((a,b) => a.number - b.number).map(floor => (
                              <div key={floor.id} className="space-y-2">
                                <div className="flex items-center justify-between group">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Этаж {floor.number}</span>
                                  </div>
                                  {!isLocked && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-500" title="Редактировать этаж" onClick={() => {
                                        setLocationDialog({
                                          isOpen: true,
                                          type: 'floor',
                                          mode: 'edit',
                                          title: 'Редактировать этаж',
                                          inputValue: floor.number.toString(),
                                          id: floor.id
                                        });
                                      }}>
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" title="Удалить этаж" onClick={() => {
                                        setLocationDialog({
                                          isOpen: true,
                                          type: 'floor',
                                          mode: 'delete',
                                          title: 'Удалить этаж?',
                                          description: `Вы уверены, что хотите удалить этаж ${floor.number}?`,
                                          id: floor.id
                                        });
                                      }}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500" title="Добавить кабинет" onClick={() => {
                                        setLocationDialog({
                                          isOpen: true,
                                          type: 'cabinet',
                                          mode: 'add',
                                          title: `Добавить кабинет на ${floor.number} этаж`,
                                          inputValue: '',
                                          buildingId: building.id,
                                          floorId: floor.id
                                        });
                                      }}>
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {cabinets
                                    .filter(c => c.floorId === floor.id)
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((cabinet, cabIdx, filteredCabs) => (
                                    <div 
                                      key={cabinet.id} 
                                      draggable={!isLocked}
                                      onDragStart={(e) => {
                                        if (isLocked) {
                                          e.preventDefault();
                                          return;
                                        }
                                        e.dataTransfer.setData('cabinetId', cabinet.id);
                                        e.dataTransfer.setData('floorId', floor.id);
                                        e.currentTarget.classList.add('opacity-50');
                                      }}
                                      onDragEnd={(e) => {
                                        e.currentTarget.classList.remove('opacity-50');
                                      }}
                                      onDragOver={(e) => {
                                        if (isLocked) return;
                                        e.preventDefault();
                                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50/50');
                                      }}
                                      onDragLeave={(e) => {
                                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                      }}
                                      onDrop={async (e) => {
                                        if (isLocked) return;
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50/50');
                                        const draggedId = e.dataTransfer.getData('cabinetId');
                                        const draggedFloorId = e.dataTransfer.getData('floorId');
                                        
                                        if (draggedId && draggedId !== cabinet.id && draggedFloorId === floor.id) {
                                          const draggedCab = cabinets.find(c => c.id === draggedId);
                                          if (draggedCab) {
                                            setConfirmMove({
                                              isOpen: true,
                                              type: 'cabinet',
                                              id: draggedId,
                                              direction: 'down', // Direction doesn't matter for the logic but required for the state
                                              itemName: draggedCab.name,
                                              targetName: cabinet.name
                                            });
                                            // Special flag to handle drop-based reordering
                                            (window as any)._dropTargetId = cabinet.id;
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "px-3 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm flex items-center gap-3 group/cab hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all",
                                        !isLocked && "cursor-move active:cursor-grabbing"
                                      )}
                                    >
                                      {!isLocked && (
                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover/cab:opacity-100 transition-opacity shrink-0">
                                          {cabIdx > 0 && (
                                            <button 
                                              onClick={() => setConfirmMove({
                                                isOpen: true,
                                                type: 'cabinet',
                                                id: cabinet.id,
                                                direction: 'up',
                                                itemName: cabinet.name,
                                                targetName: filteredCabs[cabIdx - 1].name
                                              })}
                                              className="text-slate-400 hover:text-blue-500 transition-colors"
                                            >
                                              <ChevronUp className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                          {cabIdx < filteredCabs.length - 1 && (
                                            <button 
                                              onClick={() => setConfirmMove({
                                                isOpen: true,
                                                type: 'cabinet',
                                                id: cabinet.id,
                                                direction: 'down',
                                                itemName: cabinet.name,
                                                targetName: filteredCabs[cabIdx + 1].name
                                              })}
                                              className="text-slate-400 hover:text-blue-500 transition-colors"
                                            >
                                              <ChevronDown className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
                                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate">
                                          {cabinet.name}
                                        </span>
                                      </div>
                                      {!isLocked && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/cab:opacity-100 transition-all shrink-0">
                                          <button 
                                            onClick={() => {
                                              // Parse name like "Каб. 4. Маммография" -> number "4", desc "Маммография"
                                              const nameMatch = cabinet.name.match(/Каб\.\s*(\d+)(?:\.\s*(.*))?/);
                                              const cabNum = nameMatch ? nameMatch[1] : cabinet.name;
                                              const cabDesc = nameMatch ? (nameMatch[2] || '') : '';

                                              setLocationDialog({
                                                isOpen: true,
                                                type: 'cabinet',
                                                mode: 'edit',
                                                title: 'Редактировать кабинет',
                                                inputValue: cabNum,
                                                inputDescription: cabDesc,
                                                id: cabinet.id,
                                                buildingId: building.id,
                                                floorId: floor.id
                                              });
                                            }}
                                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500"
                                            title="Редактировать кабинет"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              setLocationDialog({
                                                isOpen: true,
                                                type: 'cabinet',
                                                mode: 'delete',
                                                title: 'Удалить кабинет?',
                                                description: `Вы уверены, что хотите удалить кабинет "${cabinet.name}"?`,
                                                id: cabinet.id
                                              });
                                            }}
                                            className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500"
                                            title="Удалить кабинет"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <button className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 transition-all" title="Настройки">
                                                <Settings className="w-2.5 h-2.5" />
                                              </button>
                                            </PopoverTrigger>
                                          <PopoverContent className="w-48 p-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-1">Назначить отделение</p>
                                            <div className="space-y-1">
                                              <button 
                                                onClick={() => updateCabinet(cabinet.id, { departmentId: undefined })}
                                                className={cn(
                                                  "w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                                                  !cabinet.departmentId && "text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20"
                                                )}
                                              >
                                                Без отделения
                                              </button>
                                              {departments.map(dept => {
                                                const DeptIcon = getDeptIcon(dept.icon);
                                                return (
                                                  <button 
                                                    key={dept.id}
                                                    onClick={() => updateCabinet(cabinet.id, { departmentId: dept.id })}
                                                    className={cn(
                                                      "w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2",
                                                      cabinet.departmentId === dept.id && "text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20"
                                                    )}
                                                  >
                                                    <div 
                                                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                                      style={{ backgroundColor: `${dept.color || '#10B981'}20`, color: dept.color || '#10B981' }}
                                                    >
                                                      <DeptIcon className="w-3 h-3" />
                                                    </div>
                                                    <span className="truncate">{dept.name}</span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </PopoverContent>
                                          </Popover>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : locationView === 'departments' ? (
                  /* Global View by Departments */
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">Все отделения (сквозные)</span>
                      </div>
                      {!isLocked && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={autoStyleDepartments}
                          className="text-[10px] font-black uppercase tracking-wider h-7 bg-white dark:bg-slate-800"
                        >
                          Применить стили
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {departments.map(dept => {
                          const DeptIcon = getDeptIcon(dept.icon);
                          return (
                            <div key={dept.id} className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
                              <div className="flex items-center justify-between mb-2 group">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                        style={{ backgroundColor: `${dept.color || '#10B981'}20`, color: dept.color || '#10B981' }}
                                      >
                                        <DeptIcon className="w-4 h-4" />
                                      </div>
                                      {editingDepartment === dept.id ? (
                                        <div className="flex items-center gap-1 w-full">
                                          <Input 
                                            value={editName} 
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-6 text-sm py-0"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && editName) {
                                                updateDepartment(dept.id, { name: editName });
                                                setEditingDepartment(null);
                                              }
                                              if (e.key === 'Escape') setEditingDepartment(null);
                                            }}
                                          />
                                          <Button size="icon" variant="ghost" className="h-5 w-5 text-emerald-500" onClick={() => {
                                            if (editName) {
                                              updateDepartment(dept.id, { name: editName });
                                              setEditingDepartment(null);
                                            }
                                          }}><Check className="w-2.5 h-2.5" /></Button>
                                        </div>
                                      ) : (
                                        <span 
                                          className={cn(
                                            "text-sm font-bold text-slate-700 dark:text-slate-200 truncate transition-colors",
                                            !isLocked && "cursor-pointer hover:text-emerald-600"
                                          )}
                                          onClick={() => {
                                            if (isLocked) return;
                                            setLocationDialog({
                                              isOpen: true,
                                              type: 'department',
                                              mode: 'edit',
                                              title: 'Редактировать отделение',
                                              inputValue: dept.name,
                                              id: dept.id,
                                              icon: dept.icon,
                                              color: dept.color
                                            });
                                          }}
                                          title={isLocked ? "" : "Нажмите, чтобы редактировать"}
                                        >
                                          {dept.name}
                                        </span>
                                      )}
                                    </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                      {cabinets.filter(c => c.departmentId === dept.id).length} каб.
                                    </span>
                                    {!isLocked && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          onClick={() => {
                                            setLocationDialog({
                                              isOpen: true,
                                              type: 'department',
                                              mode: 'edit',
                                              title: 'Редактировать отделение',
                                              inputValue: dept.name,
                                              id: dept.id,
                                              icon: dept.icon,
                                              color: dept.color
                                            });
                                          }}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          onClick={() => {
                                            setLocationDialog({
                                              isOpen: true,
                                              type: 'department',
                                              mode: 'delete',
                                              title: 'Удалить отделение?',
                                              description: `Вы уверены, что хотите удалить отделение "${dept.name}"? Это действие нельзя отменить.`,
                                              id: dept.id
                                            });
                                          }}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {cabinets
                                .filter(c => c.departmentId === dept.id)
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map(cabinet => {
                                const floor = floors.find(f => f.id === cabinet.floorId);
                                const bld = buildings.find(b => b.id === cabinet.buildingId);
                                return (
                                  <div key={cabinet.id} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col">
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cabinet.name}</span>
                                      <span className="text-xs text-slate-400 uppercase tracking-tighter">
                                        {bld?.name.split(' ')[0]} {floor?.number ? `эт. ${floor.number}` : ''}
                                      </span>
                                    </div>
                                );
                              })}
                              {cabinets.filter(c => c.departmentId === dept.id).length === 0 && (
                                <p className="text-[9px] text-slate-400 italic py-1 px-1">Нет назначенных кабинетов</p>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Equipment View */
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Оборудование</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Модель</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Локация</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Отделение</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                          {equipment.map(item => {
                            const cab = cabinets.find(c => c.id === item.cabinetId);
                            const floor = floors.find(f => f.id === cab?.floorId);
                            const bld = buildings.find(b => b.id === cab?.buildingId);
                            const dept = departments.find(d => d.id === cab?.departmentId);
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                      <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold">
                                    {item.model}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{bld?.name}</span>
                                    <span className="text-xs text-slate-400">Этаж {floor?.number}, Каб. {cab?.name || '?'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {dept ? (
                                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 font-bold">
                                      <Shield className="w-3 h-3 mr-1" />
                                      {dept.name}
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-400 italic text-xs">Не назначено</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                      onClick={() => {
                                        setLocationDialog({
                                          isOpen: true,
                                          type: 'equipment',
                                          mode: 'edit',
                                          title: 'Редактировать оборудование',
                                          inputValue: item.name,
                                          model: item.model,
                                          cabinetId: item.cabinetId,
                                          id: item.id
                                        });
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                                      onClick={() => {
                                        setLocationDialog({
                                          isOpen: true,
                                          type: 'equipment',
                                          mode: 'delete',
                                          title: 'Удалить оборудование?',
                                          description: `Вы уверены, что хотите удалить "${item.name}" (${item.model})?`,
                                          id: item.id
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {equipment.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                Список оборудования пуст
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{request.name}</h3>
                        <span className={cn(
                          "text-sm px-2 py-0.5 rounded-full",
                          request.status === 'pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          request.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {request.status === 'pending' ? 'Ожидает' : 
                           request.status === 'approved' ? 'Одобрен' : 'Отклонен'}
                        </span>
                      </div>
                      <div className="text-base text-slate-500 dark:text-slate-400 mb-2">
                        {request.email} • {request.department}
                      </div>
                      <div className="text-base text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                        <span className="font-bold text-xs text-slate-400 block mb-1 uppercase tracking-wider">Причина запроса:</span>
                        {request.reason}
                      </div>
                      <div className="text-sm text-slate-400 mt-2">
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
                              } catch (error: any) {
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
                            } catch (error: any) {
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
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200">
                          {log.userName}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
                        {log.details || actionLabels[log.action] || log.action}
                      </p>
                      {log.entityName && (
                        <span className="text-sm text-slate-400 mt-1 inline-block">
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
                onValueChange={(value) => {
                  setUserFormData(prev => ({ 
                    ...prev, 
                    roleId: value,
                    // По умолчанию включаем приветствие для админов и техников при создании нового пользователя
                    showGreeting: !editingUser ? (value === 'admin' || value === 'technician') : prev.showGreeting
                  }));
                }}
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
              <Select
                value={departments.find(d => d.name === userFormData.department)?.id || ""}
                onValueChange={(value) => {
                  const dept = departments.find(d => d.id === value);
                  if (dept) {
                    setUserFormData(prev => ({ ...prev, department: dept.name, departmentId: dept.id }));
                  }
                }}
              >
                <SelectTrigger className="dark:bg-slate-800">
                  <SelectValue placeholder="Выберите отделение" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="user-show-greeting">Показывать приветствие</Label>
                  <p className="text-[10px] text-slate-500">Показывать экран приветствия при входе</p>
                </div>
                <Switch
                  id="user-show-greeting"
                  checked={userFormData.showGreeting}
                  onCheckedChange={(checked) => setUserFormData(prev => ({ ...prev, showGreeting: checked }))}
                />
              </div>

              {userFormData.showGreeting && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="user-greeting-text">Текст приветствия</Label>
                  <Input
                    id="user-greeting-text"
                    value={userFormData.greetingText}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, greetingText: e.target.value }))}
                    placeholder="Введите текст приветствия"
                    className="dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="space-y-0.5">
                <Label htmlFor="user-active">Доступ разрешен</Label>
                <p className="text-[10px] text-slate-500">Позволяет пользователю входить в систему</p>
              </div>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => {
        if (!open) {
          setUserToDelete(null);
          setMasterPassword('');
          setShowDeactivateOption(false);
        }
      }}>
        <DialogContent className="max-w-[320px] p-0 overflow-hidden border-none bg-white dark:bg-slate-900 shadow-2xl">
          <div className={cn(
            "p-6 flex flex-col items-center text-center text-white transition-colors duration-300",
            showDeactivateOption ? "bg-amber-500" : "bg-red-500"
          )}>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {showDeactivateOption ? 'Связанные данные' : 'Подтвердите удаление'}
            </h3>
            <p className="text-sm text-white/90 opacity-90 leading-relaxed">
              {showDeactivateOption ? (
                <>
                  Нельзя удалить: у пользователя <span className="font-bold underline">{userToDelete?.name}</span> есть заявки или документы.
                </>
              ) : (
                <>
                  Вы собираетесь безвозвратно удалить пользователя:
                  <span className="block text-white font-black text-base mt-1 underline decoration-white/30">{userToDelete?.name}</span>
                  Это действие нельзя отменить.
                </>
              )}
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {!showDeactivateOption ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="master-password" title="Мастер пароль" className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Мастер-пароль
                  </Label>
                  <div className="relative">
                    <Input
                      id="master-password"
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Введите мастер-пароль"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-center font-mono tracking-widest focus:ring-red-500 focus:border-red-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      if (!userToDelete) return;
                      if (!masterPassword) {
                        toast.error('Введите мастер-пароль');
                        return;
                      }
                      
                      setIsDeleting(true);
                      try {
                        await onDeleteUser(userToDelete.id, masterPassword);
                        toast.success('Пользователь успешно удален');
                        setUserToDelete(null);
                        setMasterPassword('');
                      } catch (error: any) {
                        console.log('Delete error full object:', error);
                        const responseData = error.response?.data;
                        const errorCode = responseData?.code || responseData?.errorCode;
                        const serverMessage = responseData?.message || error.message || '';
                        
                        if (errorCode === 'INVALID_MASTER_PASSWORD') {
                          toast.error('Введен неверный пароль доступа');
                        } else if (errorCode === 'FOREIGN_KEY_VIOLATION' || serverMessage.includes('за ним закреплены заявки')) {
                          setShowDeactivateOption(true);
                        } else {
                          toast.error(serverMessage || 'Ошибка при удалении пользователя');
                        }
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting || !masterPassword}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 shadow-lg shadow-red-500/20"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    УДАЛИТЬ НАВСЕГДА
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setUserToDelete(null);
                      setMasterPassword('');
                    }}
                    disabled={isDeleting}
                    className="w-full text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Отмена
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  Рекомендуется деактивировать учетную запись. Это закроет доступ к системе, но сохранит историю действий.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      if (!userToDelete) return;
                      setIsDeleting(true);
                      try {
                        await onUpdateUser(userToDelete.id, { isActive: false });
                        toast.success('Пользователь деактивирован');
                        setUserToDelete(null);
                        setShowDeactivateOption(false);
                      } catch (error: any) {
                        toast.error('Ошибка при деактивации');
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-10 shadow-lg shadow-amber-500/20"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 mr-2" />
                    )}
                    ДЕАКТИВИРОВАТЬ
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setUserToDelete(null);
                      setShowDeactivateOption(false);
                      setMasterPassword('');
                    }}
                    disabled={isDeleting}
                    className="w-full text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
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
                              onCheckedChange={() => togglePermission(perm.moduleId, 'canView')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canCreate}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'canCreate')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canEdit}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'canEdit')}
                              className="h-3.5 w-3.5 [&>svg]:h-2.5 [&>svg]:w-2.5"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Checkbox
                              checked={perm.canDelete}
                              onCheckedChange={() => togglePermission(perm.moduleId, 'canDelete')}
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
          <div className="flex gap-2 pt-4 border-t mt-auto flex-shrink-0">
            <Button
              onClick={handleSaveRole}
              className="flex-1 bg-blue-600 h-9 text-sm"
              disabled={isLoading || !roleFormData.name.trim() || !roleFormData.description.trim()}
            >
              {editingRole ? 'Сохранить изменения' : 'Создать роль'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleForm(false);
                setEditingRole(null);
              }}
              className="h-9 text-sm"
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block User Confirmation Dialog */}
      <Dialog open={!!userToBlock} onOpenChange={(open) => !open && setUserToBlock(null)}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-white dark:bg-slate-900 shadow-2xl">
          <div className="p-6 flex flex-col items-center text-center bg-amber-500 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <EyeOff className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Приостановка доступа</h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Пользователь <span className="font-bold underline">{userToBlock?.name}</span> будет переведен в статус <span className="font-bold">не активные</span>. 
              Все его текущие сессии будут приостановлены.
            </p>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <Button
              onClick={handleConfirmBlock}
              disabled={isBlocking}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 shadow-lg shadow-amber-500/20"
            >
              {isBlocking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              ПОДТВЕРДИТЬ БЛОКИРОВКУ
            </Button>
            <Button
              variant="ghost"
              onClick={() => setUserToBlock(null)}
              disabled={isBlocking}
              className="w-full text-slate-500 dark:text-slate-400 text-xs font-medium"
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Custom Dialog for Registry Actions */}
      <Dialog open={locationDialog.isOpen} onOpenChange={(open) => !open && closeLocationDialog()}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none bg-white dark:bg-slate-900 shadow-2xl">
          <div className={cn(
            "p-6 flex flex-col items-center text-center text-white",
            locationDialog.mode === 'delete' ? "bg-red-500" : "bg-blue-600"
          )}>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
              {locationDialog.mode === 'delete' ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold mb-2 text-white">{locationDialog.title}</DialogTitle>
            {locationDialog.description && (
              <p className="text-sm text-white/90 leading-relaxed">{locationDialog.description}</p>
            )}
          </div>
          
          <div className="p-6 space-y-4">
            {locationDialog.mode === 'delete' && locationDialog.title === 'Разблокировать реестр' && (
              <div className="space-y-2">
                <Label htmlFor="location-master-password" title="Мастер пароль" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Мастер-пароль
                </Label>
                <Input
                  id="location-master-password"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Введите мастер-пароль"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10 text-center font-mono tracking-widest focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLocationAction();
                    if (e.key === 'Escape') closeLocationDialog();
                  }}
                />
              </div>
            )}

            {locationDialog.mode !== 'delete' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {locationDialog.type === 'floor' ? 'Номер этажа' : (locationDialog.type === 'cabinet' ? 'Номер кабинета' : 'Название')}
                  </Label>
                  <Input
                    id="location-input"
                    value={locationDialog.inputValue}
                    onChange={(e) => setLocationDialog(prev => ({ ...prev, inputValue: e.target.value }))}
                    placeholder={locationDialog.type === 'floor' ? 'Например: 1' : (locationDialog.type === 'cabinet' ? 'Например: 4' : 'Введите название...')}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && locationDialog.type !== 'equipment' && locationDialog.type !== 'cabinet') handleLocationAction();
                      if (e.key === 'Escape') closeLocationDialog();
                    }}
                  />
                </div>

                {locationDialog.type === 'cabinet' && (
                  <div className="space-y-2">
                    <Label htmlFor="location-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Описание кабинета
                    </Label>
                    <Input
                      id="location-desc"
                      value={locationDialog.inputDescription}
                      onChange={(e) => setLocationDialog(prev => ({ ...prev, inputDescription: e.target.value }))}
                      placeholder="Например: Маммография"
                      className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLocationAction();
                        if (e.key === 'Escape') closeLocationDialog();
                      }}
                    />
                  </div>
                )}

                {locationDialog.type === 'department' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Выберите иконку
                      </Label>
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { name: 'Stethoscope', icon: Stethoscope },
                          { name: 'Search', icon: SearchIcon },
                          { name: 'FlaskConical', icon: FlaskConical },
                          { name: 'Building', icon: BuildingIcon },
                          { name: 'Activity', icon: Activity },
                          { name: 'ClipboardList', icon: ClipboardList },
                        ].map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setLocationDialog(prev => ({ ...prev, icon: item.name }))}
                            className={cn(
                              "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
                              locationDialog.icon === item.name 
                                ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20" 
                                : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Цвет отделения
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          '#3B82F6', // Blue
                          '#10B981', // Emerald
                          '#8B5CF6', // Violet
                          '#EF4444', // Red
                          '#F59E0B', // Amber
                          '#6B7280', // Gray
                          '#EC4899', // Pink
                          '#06B6D4', // Cyan
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setLocationDialog(prev => ({ ...prev, color }))}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all",
                              locationDialog.color === color 
                                ? "border-white ring-2 ring-blue-500 scale-110" 
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {locationDialog.type === 'equipment' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="equipment-model" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Модель
                      </Label>
                      <Input
                        id="equipment-model"
                        value={locationDialog.model}
                        onChange={(e) => setLocationDialog(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="Например: Hamilton C3"
                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipment-cabinet" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Кабинет
                      </Label>
                      <Select 
                        value={locationDialog.cabinetId} 
                        onValueChange={(val) => setLocationDialog(prev => ({ ...prev, cabinetId: val }))}
                      >
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10">
                          <SelectValue placeholder="Выберите кабинет" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map(bld => (
                            <div key={bld.id}>
                              <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                                {bld.name}
                              </div>
                              {cabinets.filter(c => c.buildingId === bld.id).map(cab => (
                                <SelectItem key={cab.id} value={cab.id}>
                                  Каб. {cab.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleLocationAction}
                disabled={locationDialog.mode !== 'delete' && !locationDialog.inputValue?.trim()}
                className={cn(
                  "w-full font-bold h-10 shadow-lg",
                  locationDialog.mode === 'delete' 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                )}
              >
                {locationDialog.mode === 'delete' ? 'УДАЛИТЬ' : (locationDialog.mode === 'add' ? 'ДОБАВИТЬ' : 'СОХРАНИТЬ')}
              </Button>
              <Button
                variant="ghost"
                onClick={closeLocationDialog}
                className="w-full text-slate-500 dark:text-slate-400 text-xs font-medium"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lock Password Dialog */}
      <Dialog open={lockDialog.isOpen} onOpenChange={(open) => !open && setLockDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Разблокировка позиций
            </DialogTitle>
            <DialogDescription className="pt-2 text-xs">
              Введите мастер-пароль для разрешения изменения размеров и порядка зданий и кабинетов.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="master-pass" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Мастер-пароль
            </Label>
            <Input
              id="master-pass"
              type="password"
              value={lockDialog.password}
              onChange={(e) => setLockDialog(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="mt-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmUnlock()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialog(prev => ({ ...prev, isOpen: false }))}>Отмена</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={confirmUnlock}>Разблокировать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Confirmation Dialog */}
      <Dialog open={confirmMove.isOpen} onOpenChange={(open) => !open && setConfirmMove(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-blue-500" />
              Подтвердите перемещение
            </DialogTitle>
            <DialogDescription className="pt-4">
              Вы уверены, что хотите переместить <strong>{confirmMove.itemName}</strong> {confirmMove.direction === 'up' ? 'выше' : 'ниже'} <strong>{confirmMove.targetName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setConfirmMove(prev => ({ ...prev, isOpen: false }))}>Отмена</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmedMove}>Подтвердить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
