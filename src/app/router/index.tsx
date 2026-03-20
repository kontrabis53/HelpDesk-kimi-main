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
import { DocumentDetailPage } from '@/pages/DocumentDetailPage';
import { EditDocumentPage } from '@/pages/EditDocumentPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { CreateInventoryPage } from '@/pages/CreateInventoryPage';
import { DirectoryPage } from '@/pages/DirectoryPage';
import { ChatPage } from '@/pages/ChatPage';
import { ParserPage } from '@/pages/ParserPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { GuidesPage } from '@/pages/GuidesPage';
import { GuideDetailPage } from '@/pages/GuideDetailPage';
import { CreateGuidePage } from '@/pages/CreateGuidePage';
import { EditGuidePage } from '@/pages/EditGuidePage';
import { ProfilePage, AdminPage, SettingsPage } from '@/pages';
import { LoginPage } from '@/pages/LoginPage';
import { RequestAccountPage } from '@/pages/RequestAccountPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/request-account',
    element: <RequestAccountPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/knowledge" replace />,
      },
      // Guides (Instructions)
      {
        path: 'guides',
        element: (
          <ProtectedRoute moduleId="guides" action="view">
            <GuidesPage />
          </ProtectedRoute>
        ),
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
            <CreateGuidePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'knowledge/:id',
        element: <GuideDetailPage />,
      },
      {
        path: 'knowledge/:id/edit',
        element: (
          <ProtectedRoute moduleId="knowledge" action="edit">
            <EditGuidePage />
          </ProtectedRoute>
        ),
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
      {
        path: 'documents/:id',
        element: <DocumentDetailPage />,
      },
      {
        path: 'documents/:id/edit',
        element: (
          <ProtectedRoute moduleId="documents" action="edit">
            <EditDocumentPage />
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
      // Directory
      {
        path: 'directory',
        element: <DirectoryPage />,
      },
      // Chat
      {
        path: 'chat',
        element: <ChatPage />,
      },
      // Parser
      {
        path: 'parser',
        element: <ParserPage />,
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
    ],
  },
]);
