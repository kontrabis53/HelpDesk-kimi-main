import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Stethoscope } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Ошибка', { description: 'Введите логин и пароль' });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast.success('Успешный вход');
        navigate('/');
      } else {
        toast.error('Ошибка входа', { description: 'Неверный логин или пароль' });
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">MEDIN</h1>
          <p className="text-slate-500 dark:text-slate-400">Вход в систему</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              className="h-11"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Пароль</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="h-11"
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
        
        <div className="mt-6 text-center pt-6 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Нет учетной записи?
          </p>
          <Link to="/request-account" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            Запросить доступ
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400">
        © 2025 Medin HelpDesk. All rights reserved.
      </p>
    </div>
  );
}
