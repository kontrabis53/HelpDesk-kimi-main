import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useRoleStore } from '@/stores/roleStore';
import { WelcomeSplash } from '@/components/ui/WelcomeSplash';
import './App.css';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const initAutoLogout = useAuthStore(state => state.initAutoLogout);
  const initSocket = useChatStore(state => state.initSocket);
  const fetchRoles = useRoleStore(state => state.fetchRoles);
  const fetchUsers = useRoleStore(state => state.fetchUsers);
  const initStatusListener = useRoleStore(state => state.initStatusListener);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const isNewLogin = useAuthStore(state => state.isNewLogin);
  const setNewLogin = useAuthStore(state => state.setNewLogin);

  const [showWelcome, setShowWelcome] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    setNewLogin(false);
  }, [setNewLogin]);

  useEffect(() => {
    const init = async () => {
      // Check if user is already logged in
      await checkAuth();
      
      // If authenticated, also fetch roles before finishing initialization
      // This prevents ProtectedRoute from redirecting while roles are loading
      if (useAuthStore.getState().isAuthenticated) {
        await fetchRoles();
      }
      
      setIsInitializing(false);
    };
    
    init();
    
    // Initialize auto-logout logic
    const cleanup = initAutoLogout();
    return cleanup;
  }, [checkAuth, initAutoLogout]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Show welcome splash only on fresh login and if enabled for user
      if (isNewLogin && user.showGreeting) {
        setShowWelcome(true);
      }
      
      // Fetch roles and users for role management
      fetchRoles();
      fetchUsers();
      // Initialize real-time chat
      initSocket();
      // Listen for status updates
      return initStatusListener();
    }
  }, [isAuthenticated, user, initSocket, fetchRoles, fetchUsers, initStatusListener]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      {showWelcome && user && (
        <WelcomeSplash 
          userName={user.name} 
          greetingText={user.greetingText}
          onComplete={handleWelcomeComplete} 
        />
      )}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
