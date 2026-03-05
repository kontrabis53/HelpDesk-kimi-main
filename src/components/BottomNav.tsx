import { Home, FileText, Package, BookOpen, User, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  availableModules?: string[];
  canAccessAdmin?: boolean;
}

export function BottomNav({ availableModules = [], canAccessAdmin = false }: BottomNavProps) {
  const location = useLocation();
  
  const allTabs = [
    { id: 'knowledge' as const, label: 'База', icon: BookOpen, moduleId: 'knowledge', path: '/knowledge' },
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
    
    // Check module permission
    if (availableModules.includes(tab.moduleId)) return true;
    
    // Fallback for Admin
    if (tab.id === 'admin' && canAccessAdmin) return true;
    
    return false;
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 safe-area-bottom z-50 md:hidden">
      <div className="flex items-center justify-around h-16 max-w-4xl mx-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.5px]')} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
