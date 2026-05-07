import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  Send, 
  Users, 
  MessageSquare, 
  Plus, 
  MoreVertical, 
  Phone, 
  User as UserIcon, 
  UserPlus,
  ArrowLeft,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Trash2,
  Settings,
  Smile,
  Paperclip,
  ExternalLink,
  HelpCircle,
  Smartphone,
  MapPin,
  Building,
  SendHorizontal,
  Edit2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, sanitizeText, isOnlyEmojis } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { useChatStore } from '@/stores/chatStore';
import { useRoleStore } from '@/stores/roleStore';
import { useAuthStore } from '@/stores/authStore';
import { useDirectoryStore } from '@/stores/directoryStore';
import type { User } from '@/types';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
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
    createDirectChat,
    createGroupChat,
    fetchMessages,
    clearUnread,
    togglePinChat,
    toggleHideChat,
    toggleMuteChat,
    deleteChat,
    showHiddenChats,
    setShowHiddenChats,
    showDirectoryUsers,
    setShowDirectoryUsers
  } = useChatStore();

  const { entries: directoryEntries, fetchEntries: fetchDirectoryEntries } = useDirectoryStore();

  const activeChatIdFromUrl = new URLSearchParams(window.location.search).get('activeChatId');

  useEffect(() => {
    fetchMessages();
    fetchDirectoryEntries(); // Load directory data for the new chat modal
    if (activeChatIdFromUrl) {
      setActiveChat(activeChatIdFromUrl);
      // Clear URL params without reload
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Cleanup: reset active chat when leaving the screen
    return () => {
      console.log('[ChatScreen] Unmounting, clearing activeChatId');
      setActiveChat(null);
    };
  }, [fetchMessages, fetchDirectoryEntries, activeChatIdFromUrl, setActiveChat]);
  
  const { users } = useRoleStore();
  const currentUser = useAuthStore((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string, name: string } | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Group chat state
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeChat = (chats || []).find(c => c.id === activeChatId);
  const chatMessages = (messages || []).filter(m => m.chatId === activeChatId);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '40px'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 200) + 'px'; // Max height 200px
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

  // Handle marking as read on scroll
  useEffect(() => {
    const viewport = viewportRef.current as HTMLDivElement | null;
    if (!viewport || !activeChatId || chatMessages.length === 0) return;

    const handleScroll = () => {
      const isNearBottom = 
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
      
      if (isNearBottom) {
        clearUnread(activeChatId);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [activeChatId, chatMessages.length, clearUnread]);

  // Find directory info and online status
  const activeChatInfo = useMemo(() => {
    if (!activeChat || activeChat.type !== 'direct') return { directory: null, isOnline: false };
    const otherId = activeChat.participants.find(p => p !== currentUser?.id);
    const registeredUser = users.find(u => u.id === otherId || (u.name && activeChat.name && u.name.trim().toLowerCase() === activeChat.name.trim().toLowerCase()));
    const directory = directoryEntries.find(e => {
      if (!e.name || !activeChat.name) return e.id === otherId;
      return e.id === otherId || e.name.trim().toLowerCase() === activeChat.name.trim().toLowerCase();
    });

    return { directory, isOnline: registeredUser?.isOnline || false };
  }, [activeChat, directoryEntries, currentUser, users]);

  const activeChatDirectoryInfo = activeChatInfo.directory;
  const isOtherUserOnline = activeChatInfo.isOnline;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [chatMessages.length, activeChatId]);

  const handleSendMessage = (textOverride?: string) => {
    const textToSend = textOverride || newMessage;
    if (!textToSend.trim() || !activeChatId || !currentUser) return;
    const otherParticipantId = activeChat?.participants.find(p => p !== currentUser.id);
    sendMessage(
      activeChatId, 
      textToSend.trim(), 
      currentUser.id, 
      currentUser.roleId === 'admin' ? 'Администратор' : currentUser.name, 
      otherParticipantId || activeChat?.name || ''
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

  const handleCreateDirectChat = async (entry: any) => {
    let participantId = entry.id;
    if (entry.source === 'directory') {
      const registeredUser = users.find((u: User) => u.name.toLowerCase().trim() === entry.name.toLowerCase().trim());
      if (!registeredUser) {
        toast.error('Пользователь еще не зарегистрирован в системе', {
          description: `Свяжитесь по телефону: ${entry.internalPhone}`,
        });
        return;
      }
      participantId = registeredUser.id;
    }
    const id = await createDirectChat(participantId, entry.name);
    if (id) {
      setActiveChat(id);
      setIsNewChatModalOpen(false);
      setUserSearchQuery('');
      toast.success(`Чат с ${entry.name} открыт`);
    } else {
      toast.error('Не удалось создать чат');
    }
  };

  const handleCreateGroupChat = async () => {
    if (selectedParticipants.length < 1) {
      toast.error('Выберите хотя бы одного участника');
      return;
    }
    const participantNames = selectedParticipants.map(id => {
      const u = users.find(user => user.id === id);
      return u?.name?.split(' ')[0] || id;
    });
    // Remove duplicates from names just in case
    const uniqueNames = Array.from(new Set(participantNames));
    const generatedName = groupName.trim() || uniqueNames.join(', ');
    const id = await createGroupChat(selectedParticipants, generatedName);
    if (id) {
      setActiveChat(id);
      setIsNewChatModalOpen(false);
      setIsGroupMode(false);
      setSelectedParticipants([]);
      setGroupName('');
      toast.success(`Группа создана`);
    } else {
      toast.error('Не удалось создать группу');
    }
  };

  const handleRenameChat = () => {
    if (!chatToRename || !newChatName.trim()) return;
    const { renameChat } = useChatStore.getState();
    renameChat(chatToRename.id, newChatName.trim());
    setIsRenameModalOpen(false);
    setChatToRename(null);
    setNewChatName('');
    toast.success('Чат переименован');
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) ? prev.filter(id => id !== participantId) : [...prev, participantId]
    );
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
    const query = searchQuery.toLowerCase();
    return chats
      .filter(c => {
        const chatName = c.name || '';
        const matchesSearch = chatName.toLowerCase().includes(query);
        return matchesSearch && (showHiddenChats || !c.isHidden);
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : Date.now();
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : Date.now();
        return timeB - timeA;
      });
  }, [chats, searchQuery, showHiddenChats]);

  const filteredDirectoryEntries = useMemo(() => {
    const userPeople = users.map(user => ({
      id: user.id,
      name: user.name,
      position: user.position || 'Пользователь',
      department: user.department || 'Организация',
      cabinet: '—',
      internalPhone: '—',
      source: 'users' as const,
      isRegistered: true
    }));
    const directoryPeople = directoryEntries.map(entry => ({
      ...entry,
      source: 'directory' as const,
      isRegistered: users.some((u: any) => u.name.toLowerCase().trim() === entry.name.toLowerCase().trim())
    }));
    const registeredMap = new Map<string, any>();
    const unregisteredMap = new Map<string, any>();
    userPeople.forEach(person => {
      registeredMap.set(person.name.toLowerCase().trim(), person);
    });
    directoryPeople.forEach(person => {
      const nameKey = person.name.toLowerCase().trim();
      if (person.isRegistered) {
        const existing = registeredMap.get(nameKey);
        if (existing) registeredMap.set(nameKey, { ...person, ...existing, source: 'merged' });
        else registeredMap.set(nameKey, person);
      } else {
        unregisteredMap.set(nameKey, person);
      }
    });
    const result = [
      ...Array.from(registeredMap.values()),
      ...(showDirectoryUsers ? Array.from(unregisteredMap.values()) : [])
    ];
    return result
      .filter(person => person.id !== currentUser?.id) // Исключаем текущего пользователя
      .filter(person => {
        const query = userSearchQuery.toLowerCase();
        return (person.name || '').toLowerCase().includes(query) || 
               (person.position || '').toLowerCase().includes(query) ||
               (person.department || '').toLowerCase().includes(query);
      });
  }, [directoryEntries, users, userSearchQuery, showDirectoryUsers, currentUser]);

  const isUserRegistered = (person: any) => person.isRegistered;

  const formatChatName = (name: string, type: 'direct' | 'group') => {
    if (type === 'direct' || !name.includes(',')) return name;
    const names = name.split(',').map(n => n.trim());
    if (names.length <= 1) return name;
    const first = names[0];
    const second = names[1];
    const halfSecond = second.substring(0, Math.ceil(second.length / 2));
    return `${first}, ${halfSecond}`;
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
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
                    {showHiddenChats ? <><EyeOff className="w-4 h-4 mr-2" /> Скрыть скрытые чаты</> : <><Eye className="w-4 h-4 mr-2" /> Показать скрытые чаты</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDirectoryUsers(!showDirectoryUsers)}>
                    {showDirectoryUsers ? <><Users className="w-4 h-4 mr-2" /> Скрыть сотрудников</> : <><Users className="w-4 h-4 mr-2" /> Показать сотрудников</>}
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
                       <UserAvatar 
                         avatarUrl={users.find(u => u.id === chat.participants.find(p => p !== currentUser?.id) || (u.name && chat.name && u.name.trim().toLowerCase() === chat.name.trim().toLowerCase()))?.avatar} 
                         name={chat.name} 
                         sizeClass="w-12 h-12" 
                         textClass="text-xs" 
                       />
                       {chat.type === 'direct' && (
                         <div className={cn(
                           "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800",
                           users.find(u => u.id === chat.participants.find(p => p !== currentUser?.id) || (u.name && chat.name && u.name.trim().toLowerCase() === chat.name.trim().toLowerCase()))?.isOnline ? "bg-emerald-500" : "bg-red-500"
                         )} />
                       )}
                       {chat.unreadCount > 0 && (
                         <span className={cn(
                           "absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2",
                           activeChatId === chat.id ? "bg-white text-blue-600 border-blue-600" : "bg-red-500 text-white border-white dark:border-slate-800"
                         )}>
                           {chat.unreadCount}
                         </span>
                       )}
                       {chat.isPinned && (
                         <div className={cn(
                           "absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm border",
                           activeChatId === chat.id ? "bg-white border-blue-600" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                         )}>
                           <Pin className={cn("w-3 h-3", activeChatId === chat.id ? "text-blue-600 fill-blue-600" : "text-blue-500 fill-blue-500")} />
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0 text-left">
                       <div className="flex justify-between items-center mb-1 gap-3">
                          <div className="flex-1 min-w-0 flex items-center gap-1">
                            <div className={cn(
                              "font-bold text-sm text-fade flex-1",
                              activeChatId === chat.id ? "text-white" : "text-slate-900 dark:text-slate-100",
                              chat.unreadCount > 0 && activeChatId !== chat.id && "font-black"
                            )}>
                              {formatChatName(chat.name, chat.type)}
                            </div>
                            {chat.isMuted && <BellOff className={cn("w-3 h-3 flex-shrink-0", activeChatId === chat.id ? "text-white/70" : "text-slate-400")} />}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                           {chat.unreadCount > 0 && activeChatId !== chat.id && (
                             <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-sm">
                               {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                             </span>
                           )}
                           {chat.lastMessageTime && (
                             <span className={cn(
                               "text-[10px] whitespace-nowrap",
                               activeChatId === chat.id ? "text-white/80" : "text-slate-400",
                               chat.unreadCount > 0 && activeChatId !== chat.id && "text-blue-600 dark:text-blue-400 font-bold"
                             )}>
                               {format(new Date(chat.lastMessageTime), 'HH:mm')}
                             </span>
                           )}
                         </div>
                       </div>
                       <p className={cn(
                         "text-xs truncate leading-tight",
                         activeChatId === chat.id ? "text-white/90 font-medium" : "text-slate-500 dark:text-slate-400",
                         chat.unreadCount > 0 && activeChatId !== chat.id && "text-slate-900 dark:text-slate-100 font-bold"
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
                    {chat.isPinned ? <><PinOff className="w-4 h-4 mr-2" /> Открепить</> : <><Pin className="w-4 h-4 mr-2" /> Закрепить</>}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleMuteChat(chat.id)}>
                    {chat.isMuted ? <><Bell className="w-4 h-4 mr-2" /> Включить звук</> : <><BellOff className="w-4 h-4 mr-2" /> Без звука</>}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => toggleHideChat(chat.id)}>
                    {chat.isHidden ? <><Eye className="w-4 h-4 mr-2" /> Показать</> : <><EyeOff className="w-4 h-4 mr-2" /> Скрыть</>}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    setChatToRename({ id: chat.id, name: chat.name });
                    setNewChatName(chat.name);
                    setIsRenameModalOpen(true);
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Переименовать
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                    if (confirm('Вы уверены?')) { deleteChat(chat.id); toast.success('Чат удален'); }
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className={cn("flex-1 flex flex-col bg-white dark:bg-slate-900 relative", !activeChatId && "hidden md:flex")}>
        {activeChat ? (
          <>
            <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChat(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <UserAvatar 
                  avatarUrl={users.find(u => u.id === activeChat.participants.find(p => p !== currentUser?.id) || (u.name && activeChat.name && u.name.trim().toLowerCase() === activeChat.name.trim().toLowerCase()))?.avatar} 
                  name={activeChat.name} 
                  sizeClass="w-10 h-10" 
                  textClass="text-[10px]" 
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 leading-none flex items-center gap-1">
                    <span className="text-fade max-w-[200px] md:max-w-[400px]">
                      {formatChatName(activeChat.name, activeChat.type)}
                    </span>
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isOtherUserOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{isOtherUserOnline ? 'В сети' : 'Не в сети'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className={cn("text-slate-400", isQuickActionsOpen && "text-blue-600 bg-blue-50 dark:bg-blue-900/20")} onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}>
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="flex-1 overflow-hidden flex flex-col relative">
                  <ScrollArea className="flex-1 px-4" viewportRef={viewportRef as any}>
                  <div className="py-4 space-y-4">
                    {chatMessages.map((msg, i) => {
                      const isMe = msg.senderId === currentUser?.id;
                      const prevMsg = chatMessages[i - 1];
                      const showSender = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                      const senderFromMsg = msg.senderId === currentUser?.id ? currentUser : ((msg as any).sender || users.find(u => u.id === msg.senderId));
                      const senderName = msg.senderName || senderFromMsg?.name || 'Пользователь';
                      const onlyEmojis = isOnlyEmojis(msg.text);
                      return (
                        <div key={msg.id} className={cn("flex gap-3 mb-4", isMe ? "flex-row-reverse items-end" : "flex-row items-end")}>
                          <div className="shrink-0 mb-1">
                            <UserAvatar avatarUrl={senderFromMsg?.avatar} name={senderName} sizeClass="w-9 h-9" textClass="text-[10px]" />
                          </div>
                          <div className={cn("flex flex-col max-w-[75%] md:max-w-[65%]", isMe ? "items-end" : "items-start")}>
                            {showSender && <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{senderName}</span>}
                            <div className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words w-fit transition-all",
                              isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700",
                              onlyEmojis && "bg-transparent dark:bg-transparent border-transparent dark:border-transparent shadow-none px-0 py-0"
                            )}>
                              <p className={cn("whitespace-pre-wrap leading-relaxed", onlyEmojis && "emoji-large")}>{sanitizeText(msg.text)}</p>
                              <span className={cn("text-[9px] mt-1 block opacity-60", isMe ? "text-right" : "text-left", onlyEmojis && "hidden")}>
                                {format(new Date(msg.timestamp || msg.createdAt), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="px-4 pb-6 pt-2 bg-transparent relative z-20">
                  <div className="w-full relative">
                    {isEmojiPickerOpen && (
                      <div ref={emojiPickerRef} className="absolute bottom-[calc(100%+12px)] left-0 mb-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 z-50 w-full max-w-[450px]">
                        <div className="grid grid-cols-8 gap-1 p-1">
                          {['😊', '😂', '🤣', '❤️', '😍', '😒', '👌', '😘', '💕', '😁', '👍', '🙌', '👏', '🤝', '🔥', '✨', '✅', '🆘', '❓', '📞', '🖥️', '📦', '🏥', '🚑', '😢', '😭', '😩', '😤', '😡', '🤯', '😱', '🤔', '🤨', '🙄', '😴', '👋', '🙏', '💪', '🚀', '⭐', '📍', '📅', '📎', '💻', '📱', '🔋', '🔌', '🛠️'].map(emoji => (
                            <button key={emoji} onClick={() => setNewMessage(prev => prev + emoji)} className="text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-all hover:scale-125">{emoji}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-end gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-all focus-within:ring-0 focus-within:ring-transparent focus-within:border-slate-300 dark:focus-within:border-slate-600">
                      <div className="flex items-center gap-1 px-1">
                        <Button variant="ghost" size="icon" className={cn("text-slate-400 shrink-0 w-9 h-9 rounded-full", isEmojiPickerOpen && "text-blue-500 bg-blue-50 dark:bg-blue-900/20")} onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}><Smile className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 shrink-0 w-9 h-9 rounded-full"><Paperclip className="w-5 h-5" /></Button>
                      </div>
                      <textarea ref={textareaRef} placeholder="Напишите сообщение..." className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none !outline-none !ring-0 resize-none py-2.5 text-sm max-h-[200px] min-h-[40px] text-slate-800 dark:text-slate-100 custom-scrollbar leading-relaxed" value={newMessage} maxLength={4096} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} rows={1} />
                      <div className="flex flex-col items-end gap-1 px-1">
                        {newMessage.length > 3000 && <span className={cn("text-[9px] font-bold mr-2 mb-1", newMessage.length > 4000 ? "text-red-500" : "text-slate-400")}>{newMessage.length}/4096</span>}
                        <button className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200", newMessage.trim() ? "bg-blue-600 text-white shadow-md shadow-blue-500/40 scale-100" : "bg-slate-100 dark:bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed")} onClick={() => handleSendMessage()} disabled={!newMessage.trim()}><Send className="w-4 h-4 ml-0.5" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isQuickActionsOpen && (
              <div className="w-64 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto h-full">
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Участники</h3>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1" onClick={() => {
                        setIsGroupMode(true);
                        setSelectedParticipants(activeChat.participants.filter(id => id !== currentUser?.id));
                        setIsNewChatModalOpen(true);
                      }}>
                        <UserPlus className="w-3 h-3" /> Добавить
                      </Button>
                    </div>
                    {activeChat.type === 'group' ? (
                      <div className="space-y-2">
                        {Array.from(new Set(activeChat.participants)).map(participantId => {
                          const participant = users.find(u => u.id === participantId);
                          if (!participant) return null;
                          return (
                            <div key={participantId} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all">
                              <UserAvatar avatarUrl={participant.avatar} name={participant.name} sizeClass="w-8 h-8" textClass="text-[10px]" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{participant.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{participant.position || 'Пользователь'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : activeChatDirectoryInfo ? (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner shrink-0"><UserIcon className="w-6 h-6" /></div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{activeChatDirectoryInfo.name}</p>
                              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate mt-0.5">{activeChatDirectoryInfo.position}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Building className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] font-medium truncate">{activeChatDirectoryInfo.department}</span></div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] font-medium">Кабинет {activeChatDirectoryInfo.cabinet}</span></div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 pt-2">
                            <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/50" onClick={() => handleContactAction('call', activeChatDirectoryInfo.internalPhone)}><Phone className="w-3.5 h-3.5" /> Вн. {activeChatDirectoryInfo.internalPhone}</Button>
                            {activeChatDirectoryInfo.mobilePhone && <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-transparent hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => handleContactAction('call', activeChatDirectoryInfo.mobilePhone!)}><Smartphone className="w-3.5 h-3.5" /> Позвонить</Button>}
                            {activeChatDirectoryInfo.telegram && <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-[#0088cc15] text-[#0088cc] dark:text-[#33aaff] border-transparent hover:bg-[#0088cc25]" onClick={() => handleContactAction('telegram', activeChatDirectoryInfo.telegram!)}><SendHorizontal className="w-3.5 h-3.5" /> Telegram</Button>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-slate-300" /></div>
                        <p className="text-[11px] text-slate-400 leading-relaxed px-2">Выберите личный чат для просмотра контактов</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Быстрые сообщения</h3>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="sm" className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700" onClick={() => handleQuickAction('help')}><HelpCircle className="w-3.5 h-3.5 mr-2 text-red-500" /> Попросить помочь</Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700" onClick={() => handleQuickAction('connect')}><ExternalLink className="w-3.5 h-3.5 mr-2 text-blue-500" /> Подключиться</Button>
                      <Button variant="ghost" size="sm" className="justify-start text-xs h-9 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-100 dark:border-slate-700" onClick={() => handleQuickAction('status')}><Search className="w-3.5 h-3.5 mr-2 text-amber-500" /> Статус заявки?</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6"><MessageSquare className="w-10 h-10 opacity-20" /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Выберите чат</h3>
            <p className="max-w-xs text-sm">Выберите чат из списка слева или начните новый поиск пользователя</p>
          </div>
        )}
      </div>

      <Dialog open={isNewChatModalOpen} onOpenChange={(open) => { setIsNewChatModalOpen(open); if (!open) { setExpandedPersonId(null); setIsGroupMode(false); setSelectedParticipants([]); setGroupName(''); } }}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-0"><DialogTitle className="text-xl font-bold">Начать новый чат</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            {isGroupMode ? (
              <div className="space-y-3 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md"><Users className="w-5 h-5" /></div>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Группа</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-500 hover:text-red-500 rounded-lg" onClick={() => { setIsGroupMode(false); setSelectedParticipants([]); }}>Отмена</Button>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Участники:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedParticipants.length > 0 ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedParticipants.map(id => users.find(u => u.id === id)?.name).join(', ')}</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Выберите участников ниже</p>
                    )}
                  </div>
                </div>
                {selectedParticipants.length > 0 && <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl shadow-lg shadow-blue-500/20" onClick={handleCreateGroupChat}>Создать группу ({selectedParticipants.length})</Button>}
              </div>
            ) : (
              <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-3 font-bold shadow-sm" onClick={() => setIsGroupMode(true)}><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Users className="w-5 h-5" /></div>Создать групповой чат</Button>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Поиск сотрудников..." className="pl-9 bg-slate-100 dark:bg-slate-700 border-0 h-11 rounded-xl" value={userSearchQuery} onChange={(e) => { setUserSearchQuery(e.target.value); setExpandedPersonId(null); }} />
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {filteredDirectoryEntries.length > 0 ? (
                  (() => {
                    const registered = filteredDirectoryEntries.filter(e => e.isRegistered);
                    const unregistered = filteredDirectoryEntries.filter(e => !e.isRegistered);
                    const renderEntry = (entry: any) => {
                      const reg = isUserRegistered(entry);
                      const isExpanded = expandedPersonId === entry.id;
                      const isSelected = selectedParticipants.includes(entry.id);
                      return (
                        <div key={entry.id} className={cn("group relative rounded-2xl border transition-all duration-300 overflow-hidden", reg ? "border-slate-100 dark:border-slate-700 hover:border-blue-200" : "border-slate-50 dark:border-slate-800 bg-slate-50/30 opacity-95", isExpanded && "border-blue-400 shadow-md bg-blue-50/30", isSelected && "border-blue-500 bg-blue-50")}>
                          <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => { if (isGroupMode && reg) toggleParticipant(entry.id); else setExpandedPersonId(isExpanded ? null : entry.id); }}>
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", reg ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400", isSelected && "bg-blue-600 text-white")}>{isSelected ? <Plus className="w-5 h-5 rotate-45" /> : <UserIcon className="w-5 h-5" />}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2"><p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{entry.name}</p>{!reg && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-600 border border-amber-200/50 whitespace-nowrap">Не в системе</span>}</div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{entry.position}</p>
                            </div>
                            {!isGroupMode && <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}><Plus className={cn("w-4 h-4", isExpanded ? "rotate-45 text-blue-500" : "text-slate-300")} /></div>}
                          </div>
                          {!isGroupMode && (
                            <div className={cn("px-3 pb-3 transition-all duration-300 ease-in-out", isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none")}>
                              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                                  <div className="flex items-center gap-1"><Building className="w-3 h-3 text-slate-400" /><span>{entry.department}</span></div>
                                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /><span>Каб. {entry.cabinet}</span></div>
                                  <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /><span>Вн. {entry.internalPhone}</span></div>
                                </div>
                                {reg ? <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-sm" onClick={() => handleCreateDirectChat(entry)}><Send className="w-3.5 h-3.5" /> Написать сообщение</Button> : <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/50"><p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3">Сотрудник еще не зарегистрирован.</p><div className="flex gap-2"><Button variant="secondary" size="sm" className="h-8 text-[10px] flex-1 font-bold gap-1.5 bg-white text-blue-600 shadow-sm" onClick={(e) => { e.stopPropagation(); handleContactAction('call', entry.internalPhone); }}><Phone className="w-3 h-3" /> Позвонить</Button>{entry.mobilePhone && <Button variant="secondary" size="sm" className="h-8 text-[10px] flex-1 font-bold gap-1.5 bg-white text-green-600 shadow-sm" onClick={(e) => { e.stopPropagation(); handleContactAction('call', entry.mobilePhone!); }}><Smartphone className="w-3 h-3" /> Моб</Button>}</div></div>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };
                    return (
                      <>
                        {registered.length > 0 && <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Зарегистрированные</p>{registered.map(renderEntry)}</div>}
                        {unregistered.length > 0 && <div className="space-y-2"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-2">Из справочника</p>{unregistered.map(renderEntry)}</div>}
                      </>
                    );
                  })()
                ) : (
                  <div className="text-center py-12"><Search className="w-12 h-12 text-slate-100 mx-auto mb-4" /><p className="text-sm text-slate-500">Сотрудники не найдены</p></div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="p-6 pt-0 border-t border-slate-50 flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setIsNewChatModalOpen(false)} className="rounded-xl flex-1">Отмена</Button>
            {isGroupMode && <Button className="rounded-xl flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleCreateGroupChat} disabled={selectedParticipants.length < 1}>Создать группу ({selectedParticipants.length})</Button>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameModalOpen} onOpenChange={(open) => { setIsRenameModalOpen(open); if (!open) { setChatToRename(null); setNewChatName(''); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl border-0 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Переименовать чат</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Новое название</label>
              <Input 
                placeholder="Введите название..." 
                className="bg-slate-100 dark:bg-slate-700 border-0 h-11 rounded-xl focus:ring-2 focus:ring-blue-500" 
                value={newChatName} 
                onChange={(e) => setNewChatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameChat(); }}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setIsRenameModalOpen(false)} className="rounded-xl flex-1">Отмена</Button>
              <Button className="rounded-xl flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleRenameChat} disabled={!newChatName.trim()}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
