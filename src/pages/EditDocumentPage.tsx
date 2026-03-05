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
  // We need to implement updateDocument in documentStore first, 
  // but for now let's assume we can just simulate it or use delete+create approach 
  // (though delete+create changes ID which is bad, so we should add update action)
  
  // Actually, let's use a temporary solution until we add updateDocument to store
  // We will modify the store in the next step.
  const updateDocument = useDocumentStore((state) => (state as any).updateDocument); 

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
    if (updateDocument) {
      updateDocument(id, data);
      addLog('document.updated', 'document', id, document.number, `Обновлен документ: ${data.title}`);
      toast.success('Документ обновлен');
      navigate(`/documents/${id}`);
    } else {
      // Fallback if updateDocument is not available yet (will be added in next step)
      console.error("updateDocument action not found in store");
      toast.error("Ошибка обновления");
    }
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
