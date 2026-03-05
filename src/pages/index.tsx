import { ProfileScreen } from '@/screens/ProfileScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useTicketStore } from '@/stores/ticketStore';
import { useThemeStore } from '@/stores/themeStore';
import { useRoleStore } from '@/stores/roleStore';

export function ProfilePage() {
  const navigate = useNavigate();
  const stats = useTicketStore(useShallow((state) => state.stats()));
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const currentUserRole = useRoleStore((state) => state.currentUserRole());
  
  const handleOpenSettings = () => {
    navigate('/settings');
  };
  
  // Transform stats to match ProfileScreenProps
  const profileStats = {
    total: stats.total,
    new: stats.open, // Map open to new
    in_progress: stats.inProgress,
    waiting: 0, // Mock waiting as 0 or calculate if needed
    resolved: stats.resolved
  };
  
  return (
    <ProfileScreen
      stats={profileStats}
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenSettings={handleOpenSettings}
      userRole={currentUserRole}
    />
  );
}

export function AdminPage() {
  const roles = useRoleStore((state) => state.roles);
  const users = useRoleStore((state) => state.users);
  const logs = useRoleStore((state) => state.logs);
  const createRole = useRoleStore((state) => state.createRole);
  const updateRole = useRoleStore((state) => state.updateRole);
  const deleteRole = useRoleStore((state) => state.deleteRole);
  const createUser = useRoleStore((state) => state.addUser);
  const updateUser = useRoleStore((state) => state.updateUser);
  const deleteUser = useRoleStore((state) => state.deleteUser);
  
  return (
    <AdminScreen
      roles={roles}
      users={users}
      logs={logs}
      onCreateRole={createRole}
      onUpdateRole={updateRole}
      onDeleteRole={deleteRole}
      onCreateUser={(user) => createUser(user as any)}
      onUpdateUser={updateUser}
      onDeleteUser={deleteUser}
    />
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <SettingsScreen
      onBack={handleBack}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
