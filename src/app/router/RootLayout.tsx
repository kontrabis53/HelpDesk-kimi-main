import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from '@/components/ui/sonner';
import { useRoleStore } from '@/stores/roleStore';

const ROUTES_WITHOUT_NAV = [
  '/settings',
  '/tickets/create',
  '/documents/create',
  '/inventory/create',
];

const ROUTES_WITHOUT_NAV_PATTERNS = [
  /^\/tickets\/[^/]+$/,           // /tickets/:id
  /^\/tickets\/[^/]+\/edit$/,     // /tickets/:id/edit
  /^\/knowledge\/[^/]+$/,         // /knowledge/:id
];

export function RootLayout() {
  const location = useLocation();
  const availableModules = useRoleStore((state) => state.availableModules());
  const hasPermission = useRoleStore((state) => state.hasPermission);
  
  // Determine if we should show bottom nav
  const shouldShowBottomNav = !ROUTES_WITHOUT_NAV.includes(location.pathname) &&
    !ROUTES_WITHOUT_NAV_PATTERNS.some(pattern => pattern.test(location.pathname));
  
  const canAccessAdmin = hasPermission('admin', 'view');
  
  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto">
        <Outlet />
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
