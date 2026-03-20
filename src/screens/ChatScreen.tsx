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
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Trash2,
  Trash,
  Settings,
  Smile,
  Paperclip,
  ExternalLink,
  HelpCircle,
  Smartphone,
  MapPin,
  Building,
  SendHorizontal
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
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
    clearUnread,
    togglePinChat,
    toggleHideChat,
    toggleMuteChat,
    deleteChat,
    showHiddenChats,
    setShowHiddenChats
  } = useChatStore();
  
  const { users } = useRoleStore();
  const { entries: directoryEntries } = useDirectoryStore();
  const currentUser = useAuthStore((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = messages.filter(m => m.chatId === activeChatId);

  // Find directory info for active chat participant if it's a direct chat
  const activeChatDirectoryInfo = useMemo(() => {
    if (!activeChat || activeChat.type !== 'direct') return null;
    
    // 1. Find ID of other person
    const otherId = activeChat.participants.find(p => p !== currentUser?.id && p !== 'current-user');
    
    // 2. Search by ID or Name (since IDs may differ between stores)
    return directoryEntries.find(e => 
      e.id === otherId || 
      e.name.trim().toLowerCase() === activeChat.name.trim().toLowerCase()
    );
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

  const handleContactAction = (type: 'call' | 'telegram', value: string) => {
    if (!value) return;
    if (type === 'call') {
      window.location.href = `tel:${value.replace(/\s+/g, '')}`;
    } else {
      window.open(`https://t.me/${value.replace('@', '')}`, '_blank');
    }
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

  const filteredChats = useMemo(() => {
    return chats
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isHidden = c.isHidden;
        return matchesSearch && (showHiddenChats || !isHidden);
      })
      .sort((a, b) => {
        // First sort by pinned
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        
        // Then sort by last message time
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
  }, [chats, searchQuery, showHiddenChats]);

  const filteredDirectoryEntries = useMemo(() => {
    // 1. Get all employees from Directory
    const directoryPeople = directoryEntries.map(entry => ({
      ...entry,
      source: 'directory' as const
    }));

    // 2. Get all users from RoleStore
    const userPeople = users.map(user => ({
      id: user.id,
      name: user.name,
      position: user.position || 'Пользователь',
      department: user.department || 'Организация',
      cabinet: '—',
      internalPhone: '—',
      source: 'users' as const,
      isUser: true
    }));

    // 3. Merge them: prefer directory info if both exist, but mark as registered
    const mergedMap = new Map<string, any>();

    // Add directory people first
    directoryPeople.forEach(person => {
      mergedMap.set(person.name.toLowerCase().trim(), {
        ...person,
        isRegistered: users.some(u => u.name.toLowerCase().trim() === person.name.toLowerCase().trim())
      });
    });

    // Add users who are not in directory
    userPeople.forEach(person => {
      const nameKey = person.name.toLowerCase().trim();
      if (!mergedMap.has(nameKey)) {
        mergedMap.set(nameKey, {
          ...person,
          isRegistered: true
        });
      }
    });

    // 4. Convert back to array and filter by search query
    return Array.from(mergedMap.values())
      .filter(person => 
        person.id !== currentUser?.id && 
        person.name.toLowerCase().trim() !== currentUser?.name.toLowerCase().trim() &&
        (person.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
         person.position.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
         person.department.toLowerCase().includes(userSearchQuery.toLowerCase()))
      );
  }, [directoryEntries, users, userSearchQuery, currentUser]);

  const isUserRegistered = (person: any) => {
    return person.isRegistered;
  };

   const handleCreateDirectChatFromDirectory = (entry: any) => {
     if (!isUserRegistered(entry)) {
       toast.error('Пользователь еще не зарегистрирован в системе', {
         description: `Вы можете связаться с ним по телефону: ${entry.internalPhone}`,
       });
       return;
     }
     const id = createDirectChat(entry.id, entry.name);
     setActiveChat(id);
     setIsNewChatModalOpen(false);
     setUserSearchQuery('');
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Настройки чата</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowHiddenChats(!showHiddenChats)}>
                    {showHiddenChats ? (
                      <><EyeOff className="w-4 h-4 mr-2" /> Скрыть скрытые чаты</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-2" /> Показать скрытые чаты</>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <ContextMenu key={chat.id}>
                <ContextMenuTrigger>
                  <button
                     onClick={() => setActiveChat(chat.id)}
                     className={cn(
                       "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative border-2",
                       activeChatId === chat.id 
                         ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02] z-10" 
                         : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-transparent",
                       chat.isHidden && "opacity-50 grayscale-[0.5]"
                     )}
                   >
                     <div className="relative flex-shrink-0">
                       <div className={cn(
                         "w-12 h-12 rounded-full flex items-center justify-center border transition-colors",
                         activeChatId === chat.id
                           ? "bg-white/20 border-white/30"
                           : chat.type === 'group' 
                             ? "bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" 
                             : "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                       )}>
                         {chat.type === 'group' 
                           ? <Users className={cn("w-6 h-6", activeChatId === chat.id ? "text-white" : "text-amber-600")} /> 
                           : <User className={cn("w-6 h-6", activeChatId === chat.id ? "text-white" : "text-blue-600")} />
                         }
                       </div>
                       {chat.unreadCount > 0 && (
                         <span className={cn(
                           "absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2",
                           activeChatId === chat.id
                             ? "bg-white text-blue-600 border-blue-600"
                             : "bg-red-500 text-white border-white dark:border-slate-800"
                         )}>
                           {chat.unreadCount}
                         </span>
                       )}
                       {chat.isPinned && (
                         <div className={cn(
                           "absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm border",
                           activeChatId === chat.id
                             ? "bg-white border-blue-600"
                             : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                         )}>
                           <Pin className={cn("w-3 h-3", activeChatId === chat.id ? "text-blue-600 fill-blue-600" : "text-blue-500 fill-blue-500")} />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0 text-left">
                       <div className="flex justify-between items-start mb-0.5">
                         <span className={cn(
                           "font-bold text-sm truncate pr-2 flex items-center gap-1",
                           activeChatId === chat.id ? "text-white" : "text-slate-900 dark:text-slate-100"
                         )}>
                           {chat.name}
                           {chat.isMuted && <BellOff className={cn("w-3 h-3", activeChatId === chat.id ? "text-white/70" : "text-slate-400")} />}
                         </span>
                         {chat.lastMessageTime && (
                           <span className={cn(
                             "text-[10px] whitespace-nowrap",
                             activeChatId === chat.id ? "text-white/80" : "text-slate-400"
                           )}>
                             {format(new Date(chat.lastMessageTime), 'HH:mm')}
                           </span>
                         )}
                       </div>
                       <p className={cn(
                         "text-xs truncate leading-tight",
                         activeChatId === chat.id ? "text-white/90 font-medium" : "text-slate-500 dark:text-slate-400"
                       )}>
                         {chat.lastMessage || 'Нет сообщений'}
                       </p>
                     </div>
                     {activeChatId === chat.id && (
                       <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                     )}
                   </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem onClick={() => togglePinChat(chat.id)}>
                    {chat.isPinned ? (
                      <><PinOff className="w-4 h-4 mr-2" /> Открепить</>
                    ) : (
                      <><Pin className="w-4 h-4 mr-2" /> Закрепить</>
                    )}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleMuteChat(chat.id)}>
                    {chat.isMuted ? (
                      <><Bell className="w-4 h-4 mr-2" /> Включить звук</>
                    ) : (
                      <><BellOff className="w-4 h-4 mr-2" /> Без звука</>
                    )}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleHideChat(chat.id)}>
                    {chat.isHidden ? (
                      <><Eye className="w-4 h-4 mr-2" /> Показать</>
                    ) : (
                      <><EyeOff className="w-4 h-4 mr-2" /> Скрыть</>
                    )}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => {
                      if (confirm('Вы уверены, что хотите удалить этот чат? Все сообщения будут удалены.')) {
                        deleteChat(chat.id);
                        toast.success('Чат удален');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Информация</h3>
                    {activeChatDirectoryInfo ? (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        {/* Header Profile Section */}
                        <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner shrink-0">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {activeChatDirectoryInfo.name}
                              </p>
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate mt-0.5">
                                {activeChatDirectoryInfo.position}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px] font-medium truncate">{activeChatDirectoryInfo.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px] font-medium">Кабинет {activeChatDirectoryInfo.cabinet}</span>
                            </div>
                          </div>

                          {/* Quick Actions Grid */}
                          <div className="grid grid-cols-1 gap-2 pt-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="h-9 text-[11px] font-bold gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              onClick={() => handleContactAction('call', activeChatDirectoryInfo.internalPhone)}
                            >
                              <Phone className="w-3.5 h-3.5" /> Вн. {activeChatDirectoryInfo.internalPhone}
                            </Button>
                            
                            {activeChatDirectoryInfo.mobilePhone && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-9 text-[11px] font-bold gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-transparent hover:bg-green-100 dark:hover:bg-green-900/40"
                                onClick={() => handleContactAction('call', activeChatDirectoryInfo.mobilePhone!)}
                              >
                                <Smartphone className="w-3.5 h-3.5" /> Позвонить
                              </Button>
                            )}

                            {activeChatDirectoryInfo.telegram && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-9 text-[11px] font-bold gap-2 bg-[#0088cc15] text-[#0088cc] dark:text-[#33aaff] border-transparent hover:bg-[#0088cc25]"
                                onClick={() => handleContactAction('telegram', activeChatDirectoryInfo.telegram!)}
                              >
                                <SendHorizontal className="w-3.5 h-3.5" /> Telegram
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                          Выберите личный чат для просмотра контактов сотрудника
                        </p>
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
      <Dialog open={isNewChatModalOpen} onOpenChange={(open) => {
        setIsNewChatModalOpen(open);
        if (!open) setExpandedPersonId(null);
      }}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">Начать новый чат</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Поиск сотрудников..." 
                className="pl-9 bg-slate-100 dark:bg-slate-700 border-0 h-11 rounded-xl"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setExpandedPersonId(null);
                }}
              />
            </div>
            
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {filteredDirectoryEntries.length > 0 ? (
                  filteredDirectoryEntries.map(entry => {
                    const registered = isUserRegistered(entry);
                    const isExpanded = expandedPersonId === entry.id;
                    
                    return (
                      <div 
                        key={entry.id}
                        className={cn(
                          "group relative rounded-2xl border transition-all duration-300 overflow-hidden",
                          registered 
                            ? "border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800" 
                            : "border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 opacity-95",
                          isExpanded && "border-blue-400 dark:border-blue-600 shadow-md bg-blue-50/30 dark:bg-blue-900/10"
                        )}
                      >
                        {/* Compact View (Header) */}
                        <div 
                          className="p-3 flex items-center gap-3 cursor-pointer"
                          onClick={() => setExpandedPersonId(isExpanded ? null : entry.id)}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                            registered 
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" 
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          )}>
                            <User className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">
                                {entry.name}
                              </p>
                              {!registered && (
                                <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 whitespace-nowrap">
                                  Не в системе
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {entry.position}
                            </p>
                          </div>
                          
                          <div className={cn(
                            "transition-transform duration-300",
                            isExpanded ? "rotate-180" : ""
                          )}>
                            <Plus className={cn("w-4 h-4", isExpanded ? "rotate-45 text-blue-500" : "text-slate-300")} />
                          </div>
                        </div>

                        {/* Expanded View (Details) */}
                        <div className={cn(
                          "px-3 pb-3 transition-all duration-300 ease-in-out",
                          isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                        )}>
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-slate-400" />
                                <span>{entry.department}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>Каб. {entry.cabinet}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>Вн. {entry.internalPhone}</span>
                              </div>
                            </div>

                            {registered ? (
                              <Button 
                                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm"
                                onClick={() => handleCreateDirectChatFromDirectory(entry)}
                              >
                                <Send className="w-3.5 h-3.5" /> Написать сообщение
                              </Button>
                            ) : (
                              <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                                <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium leading-relaxed mb-3">
                                  Сотрудник еще не зарегистрирован в системе.
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 text-[10px] flex-1 font-bold gap-1.5 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContactAction('call', entry.internalPhone);
                                    }}
                                  >
                                    <Phone className="w-3 h-3" /> Позвонить
                                  </Button>
                                  {entry.mobilePhone && (
                                    <Button 
                                      variant="secondary" 
                                      size="sm" 
                                      className="h-8 text-[10px] flex-1 font-bold gap-1.5 bg-white dark:bg-slate-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border border-slate-200 dark:border-slate-600 shadow-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactAction('call', entry.mobilePhone!);
                                      }}
                                    >
                                      <Smartphone className="w-3 h-3" /> Моб
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-sm text-slate-500">Сотрудники не найдены</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-800 flex justify-end">
            <Button variant="ghost" onClick={() => setIsNewChatModalOpen(false)} className="rounded-xl">
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

