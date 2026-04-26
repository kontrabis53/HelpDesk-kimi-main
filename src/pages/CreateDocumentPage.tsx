import { useNavigate } from 'react-router-dom';
import { CreateDocumentScreen } from '@/screens/CreateDocumentScreen';
import { useDocumentStore } from '@/stores/documentStore';
import { useRoleStore } from '@/stores/roleStore';
import { toast } from 'sonner';

export function CreateDocumentPage() {
  const navigate = useNavigate();
  const createDocument = useDocumentStore((state) => state.createDocument);
  const addLog = useRoleStore((state) => state.addLog);
  
  const handleBack = () => {
    navigate('/documents');
  };
  
  const handleSubmit = async (data: any) => {
    const newDoc = await createDocument(data);
    addLog('document.created', 'document', newDoc.id, newDoc.number, `Создан документ: ${newDoc.title}`);
    toast.success('Документ создан', {
      description: `Документ ${newDoc.number} успешно создан`,
    });
    navigate('/documents');
  };
  
  return (
    <CreateDocumentScreen
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
}
