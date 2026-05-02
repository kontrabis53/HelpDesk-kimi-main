import { Home, FileText, Package, BookOpen, User, Shield, Users, MessageSquare, Network, ChevronLeft, ChevronRight, Book, Stethoscope, Bell, ClipboardList } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useRoleStore } from '@/stores/roleStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationPanel } from './NotificationPanel';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { UserAvatar } from './UserAvatar';

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
    { id: 'registry' as const, label: 'Регистратура', icon: ClipboardList, moduleId: 'registry', path: '#', disabled: true },
    { id: 'chat' as const, label: 'Чат', icon: MessageSquare, moduleId: 'chat', path: '/chat' },
    { id: 'parser' as const, label: 'Парсер', icon: Network, moduleId: 'parser', path: '/parser' },
    { id: 'admin' as const, label: 'Управление', icon: Shield, moduleId: 'admin', path: '/admin' },
    { id: 'profile' as const, label: 'Профиль', icon: User, moduleId: 'profile', path: '/profile' },
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tab => {
    // Profile and disabled (announcement) tabs are always visible
    if (tab.id === 'profile' || (tab as any).disabled) return true;
    
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
            const isDisabled = (tab as any).disabled;

            if (isDisabled) {
              return (
                <div
                  key={tab.id}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative border-2 border-transparent cursor-not-allowed opacity-40 grayscale',
                    isSidebarCollapsed ? 'justify-center' : 'gap-3'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 text-slate-400" />
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                      <span className="truncate text-slate-500">{tab.label}</span>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter leading-none mt-0.5">Скоро</span>
                    </div>
                  )}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[100]">
                      {tab.label} (Скоро)
                    </div>
                  )}
                </div>
              );
            }

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

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700 relative">
        <button 
          onClick={toggleSidebar}
          className="absolute right-2 bottom-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors z-20"
          title={isSidebarCollapsed ? "Развернуть" : "Свернуть"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn(
          "flex items-center transition-all duration-300",
          isSidebarCollapsed ? "justify-center" : "gap-3 px-1"
        )}>
          <UserAvatar 
            avatarUrl={user?.avatar} 
            name={user?.name || ''} 
            userRole={userRole || undefined} 
            sizeClass="w-10 h-10" 
            textClass="text-sm"
          />
          {user && !isSidebarCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {user.name}
                </span>
              </div>
              <div className="flex flex-col -space-y-0.5">
                {user.department && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate italic">
                    {user.department}
                  </span>
                )}
                {user.position && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {user.position}
                  </span>
                )}
              </div>
              {userRole && (
                <div className="mt-1">
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

