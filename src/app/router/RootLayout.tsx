import { Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useRoleStore } from '@/stores/roleStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const ROUTES_WITHOUT_NAV = [
  '/settings',
  '/tickets/create',
  '/documents/create',
  '/inventory/create',
  '/knowledge/create',
];

const ROUTES_WITHOUT_NAV_PATTERNS = [
  /^\/tickets\/[^/]+$/,           // /tickets/:id
  /^\/tickets\/[^/]+\/edit$/,     // /tickets/:id/edit
  /^\/knowledge\/[^/]+$/,         // /knowledge/:id
];

export function RootLayout() {
  const location = useLocation();
  const currentUserRole = useRoleStore((state) => state.currentUserRole());
  const hasPermission = useRoleStore((state) => state.hasPermission);

  const availableModules = useMemo(() => {
    if (!currentUserRole) return [];
    
    return currentUserRole.permissions
      .filter(p => p.canView)
      .map(p => p.moduleId);
  }, [currentUserRole]);
  
  // Determine if we should show bottom nav
  const shouldShowBottomNav = !ROUTES_WITHOUT_NAV.includes(location.pathname) &&
    !ROUTES_WITHOUT_NAV_PATTERNS.some(pattern => pattern.test(location.pathname));
  
  const canAccessAdmin = hasPermission('admin', 'view');
  
  const isChatPage = location.pathname.startsWith('/chat');
  const isParserPage = location.pathname.startsWith('/parser');
  const isDirectoryPage = location.pathname.startsWith('/directory');
  const isDocumentsPage = location.pathname.startsWith('/documents');
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  
  const isFullScreenPage = isChatPage || isParserPage || isDirectoryPage || isDocumentsPage;
  
  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 relative flex overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar 
        availableModules={availableModules}
        canAccessAdmin={canAccessAdmin}
      />

      {/* Main content */}
      <div className={cn(
        "flex-1 w-full flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
        isFullScreenPage ? "h-screen" : "min-h-screen"
      )}>
        <div className={cn(
          "w-full mx-auto",
          isFullScreenPage 
            ? "flex-1 overflow-hidden h-full" 
            : "w-full min-h-screen"
        )}>
          <Outlet />
        </div>
      </div>
      
      {shouldShowBottomNav && (
        <BottomNav 
          availableModules={availableModules}
          canAccessAdmin={canAccessAdmin}
        />
      )}
      
      <Toaster position="top-center" richColors />
    </div>
  );
}
