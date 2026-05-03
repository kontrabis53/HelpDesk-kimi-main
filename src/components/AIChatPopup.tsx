import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatPopup({ isOpen, onClose }: AIChatPopupProps) {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history from API
  useEffect(() => {
    const loadHistory = async () => {
      if (isOpen && messages.length === 0) {
        setIsLoading(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/history`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const historyData = await response.json();
            if (historyData && historyData.length > 0) {
              const formattedHistory = historyData.flatMap((h: any) => [
                { role: 'user', content: h.message },
                { role: 'assistant', content: h.reply }
              ]);
              
              setMessages([
                ...formattedHistory,
                { role: 'assistant', content: '--- Новая сессия ---' },
                { 
                  role: 'assistant', 
                  content: `С возвращением, ${user?.name?.split(' ')[0] || 'пользователь'}! Я восстановил историю нашего общения. О чем хочешь узнать сейчас?` 
                }
              ]);
            } else {
              // Only show greeting if history is empty
              setMessages([
                { 
                  role: 'assistant', 
                  content: `Привет, ${user?.name?.split(' ')[0] || 'пользователь'}! Я твой персональный ИИ-помощник по системе MEDIN (Логика v2.0). Я знаю всё о заявках, оборудовании и регламентах нашей клиники. Чем могу помочь?` 
                }
              ]);
            }
          }
        } catch (error) {
          console.error('Failed to load AI history:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadHistory();
  }, [isOpen, user]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Здесь будет вызов реального API локальной модели
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error('Ошибка ИИ-сервиса');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Извини, произошла ошибка при обработке запроса.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={cn(
        "fixed z-[100] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300",
        isMaximized 
          ? "inset-4 md:inset-10 rounded-2xl" 
          : "bottom-4 left-4 md:left-20 w-[calc(100%-2rem)] md:w-[400px] h-[500px] rounded-2xl"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-none">ИИ-Помощник MEDIN</h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium text-blue-100">Локальная модель</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
              msg.role === 'user' 
                ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                : "bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Спросите что-нибудь..."
            className="pr-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-slate-400">
          ИИ может ошибаться. Проверяйте важную информацию.
        </p>
      </div>
    </motion.div>
  );
}
