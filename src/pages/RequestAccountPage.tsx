import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';

export function RequestAccountPage() {
  const navigate = useNavigate();
  const addRequest = useAuthStore((state) => state.addRequest);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errors, setErrors] = useState<{
    name?: boolean;
    email?: boolean;
    department?: boolean;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: boolean; email?: boolean; department?: boolean } = {};
    const missingFields: string[] = [];

    if (!name) {
      newErrors.name = true;
      missingFields.push('ФИО');
    }
    if (!email) {
      newErrors.email = true;
      missingFields.push('Email');
    }
    if (!department) {
      newErrors.department = true;
      missingFields.push('Отдел / Кабинет');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const msg = `Заполните обязательные поля: ${missingFields.join(', ')}`;
      setErrorMsg(msg);
      toast.error('Ошибка', { description: msg });
      return;
    }

    setErrors({});
    setErrorMsg('');
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    try {
      addRequest({
        name,
        email,
        department,
        reason,
      });
      
      toast.success('Запрос отправлен', { 
        description: 'Администратор рассмотрит вашу заявку в ближайшее время' 
      });
      navigate('/login', { state: { registrationSuccess: true } });
    } catch (error) {
      toast.error('Ошибка отправки запроса');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/login" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Запрос доступа</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
            Заполните форму, чтобы получить учетную запись в системе HelpDesk
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>
              ФИО <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: false }));
                  setErrorMsg('');
                }
              }}
              placeholder="Иванов Иван Иванович"
              className={`h-11 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: false }));
                  setErrorMsg('');
                }
              }}
              placeholder="ivan@medin.ru"
              className={`h-11 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department" className={errors.department ? "text-red-500" : ""}>
              Отдел / Кабинет <span className="text-red-500">*</span>
            </Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                if (errors.department) {
                  setErrors(prev => ({ ...prev, department: false }));
                  setErrorMsg('');
                }
              }}
              placeholder="Терапия, каб. 101"
              className={`h-11 ${errors.department ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Причина запроса</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Новый сотрудник, доступ к базе знаний... (необязательно)"
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>
          
          {errorMsg && (
            <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
              {errorMsg}
            </p>
          )}
          
          <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base mt-2" disabled={isLoading}>
            {isLoading ? 'Отправка...' : 'Отправить запрос'}
          </Button>
        </form>
      </div>
      
      <p className="mt-8 text-xs text-slate-400">
        © 2025 Medin HelpDesk. All rights reserved.
      </p>
    </div>
  );
}
