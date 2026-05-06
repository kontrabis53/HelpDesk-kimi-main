import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

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
                  content: `С возвращением, ${user?.name?.split(' ')[1] || user?.name?.split(' ')[0] || 'пользователь'}! Я восстановил историю нашего общения. О чем хочешь узнать сейчас?` 
                }
              ]);
            } else {
              // Only show greeting if history is empty
              setMessages([
                { 
                  role: 'assistant', 
                  content: `Привет, ${user?.name?.split(' ')[1] || user?.name?.split(' ')[0] || 'пользователь'}! Я твой персональный ИИ-помощник Medini (Логика v2.0). Я знаю всё о заявках, оборудовании и регламентах нашей клиники. Чем могу помочь?` 
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
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-medium tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-sans">
              Medini
            </h3>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium text-slate-400 tracking-wide">Advanced AI</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
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
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' 
                ? "bg-slate-100 dark:bg-slate-800" 
                : "bg-gradient-to-tr from-blue-100 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/20"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-slate-500" /> : <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm leading-relaxed tracking-tight",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none shadow-md" 
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none font-sans"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
        <div className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/10 transition-all">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Спросите Medini..."
            className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2 rounded-lg transition-all",
              input.trim() && !isLoading 
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                : "text-slate-300 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-center text-slate-400 mt-2 font-medium tracking-wide">
          Medini может ошибаться. Проверяйте важную информацию.
        </p>
      </div>
    </motion.div>
  );
}
