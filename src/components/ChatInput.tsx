import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput = React.memo(({ onSendMessage, disabled }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '40px';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 150) + 'px';
    }
  }, [newMessage]);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  const handleSend = () => {
    if (!newMessage.trim() || disabled) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
    setIsEmojiPickerOpen(false); // Закрываем окно смайлов при отправке
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-none z-20 px-4 pb-5 pt-2 bg-gradient-to-t from-slate-50/90 via-slate-50/40 to-transparent dark:from-slate-900/85 dark:via-slate-900/40 dark:to-transparent pointer-events-none [&>*]:pointer-events-auto">
      <div className="w-full relative">
        {isEmojiPickerOpen && (
          <div ref={emojiPickerRef} className="absolute bottom-[calc(100%+12px)] left-0 mb-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 z-50 w-full max-w-[450px]">
            <div className="grid grid-cols-8 gap-1 p-1">
              {['😊', '😂', '🤣', '❤️', '😍', '😒', '👌', '😘', '💕', '😁', '👍', '🙌', '👏', '🤝', '🔥', '✨', '✅', '🆘', '❓', '📞', '🖥️', '📦', '🏥', '🚑', '😢', '😭', '😩', '😤', '😡', '🤯', '😱', '🤔', '🤨', '🙄', '😴', '👋', '🙏', '💪', '🚀', '⭐', '📍', '📅', '📎', '💻', '📱', '🔋', '🔌', '🛠️'].map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    textareaRef.current?.focus();
                  }} 
                  className="text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-all hover:scale-125 focus:outline-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl p-2 rounded-[28px] border border-slate-200/70 dark:border-slate-600/50 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25),0_4px_12px_-4px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_48px_-10px_rgba(0,0,0,0.55),0_6px_16px_-6px_rgba(0,0,0,0.35)] transition-shadow focus-within:shadow-[0_16px_48px_-8px_rgba(59,130,246,0.22),0_8px_20px_-6px_rgba(15,23,42,0.15)] dark:focus-within:shadow-[0_18px_52px_-10px_rgba(59,130,246,0.18),0_8px_20px_-8px_rgba(0,0,0,0.45)] focus-within:border-blue-300/80 dark:focus-within:border-blue-500/50">
          <div className="flex items-center gap-1 px-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-slate-400 shrink-0 w-9 h-9 rounded-full", isEmojiPickerOpen && "text-blue-500 bg-blue-50 dark:bg-blue-900/20")} 
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 shrink-0 w-9 h-9 rounded-full">
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
          <textarea 
            ref={textareaRef} 
            placeholder="Напишите сообщение..." 
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none !outline-none !ring-0 resize-none py-2.5 text-sm max-h-[150px] min-h-[40px] text-slate-800 dark:text-slate-100 custom-scrollbar leading-relaxed" 
            value={newMessage} 
            maxLength={4096} 
            onChange={(e) => setNewMessage(e.target.value)} 
            onKeyDown={handleKeyDown} 
            rows={1} 
            disabled={disabled}
          />
          <div className="flex flex-col items-end gap-1 px-1">
            {newMessage.length > 3000 && (
              <span className={cn("text-[9px] font-bold mr-2 mb-1", newMessage.length > 4000 ? "text-red-500" : "text-slate-400")}>
                {newMessage.length}/4096
              </span>
            )}
            <button 
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200", 
                newMessage.trim() && !disabled ? "bg-blue-600 text-white shadow-md shadow-blue-500/40 scale-100" : "bg-slate-100 dark:bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed"
              )} 
              onClick={handleSend} 
              disabled={!newMessage.trim() || disabled}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
