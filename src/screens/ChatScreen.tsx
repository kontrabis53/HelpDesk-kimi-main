import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Send, 
  Users, 
  MessageSquare, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  User, 
  Hash, 
  ArrowLeft,
  Settings,
  Smile,
  Paperclip,
  ExternalLink,
  HelpCircle,
  Smartphone,
  MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chatStore';
import { useRoleStore } from '@/stores/roleStore';
import { useAuthStore } from '@/stores/authStore';
import { useDirectoryStore } from '@/stores/directoryStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export function ChatScreen() {
  const { 
    chats, 
    messages, 
    activeChatId, 
    setActiveChat, 
    sendMessage, 
    createGroupChat, 
    createDirectChat,
    clearUnread 
  } = useChatStore();
  
  const { users } = useRoleStore();
  const { entries: directoryEntries } = useDirectoryStore();
  const currentUser = useAuthStore((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = messages.filter(m => m.chatId === activeChatId);

  // Find directory info for active chat participant if it's a direct chat
  const activeChatDirectoryInfo = useMemo(() => {
    if (!activeChat || activeChat.type !== 'direct') return null;
    const otherId = activeChat.participants.find(p => p !== currentUser?.id);
    return directoryEntries.find(e => e.id === otherId || e.name === otherId);
  }, [activeChat, directoryEntries, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeChatId) {
      clearUnread(activeChatId);
    }
  }, [activeChatId, clearUnread]);

  const handleSendMessage = (textOverride?: string) => {
    const textToSend = textOverride || newMessage;
    if (!textToSend.trim() || !activeChatId || !currentUser) return;
    
    // Send message with both Role Name and Real Name
    sendMessage(
      activeChatId, 
      textToSend.trim(), 
      currentUser.id, 
      currentUser.roleId === 'admin' ? 'Администратор' : currentUser.name, 
      currentUser.name
    );
    if (!textOverride) setNewMessage('');
  };

  const handleCreateDirectChat = (user: any) => {
    const id = createDirectChat(user.id, user.name);
    setActiveChat(id);
    setIsNewChatModalOpen(false);
    setUserSearchQuery('');
  };

  const handleQuickAction = (action: string) => {
    let text = '';
    switch(action) {
      case 'help': text = "🆘 Мне нужна помощь!"; break;
      case 'connect': text = "🖥️ Прошу подключиться удаленно."; break;
      case 'status': text = "❓ Какой статус по моей заявке?"; break;
      case 'thanks': text = "✅ Спасибо, всё работает!"; break;
    }
    if (text) handleSendMessage(text);
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
     u.roleId.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const handleContactAction = (type: 'call' | 'telegram', value: string) => {
    if (!value) return;
    if (type === 'call') {
      window.location.href = `tel:${value.replace(/\s+/g, '')}`;
    } else {
      window.open(`https://t.me/${value.replace('@', '')}`, '_blank');
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* Sidebar - Chat List */}
      <div className={cn(
        "w-full md:w-80 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all",
        activeChatId ? "hidden md:flex" : "flex h-full"
      )}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Чаты</h1>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsNewChatModalOpen(true)}>
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Поиск чатов..." 
              className="pl-9 bg-slate-100 dark:bg-slate-700 border-0 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  activeChatId === chat.id 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border",
                    chat.type === 'group' 
                      ? "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                      : "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  )}>
                    {chat.type === 'group' ? <Users className="w-6 h-6 text-amber-600" /> : <User className="w-6 h-6 text-blue-600" />}
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-800">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold text-sm truncate pr-2 text-slate-900 dark:text-slate-100">
                      {chat.name}
                    </span>
                    {chat.lastMessageTime && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {format(new Date(chat.lastMessageTime), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">
                    {chat.lastMessage || 'Нет сообщений'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white dark:bg-slate-900 relative",
        !activeChatId && "hidden md:flex"
      )}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChat(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  activeChat.type === 'group' ? "bg-amber-100 dark:bg-amber-900/20" : "bg-blue-100 dark:bg-blue-900/20"
                )}>
                  {activeChat.type === 'group' ? <Users className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 leading-none">{activeChat.name}</h2>
                  <p className="text-[10px] text-green-500 font-medium mt-1">
                    {activeChat.type === 'group' ? `${activeChat.participants.length} участников` : 'В сети'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("text-slate-400", isQuickActionsOpen && "text-blue-600 bg-blue-50 dark:bg-blue-900/20")}
                  onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area */}
              <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-4">
                  {chatMessages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const prevMsg = chatMessages[i - 1];
                    const showSender = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                    return (
                      <div key={msg.id} className={cn(
                        "flex flex-col",
                        isMe ? "items-end" : "items-start"
                      )}>
                        {showSender && (
                          <div className="flex items-center gap-2 ml-1 mb-1">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{msg.senderName}</span>
                            {msg.senderRealName && (
                              <span className="text-[10px] text-slate-400 italic">({msg.senderRealName})</span>
                            )}
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm relative shadow-sm",
                          isMe 
                            ? "bg-blue-600 text-white rounded-tr-none" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700"
                        )}>
                          {msg.text}
                          <span className={cn(
                            "text-[9px] mt-1 block opacity-60",
                            isMe ? "text-right" : "text-left"
                          )}>
                            {format(new Date(msg.timestamp), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions Sidebar (Right) */}
              {isQuickActionsOpen && (
                <div className="w-64 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto">
                  {/* Participant Info */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Информация</h3>
                    {activeChatDirectoryInfo ? (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{activeChatDirectoryInfo.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{activeChatDirectoryInfo.position}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[10px]">Каб. {activeChatDirectoryInfo.cabinet}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-[10px] gap-1 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400"
                            onClick={() => handleContactAction('call', activeChatDirectoryInfo.internalPhone)}
                          >
                            <Phone className="w-3 h-3" /> {activeChatDirectoryInfo.internalPhone}
                          </Button>
                          {activeChatDirectoryInfo.mobilePhone && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] gap-1 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400"
                              onClick={() => handleContactAction('call', activeChatDirectoryInfo.mobilePhone!)}
                            >
                              <Smartphone className="w-3 h-3" /> Моб
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center py-6">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400">Выберите личный чат для просмотра контактов</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Messages */}
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Быстрые сообщения</h3>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700"
                        onClick={() => handleQuickAction('help')}
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-2 text-red-500" /> Попросить помочь
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700"
                        onClick={() => handleQuickAction('connect')}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-2 text-blue-500" /> Попросить подключиться
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700"
                        onClick={() => handleQuickAction('status')}
                      >
                        <Search className="w-3.5 h-3.5 mr-2 text-amber-500" /> Статус заявки?
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="max-w-4xl mx-auto flex items-end gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Button variant="ghost" size="icon" className="text-slate-400 shrink-0"><Smile className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="text-slate-400 shrink-0"><Paperclip className="w-5 h-5" /></Button>
                <textarea
                  placeholder="Напишите сообщение..."
                  className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2 text-sm max-h-32 min-h-[40px] text-slate-800 dark:text-slate-100"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10 p-0 shrink-0 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Выберите чат</h3>
            <p className="max-w-xs text-sm">Выберите чат из списка слева или начните новый поиск пользователя</p>
          </div>
        )}
      </div>

      {/* New Chat Modal (Integrated Search) */}
      <Dialog open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Начать новый чат</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Поиск сотрудников по имени или роли..." 
                className="pl-9"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleCreateDirectChat(user)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-medium">{user.roleId}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatModalOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

