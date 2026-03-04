import { Home, FileText, Package, BookOpen, User, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarProps {
  availableModules?: string[];
  canAccessAdmin?: boolean;
}

export function Sidebar({ availableModules = [], canAccessAdmin = false }: SidebarProps) {
  const location = useLocation();
  
  const allTabs = [
    { id: 'knowledge' as const, label: 'База знаний', icon: BookOpen, moduleId: 'knowledge', path: '/knowledge' },
    { id: 'tickets' as const, label: 'Заявки', icon: Home, moduleId: 'tickets', path: '/tickets' },
    { id: 'documents' as const, label: 'Документы', icon: FileText, moduleId: 'documents', path: '/documents' },
    { id: 'inventory' as const, label: 'Склад', icon: Package, moduleId: 'inventory', path: '/inventory' },
    { id: 'admin' as const, label: 'Управление', icon: Shield, moduleId: 'admin', path: '/admin' },
    { id: 'profile' as const, label: 'Профиль', icon: User, moduleId: 'profile', path: '/profile' },
  ];

  // Filter tabs based on permissions
  const visibleTabs = allTabs.filter(tab => {
    // Profile is always visible
    if (tab.id === 'profile') return true;
    // Admin only for admins
    if (tab.id === 'admin') return canAccessAdmin;
    // Other modules based on permissions
    return availableModules.includes(tab.moduleId);
  });
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/tickets')) return 'tickets';
    if (path.startsWith('/documents')) return 'documents';
    if (path.startsWith('/inventory')) return 'inventory';
    if (path.startsWith('/knowledge')) return 'knowledge';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/profile')) return 'profile';
    return 'knowledge';
  };
  
  const activeTab = getActiveTab();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50">
      <div className="p-6">
        <NavLink to="/knowledge" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            H
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">HelpDesk</span>
        </NavLink>
        
        <nav className="space-y-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
                  isActive 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-blue-600 dark:text-blue-400')} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              Иван Петров
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              ivan@medin.ru
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
