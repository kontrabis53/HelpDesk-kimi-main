import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';
import type { ModuleId } from '@/types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  moduleId: ModuleId;
  action: 'view' | 'create' | 'edit' | 'delete';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  moduleId, 
  action,
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const hasPermission = useRoleStore((state) => state.hasPermission);
  
  if (!hasPermission(moduleId, action)) {
    toast.error('Нет доступа', {
      description: 'У вас нет прав для доступа к этому модулю',
    });
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}
