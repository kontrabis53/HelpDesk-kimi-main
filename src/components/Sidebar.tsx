import { Home, FileText, Package, BookOpen, User, Shield, Users, MessageSquare, Network, ChevronLeft, ChevronRight, Book, Stethoscope, Bell } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useRoleStore } from '@/stores/roleStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationPanel } from './NotificationPanel';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface SidebarProps {
  availableModules?: string[];
  canAccessAdmin?: boolean;
}

export function Sidebar({ availableModules = [], canAccessAdmin = false }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { getRoleById } = useRoleStore();
  const { unreadCount, isPanelOpen, setPanelOpen } = useNotificationStore();
  
  const userRole = user ? getRoleById(user.roleId) : null;
  
  const allTabs = [
    { id: 'knowledge' as const, label: 'База знаний', icon: BookOpen, moduleId: 'knowledge', path: '/knowledge' },
    { id: 'guides' as const, label: 'Инструкции', icon: Book, moduleId: 'guides', path: '/guides' },
    { id: 'tickets' as const, label: 'Заявки', icon: Home, moduleId: 'tickets', path: '/tickets' },
    { id: 'documents' as const, label: 'Документы', icon: FileText, moduleId: 'documents', path: '/documents' },
    { id: 'inventory' as const, label: 'Склад', icon: Package, moduleId: 'inventory', path: '/inventory' },
    { id: 'directory' as const, label: 'Справочник', icon: Users, moduleId: 'directory', path: '/directory' },
    { id: 'chat' as const, label: 'Чат', icon: MessageSquare, moduleId: 'chat', path: '/chat' },
    { id: 'parser' as const, label: 'Парсер', icon: Network, moduleId: 'parser', path: '/parser' },
    { id: 'admin' as const, label: 'Управление', icon: Shield, moduleId: 'admin', path: '/admin' },
    { id: 'profile' as const, label: 'Профиль', icon: User, moduleId: 'profile', path: '/profile' },
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tab => {
    // Profile is always visible
    if (tab.id === 'profile') return true;
    
    // Check module permission
    if (availableModules.includes(tab.moduleId)) return true;
    
    // Fallback for Admin (if not in availableModules but user is admin)
    if (tab.id === 'admin' && canAccessAdmin) return true;
    
    return false;
  });
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/tickets')) return 'tickets';
    if (path.startsWith('/documents')) return 'documents';
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/directory')) return 'directory';
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/parser')) return 'parser';
    if (path.startsWith('/guides')) return 'guides';
    if (path.startsWith('/knowledge')) return 'knowledge';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/profile')) return 'profile';
    return 'knowledge';
  };
  
  const activeTab = getActiveTab();

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen fixed left-0 top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-all duration-300",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-8 px-2">
          <NavLink to="/knowledge" className="flex items-center gap-3 hover:opacity-80 transition-opacity overflow-hidden group/logo">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none tracking-tight text-slate-800 dark:text-slate-100">MEDIN</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase mt-1">HelpDesk</span>
              </div>
            )}
          </NavLink>
          <Popover open={isPanelOpen} onOpenChange={setPanelOpen}>
            <PopoverTrigger asChild>
              <button 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors relative group/bell"
                title="Уведомления"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="start" 
              sideOffset={12} 
              collisionPadding={10}
              className="p-0 border-none shadow-2xl z-[100]"
            >
              <NotificationPanel />
            </PopoverContent>
          </Popover>
        </div>
        
        <nav className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative border-2',
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02] z-10' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent',
                  isSidebarCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400')} />
                {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
                {isActive && (
                  <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                    {tab.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700 overflow-hidden relative">
        <button 
          onClick={toggleSidebar}
          className="absolute right-2 bottom-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors z-10"
          title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <div className={cn(
          "flex items-center py-2",
          isSidebarCollapsed ? "justify-center" : "gap-1.5 px-0.5"
        )}>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-normal mb-1">
                {user?.name || 'Пользователь'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mb-0.5">
                {user?.position || 'Сотрудник'}
              </p>
              {user?.department && (
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mb-1.5 italic">
                  Отдел: {user.department}
                </p>
              )}
              {userRole && (
                <div className="-mt-1">
                  <span 
                    className="inline-block text-[8px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider"
                    style={{ backgroundColor: userRole.color }}
                  >
                    {userRole.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

