import { useNavigate } from 'react-router-dom';
import { CreateGuideScreen } from '@/screens/CreateGuideScreen';

export function CreateGuidePage() {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/knowledge');
  };
  
  return (
    <CreateGuideScreen />
  );
}
