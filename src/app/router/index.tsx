import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { TicketsPage } from '@/pages/TicketsPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { EditTicketPage } from '@/pages/EditTicketPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { CreateDocumentPage } from '@/pages/CreateDocumentPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { CreateInventoryPage } from '@/pages/CreateInventoryPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { GuideDetailPage } from '@/pages/GuideDetailPage';
import { CreateGuideScreen } from '@/screens/CreateGuideScreen';
import { ProfilePage, AdminPage, SettingsPage } from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/knowledge" replace />,
      },
      // Knowledge Base
      {
        path: 'knowledge',
        element: <KnowledgePage />,
      },
      {
        path: 'knowledge/create',
        element: (
          <ProtectedRoute moduleId="knowledge" action="create">
            <CreateGuideScreen />
          </ProtectedRoute>
        ),
      },
      {
        path: 'knowledge/:id',
        element: <GuideDetailPage />,
      },
      // Tickets
      {
        path: 'tickets',
        element: <TicketsPage />,
      },
      {
        path: 'tickets/create',
        element: <CreateTicketPage />,
      },
      {
        path: 'tickets/:id',
        element: <TicketDetailPage />,
      },
      {
        path: 'tickets/:id/edit',
        element: (
          <ProtectedRoute moduleId="tickets" action="edit">
            <EditTicketPage />
          </ProtectedRoute>
        ),
      },
      // Documents
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'documents/create',
        element: (
          <ProtectedRoute moduleId="documents" action="create">
            <CreateDocumentPage />
          </ProtectedRoute>
        ),
      },
      // Inventory
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'inventory/create',
        element: (
          <ProtectedRoute moduleId="inventory" action="create">
            <CreateInventoryPage />
          </ProtectedRoute>
        ),
      },
      // Profile
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      // Admin
      {
        path: 'admin',
        element: (
          <ProtectedRoute moduleId="admin" action="view">
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      // Settings
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      // Admin
      {
        path: 'admin',
        element: (
          <ProtectedRoute moduleId="admin" action="view">
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
