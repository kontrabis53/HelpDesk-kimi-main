// Documents Page
import { useNavigate } from 'react-router-dom';
import { DocumentsScreen } from '@/screens/DocumentsScreen';
import { useDocumentStore } from '@/stores/documentStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function DocumentsPage() {
  const navigate = useNavigate();
  
  const documents = useDocumentStore((state) => state.filteredDocuments());
  const documentsByType = useDocumentStore((state) => state.documentsByType());
  const setFilter = useDocumentStore((state) => state.setFilter);
  const hasPermission = useRoleStore((state) => state.hasPermission);
  
  const handleDocumentClick = (doc: any) => {
    toast.info(doc.title, {
      description: `${doc.number} • ${doc.description.slice(0, 100)}...`,
    });
  };
  
  const handleCreateClick = () => {
    if (!hasPermission('documents', 'create')) {
      toast.error('Нет прав', { description: 'У вас нет прав для создания документов' });
      return;
    }
    navigate('/documents/create');
  };
  
  const handleSearch = (query: string) => {
    setFilter({ search: query });
  };
  
  return (
    <DocumentsScreen
      documents={documents}
      documentsByType={documentsByType}
      onDocumentClick={handleDocumentClick}
      onCreateClick={handleCreateClick}
      onSearch={handleSearch}
    />
  );
}
