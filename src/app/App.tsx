import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useRoleStore } from '@/stores/roleStore';
import './App.css';

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const initSocket = useChatStore(state => state.initSocket);
  const fetchUsers = useRoleStore(state => state.fetchUsers);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch users for role management
      fetchUsers();
      // Initialize real-time chat
      initSocket();
    }
  }, [isAuthenticated, initSocket, fetchUsers]);

  return <RouterProvider router={router} />;
}

export default App;
