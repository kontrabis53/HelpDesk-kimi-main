import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoleStore } from '@/stores/roleStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { ModuleId } from '@/types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  moduleId?: ModuleId;
  action?: 'view' | 'create' | 'edit' | 'delete';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  moduleId, 
  action,
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (moduleId && action && !hasPermission(moduleId, action)) {
    toast.error('Нет доступа', {
      description: 'У вас нет прав для доступа к этому модулю',
    });
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}
