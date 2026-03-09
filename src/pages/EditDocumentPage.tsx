import { useNavigate, useParams } from 'react-router-dom';
import { CreateDocumentScreen } from '@/screens/CreateDocumentScreen';
import { useDocumentStore } from '@/stores/documentStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const documents = useDocumentStore((state) => state.documents);
  const addLog = useRoleStore((state) => state.addLog);
  const updateDocument = useDocumentStore((state) => state.updateDocument); 

  const document = documents.find((d) => d.id === id);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Документ не найден</h2>
        <p className="text-slate-500 mb-4">Возможно, он был удален или вы перешли по неверной ссылке</p>
        <button 
          onClick={() => navigate('/documents')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }
  
  const handleBack = () => {
    navigate(`/documents/${id}`);
  };
  
  const handleSubmit = (data: any) => {
    updateDocument(id!, data);
    addLog('document.updated', 'document', id!, document.number, `Обновлен документ: ${data.title}`);
    toast.success('Документ обновлен');
    navigate(`/documents/${id}`);
  };
  
  return (
    <CreateDocumentScreen
      onBack={handleBack}
      onSubmit={handleSubmit}
      initialData={document}
      isEditing={true}
    />
  );
}
