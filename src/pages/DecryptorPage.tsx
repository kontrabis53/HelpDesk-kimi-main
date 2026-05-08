import { useState } from 'react';
import { cryptoUtils } from '@/utils/cryptoUtils';
import { useChatStore } from '@/stores/chatStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Key, Lock, Unlock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DecryptorPage() {
  const [masterKey, setMasterKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { messages } = useChatStore();
  const [searchChatId, setSearchChatId] = useState('');

  const handleAuthorize = () => {
    if (masterKey === 'medin-helpdesk-secure-v1-2024') {
      setIsAuthorized(true);
    }
  };

  const encryptedMessages = messages.filter(m => m.text && m.text.startsWith('[ENC]'));

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">Мастер-дешифратор</h1>
          <p className="text-sm text-slate-500 mb-8">Введите ваш секретный мастер-ключ для доступа к защищенным данным</p>
          
          <div className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="password" 
                placeholder="Мастер-ключ" 
                className="pl-11 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-blue-500/20"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
              />
            </div>
            <Button 
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              onClick={handleAuthorize}
            >
              Открыть доступ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Панель аудита</h1>
          <p className="text-slate-500 font-medium mt-1">Просмотр и дешифровка защищенной переписки</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsAuthorized(false)}
          className="rounded-xl border-slate-200 text-slate-500 hover:text-red-500"
        >
          Закрыть сессию
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Статистика</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Всего в памяти:</span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">Зашифрованных:</span>
                <span className="text-sm font-black text-blue-600">{encryptedMessages.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Фильтр чата</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Chat ID..." 
                className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-0"
                value={searchChatId}
                onChange={(e) => setSearchChatId(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Лента сообщений</h3>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages
                  .filter(m => !searchChatId || m.chatId?.includes(searchChatId))
                  .map((msg) => {
                    const isEnc = msg.text?.startsWith('[ENC]');
                    const decrypted = isEnc ? cryptoUtils.adminDecrypt(msg.text || '', msg.chatId || 'public', masterKey) : msg.text;
                    
                    return (
                      <div key={msg.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                              {msg.senderName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {msg.chatId}
                            </span>
                          </div>
                          {isEnc ? (
                            <Lock className="w-3 h-3 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <Unlock className="w-3 h-3 text-slate-300" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {isEnc && (
                            <p className="text-[9px] font-mono text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                              {msg.text}
                            </p>
                          )}
                          <p className={cn(
                            "text-sm font-medium leading-relaxed",
                            isEnc ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"
                          )}>
                            {decrypted}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
