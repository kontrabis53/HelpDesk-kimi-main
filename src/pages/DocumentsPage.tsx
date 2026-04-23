// Documents Page
import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { DocumentsScreen } from '@/screens/DocumentsScreen';
import { useDocumentStore } from '@/stores/documentStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function DocumentsPage() {
  const navigate = useNavigate();
  
  const allDocuments = useDocumentStore((state) => state.documents);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const filter = useDocumentStore((state) => state.filter);
  const setFilter = useDocumentStore((state) => state.setFilter);
  const hasPermission = useRoleStore((state) => state.hasPermission);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const documents = useMemo(() => {
    return allDocuments.filter((doc) => {
      if (filter.type && doc.type !== filter.type) return false;
      if (filter.status && doc.status !== filter.status) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          doc.number.toLowerCase().includes(searchLower) ||
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.equipmentName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allDocuments, filter]);

  const documentsByType = useMemo(() => {
    return {
      all: documents,
      act: documents.filter(d => d.type === 'act'),
      repair: documents.filter(d => d.type === 'repair'),
      maintenance: documents.filter(d => d.type === 'maintenance'),
      inventory: documents.filter(d => d.type === 'inventory'),
      other: documents.filter(d => d.type === 'other'),
    };
  }, [documents]);
  
  const handleDocumentClick = (doc: any) => {
    navigate(`/documents/${doc.id}`);
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
