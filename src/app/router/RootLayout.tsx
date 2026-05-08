import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useRef, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useRoleStore } from '@/stores/roleStore';
import { useAuthStore } from '@/stores/authStore';
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
  
  // Debug version
  useEffect(() => {
    console.log('%c[RootLayout] VERSION 1.2.9-FIX-4 LOADED', 'color: white; background: #2563eb; padding: 4px; border-radius: 4px;');
  }, []);

  const roles = useRoleStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  
  // Track last notified status to prevent duplicates
  const lastStatusMap = useRef<Map<string, boolean>>(new Map());

  // Status update listener for notifications
  useEffect(() => {
    const handler = (e: any) => {
      const { userId, isOnline } = e.detail;
      const currentUser = useAuthStore.getState().user;
      
      // Prevent duplicate notifications for the same status
      if (lastStatusMap.current.get(userId) === isOnline) {
        return;
      }
      
      // Update last seen status
      lastStatusMap.current.set(userId, isOnline);
      
      console.log('User status update received:', { userId, isOnline, currentUserEnabled: currentUser?.notificationsEnabled });
      
      // Only show notification if:
      // 1. Current user has notifications enabled
      // 2. It's not the current user's own status change
      if (currentUser?.notificationsEnabled && currentUser.id !== userId) {
        // Use functional state update to ensure we have the latest users list
        const latestUsers = useRoleStore.getState().users;
        const changedUser = latestUsers.find(u => u.id === userId);
        
        if (changedUser) {
          console.log('Showing notification for:', changedUser?.name, 'status:', isOnline);
          
          if (isOnline) {
            toast.success(`${changedUser.name} в сети`, {
              description: 'Пользователь зашел в систему',
              duration: 3000,
            });
          } else {
            toast.info(`${changedUser.name} вышел из сети`, {
              description: 'Пользователь покинул систему',
              duration: 3000,
            });
          }
        }
      }
    };
    
    window.addEventListener('user_status_updated', handler);
    return () => window.removeEventListener('user_status_updated', handler);
  }, []); // Remove users dependency, we'll get it from store inside handler

  const currentUserRole = useMemo(() => {
    if (!user || !roles.length) return undefined;
    return roles.find(r => r.id === (user.roleId || user.role));
  }, [user, roles]);

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
  const isGuidesPage = location.pathname.startsWith('/guides');
  const isDirectoryPage = location.pathname.startsWith('/directory');
  const isDocumentsListPage = location.pathname === '/documents';
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  
  const isFullScreenPage = isChatPage || isParserPage || isDirectoryPage || isDocumentsListPage || isGuidesPage;
  
  return (
    <div className={cn(
      "w-full min-h-screen bg-white dark:bg-slate-950 relative flex",
      isFullScreenPage && "overflow-hidden"
    )}>
      {/* Sidebar for desktop */}
      <Sidebar 
        availableModules={availableModules}
        canAccessAdmin={canAccessAdmin}
      />

      {/* Main content */}
      <div className={cn(
        "flex-1 w-full flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "md:pl-20" : "md:pl-64",
        isFullScreenPage ? "h-screen overflow-hidden" : "min-h-screen relative"
      )}>
        <div className={cn(
          "w-full mx-auto",
          isFullScreenPage 
            ? "flex-1 overflow-hidden h-full" 
            : "w-full flex-1"
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
      
      <Toaster 
        position="bottom-right" 
        expand={true} 
        richColors 
        visibleToasts={5}
        toastOptions={{
          style: {
            zIndex: 9999,
            background: 'white',
            color: 'black',
            border: '1px solid #e2e8f0'
          },
          className: "dark:bg-slate-800 dark:text-white dark:border-slate-700 shadow-2xl",
        }}
      />
    </div>
  );
}
