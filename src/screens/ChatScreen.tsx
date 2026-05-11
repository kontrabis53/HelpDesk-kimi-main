import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
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

  Bell,
  BellOff,
  Trash2,
  Settings,
  Smile,
  ExternalLink,
  HelpCircle,
  Smartphone,
  MapPin,
  Building,
  SendHorizontal,
  Edit2,
  Check,
  X,
  Sparkles,
  Loader2,
  LogOut as LogOutIcon,
  Image as ImageIcon
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ChatSecurityModal } from '@/components/ChatSecurityModal';
import { ChatInput } from '@/components/ChatInput';
import { GroupSettingsModal } from '@/components/GroupSettingsModal'; // New import
import { VList } from 'virtua';

// --- Optimized Sub-components ---

const MessageItem = React.memo(({ msg, isMe, showSender, sender }: any) => {
  const onlyEmojis = isOnlyEmojis(msg.text || '');
  const senderName = msg.senderName || sender?.name || 'Пользователь';

  if (msg.isSystem) {
    let displayText = msg.text || '';
    if (displayText.startsWith('[GROUP_AVATAR_CHANGED]|')) return null;
    if (displayText.startsWith('[GROUP_CREATED]|')) {
      const parts = displayText.split('|');
      displayText = `Пользователь ${parts[3] || 'Пользователь'} создал группу "${parts[1]}"`;
    } else if (displayText.startsWith('[GROUP_UPDATED]|')) {
      const parts = displayText.split('|');
      displayText = `Пользователь ${parts[3] || 'Пользователь'} добавил участников в "${parts[1]}"`;
    } else if (displayText.startsWith('[USER_LEFT_GROUP]|')) {
      const parts = displayText.split('|');
      displayText = `Пользователь ${parts[1]} покинул группу`;
    } else if (displayText.startsWith('[DIRECT_CREATED]|')) {
      displayText = `Пользователь ${displayText.split('|')[1] || 'Пользователь'} начал с вами чат`;
    }
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 px-4 py-1.5 rounded-full">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{sanitizeText(displayText)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 mb-4", isMe ? "flex-row items-end" : "flex-row items-end")}>
      <div className="shrink-0 mb-1">
        <UserAvatar avatarUrl={sender?.avatar} name={senderName} sizeClass="w-9 h-9" textClass="text-[10px]" />
      </div>
      <div className={cn("flex flex-col max-w-[75%] md:max-w-[65%]", isMe ? "items-start" : "items-start")}>
        {(showSender || isMe) && <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{isMe ? 'Вы' : senderName}</span>}
        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-sm shadow-sm break-words w-fit transition-all",
          isMe ? "bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-none border border-slate-200 dark:border-slate-700",
          onlyEmojis && "bg-transparent dark:bg-transparent border-transparent dark:border-transparent shadow-none px-0 py-0"
        )}>
          <p className={cn("whitespace-pre-wrap leading-relaxed", onlyEmojis && "emoji-large")}>{sanitizeText(msg.text || '')}</p>
          <span className={cn("text-[9px] mt-1 block opacity-60", "text-left", onlyEmojis && "hidden")}>{format(new Date(msg.timestamp || msg.createdAt || new Date().toISOString()), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

const ChatItem = React.memo(({ chat, isActive, currentUser, users, onSelect, onRename, onTogglePin, onToggleMute, onDelete, onLeave }: any) => {
  const formatChatName = (name: string, type: 'direct' | 'group') => {
    if (type === 'direct') return name || 'Чат';
    return (name || 'Групповой чат').replace(/^Групповой чат:\s*/, '');
  };

  const otherUser = useMemo(() => {
    return users.find((u: any) => u.id === chat.participants.find((p: string) => p !== currentUser?.id) || (u.name && chat.name && u.name.trim().toLowerCase() === chat.name.trim().toLowerCase()));
  }, [chat, users, currentUser]);

  const isGroup = chat.type === 'group';

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          onClick={() => onSelect(chat.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative border-2",
            isActive 
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-[1.02] z-10" 
              : "hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-transparent"
          )}
        >
          <div className="relative flex-shrink-0">
            <UserAvatar 
              avatarUrl={chat.avatar || otherUser?.avatar} 
              name={chat.name} 
              sizeClass="w-12 h-12" 
              textClass="text-xs" 
              isGroup={chat.type === 'group'}
            />
            {chat.type === 'direct' && (
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800",
                otherUser?.isOnline ? "bg-emerald-500" : "bg-red-500"
              )} />
            )}
            {chat.unreadCount > 0 && (
              <span className={cn(
                "absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2",
                isActive ? "bg-white text-blue-600 border-blue-600" : "bg-red-500 text-white border-white dark:border-slate-800"
              )}>
                {chat.unreadCount}
              </span>
            )}
            {chat.isPinned && (
              <div className={cn(
                "absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm border",
                isActive ? "bg-white border-blue-600" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
              )}>
                <Pin className={cn("w-3 h-3", isActive ? "text-blue-600 fill-blue-600" : "text-blue-500 fill-blue-500")} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-center mb-1 gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <div className={cn(
                  "font-bold text-sm text-fade flex-1",
                  isActive ? "text-white" : "text-slate-900 dark:text-slate-100",
                  chat.unreadCount > 0 && !isActive && "font-black"
                )}>
                  {formatChatName(chat.name, chat.type)}
                </div>
                {chat.isMuted && <BellOff className={cn("w-3 h-3 flex-shrink-0", isActive ? "text-white/70" : "text-slate-400")} />}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {chat.unreadCount > 0 && !isActive && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-sm">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
                )}
                {chat.lastMessageTime && (
                  <span className={cn(
                    "text-[10px] whitespace-nowrap",
                    isActive ? "text-white/80" : "text-slate-400",
                    chat.unreadCount > 0 && !isActive && "text-blue-600 dark:text-blue-400 font-bold"
                  )}>
                    {format(new Date(chat.lastMessageTime), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
            <p className={cn(
              "text-xs truncate leading-tight",
              isActive ? "text-white/90 font-medium" : "text-slate-500 dark:text-slate-400",
              chat.unreadCount > 0 && !isActive && "text-slate-900 dark:text-slate-100 font-bold"
            )}>
              {chat.lastMessage || 'Нет сообщений'}
            </p>
          </div>
          {isActive && (
            <div className="absolute left-[-2px] top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onTogglePin(chat.id)}>
          {chat.isPinned ? <><PinOff className="w-4 h-4 mr-2" /> Открепить</> : <><Pin className="w-4 h-4 mr-2" /> Закрепить</>}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleMute(chat.id)}>
          {chat.isMuted ? <><Bell className="w-4 h-4 mr-2" /> Включить уведомления</> : <><BellOff className="w-4 h-4 mr-2" /> Выключить уведомления</>}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRename({ id: chat.id, name: chat.name })}>
          <Edit2 className="w-4 h-4 mr-2" /> Переименовать
        </ContextMenuItem>
        <ContextMenuSeparator />
        
        {isGroup ? (
          <ContextMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
            if (confirm('Вы уверены, что хотите выйти из группы?')) { onLeave(chat.id); }
          }}>
            <LogOutIcon className="w-4 h-4 mr-2" /> Выйти из группы
          </ContextMenuItem>
        ) : (
          <ContextMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
            if (confirm('Вы уверены, что хотите удалить чат?')) { onDelete(chat.id); }
          }}>
            <Trash2 className="w-4 h-4 mr-2" /> Удалить
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

ChatItem.displayName = 'ChatItem';

export function ChatScreen() {
  const chats = useChatStore(s => s.chats);
  const messages = useChatStore(s => s.messages);
  const activeChatId = useChatStore(s => s.activeChatId);
  const setActiveChat = useChatStore(s => s.setActiveChat);
  const sendMessage = useChatStore(s => s.sendMessage);
  const createDirectChat = useChatStore(s => s.createDirectChat);
  const createGroupChat = useChatStore(s => s.createGroupChat);
  const fetchMessages = useChatStore(s => s.fetchMessages);
  const clearUnread = useChatStore(s => s.clearUnread);
  const togglePinChat = useChatStore(s => s.togglePinChat);
  const toggleMuteChat = useChatStore(s => s.toggleMuteChat);
  const deleteChat = useChatStore(s => s.deleteChat);
  const leaveChat = useChatStore(s => s.leaveChat);
  const showDirectoryUsers = useChatStore(s => s.showDirectoryUsers);
  const setShowDirectoryUsers = useChatStore(s => s.setShowDirectoryUsers);

  const { entries: directoryEntries, fetchEntries: fetchDirectoryEntries } = useDirectoryStore();

  useEffect(() => {
    fetchMessages();
    fetchDirectoryEntries(); // Load directory data for the new chat modal
    
    // Получаем ID из URL только один раз при монтировании
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('activeChatId');
    
    if (chatId) {
      console.log('[ChatScreen] Found activeChatId in URL:', chatId);
      setActiveChat(chatId);
      // Clear URL params without reload
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Cleanup: reset active chat when leaving the screen
    return () => {
      console.log('[ChatScreen] Unmounting, clearing activeChatId');
      setActiveChat(null);
    };
  }, [fetchMessages, fetchDirectoryEntries, setActiveChat]); // activeChatIdFromUrl убран из зависимостей
  
  const { users } = useRoleStore();
  const currentUser = useAuthStore((state) => state.user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  // newMessage state is now handled inside ChatInput
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{ id: string, name: string } | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
  // States related to message input (newMessage, emoji picker, textarea ref) 
  // are now encapsulated in ChatInput component to prevent global re-renders.

  // Group chat state
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Security Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isGroupAdminSettingsModalOpen, setIsGroupAdminSettingsModalOpen] = useState(false); // New state for group admin modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  
  useEffect(() => {
    const lastShowTime = localStorage.getItem('chat_security_modal_last_show');
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (!lastShowTime || (now - parseInt(lastShowTime)) > oneDayInMs) {
      // Small delay to ensure smooth transition after loading messages
      const timer = setTimeout(() => {
        setShowSecurityModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseSecurityModal = () => {
    setShowSecurityModal(false);
    localStorage.setItem('chat_security_modal_last_show', Date.now().toString());
  };

  // Avatar Editor State
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memojis = ['👦', '👧', '👨‍💻', '👩‍💻', '🦸', '🦹', '🐱', '🐶', '🦊', '🦁', '🐸', '🐨'];
  const monogramColors = [
    'bg-amber-400', 'bg-blue-500', 'bg-emerald-500', 
    'bg-rose-500', 'bg-violet-500', 'bg-slate-700'
  ];
  

  const viewportRef = useRef<HTMLDivElement>(null);
  const activeChat = (chats || []).find(c => c.id === activeChatId);
  const chatMessages = (messages || []).filter(m => m.chatId === activeChatId);

  // Focus textarea when switching chats
  useEffect(() => {
    if (activeChatId) {
      // Small delay to ensure the component is rendered and ready
      const timer = setTimeout(() => {
        // Мы не можем напрямую вызвать фокус здесь, так как textarea теперь внутри ChatInput
        // Но мы можем полагаться на то, что ChatInput сам по себе не перерендеривается лишний раз
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeChatId]);

  // Handle marking as read on scroll logic removed as it's now handled by VList onScroll

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
    if (viewportRef.current && chatMessages.length > 0) {
      // При получении новых сообщений в активном чате - обнуляем счетчик
      if (activeChatId) {
        clearUnread(activeChatId);
      }

      // Сначала скрываем контейнер, если это переключение чата
      const el = document.querySelector('.virtua-list-container');
      if (el) (el as HTMLElement).style.opacity = '0';

      // Используем небольшую задержку, чтобы виртуальный список успел рассчитать размеры
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          // Мгновенный скролл к концу
          (viewportRef.current as any)?.scrollToIndex(chatMessages.length + 1, { align: 'end' });
          
          // После скролла плавно показываем
          if (el) (el as HTMLElement).style.opacity = '1';
        });
      }, 30); // 30мс достаточно для подавления визуального прыжка
      
      return () => clearTimeout(timer);
    }
  }, [chatMessages.length, activeChatId]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !activeChatId || !currentUser) return;
    
    const otherParticipantId = activeChat?.participants.find(p => p !== currentUser.id);
    sendMessage(
      activeChatId, 
      text.trim(), // Отправляем чистый текст, стор сам зашифрует
      currentUser.id, 
      currentUser.roleId === 'admin' ? 'Администратор' : currentUser.name, 
      otherParticipantId || activeChat?.name || ''
    );
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
    
    // Если мы уже в групповом чате и открыли модалку "Добавить", 
    // передаем ID текущего чата, чтобы обновить его, а не создавать новый
    const existingGroupId = activeChat?.type === 'group' ? activeChat.id : undefined;
    
    const id = await createGroupChat(selectedParticipants, generatedName, existingGroupId);
    if (id) {
      setActiveChat(id);
      setIsNewChatModalOpen(false);
      setIsGroupMode(false);
      setSelectedParticipants([]);
      setGroupName('');
      toast.success(existingGroupId ? 'Участники добавлены' : 'Группа создана');
    } else {
      toast.error('Не удалось создать группу');
    }
  };

  const handleRenameChat = async () => {
    if (!chatToRename || !newChatName.trim()) return;
    const { renameChat } = useChatStore.getState();
    const success = await renameChat(chatToRename.id, newChatName.trim());
    if (success) {
      setIsRenameModalOpen(false);
      setChatToRename(null);
      setNewChatName('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 2МБ');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Файл должен быть изображением');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setTempAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!tempAvatar || !activeChatId) return;
    setIsUpdatingAvatar(true);
    try {
      const { updateChatAvatar } = useChatStore.getState();
      await updateChatAvatar(activeChatId, tempAvatar);
      setShowAvatarEditor(false);
      setTempAvatar(null);
    } catch (error) {
      console.error('Save chat avatar error:', error);
      toast.error('Не удалось сохранить аватар');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleResetAvatar = async () => {
    if (!activeChatId) return;
    setIsUpdatingAvatar(true);
    try {
      const { updateChatAvatar } = useChatStore.getState();
      await updateChatAvatar(activeChatId, null);
      setShowAvatarEditor(false);
      setTempAvatar(null);
    } catch (error) {
      toast.error('Не удалось сбросить аватар');
    } finally {
      setIsUpdatingAvatar(false);
    }
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
        return matchesSearch;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : Date.now();
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : Date.now();
        return timeB - timeA;
      });
  }, [chats, searchQuery]);

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

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-[380px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all h-full",
        activeChatId ? "hidden md:flex" : "flex"
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
              <ChatItem 
                key={chat.id}
                chat={chat}
                isActive={activeChatId === chat.id}
                currentUser={currentUser}
                users={users}
                onSelect={setActiveChat}
                onRename={(chatInfo: any) => {
                  setChatToRename(chatInfo);
                  setNewChatName(chatInfo.name);
                  setIsRenameModalOpen(true);
                }}
                onTogglePin={togglePinChat}
                onToggleMute={toggleMuteChat}
                onDelete={deleteChat}
                onLeave={leaveChat}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Active Chat Section */}
      <div className={cn(
        "flex-1 min-w-0 h-full grid bg-white dark:bg-slate-900 overflow-hidden relative",
        !activeChatId && "hidden md:flex items-center justify-center"
      )}>
        {activeChat ? (
          <div className={cn(
            "h-full grid min-h-0 overflow-hidden relative",
            isQuickActionsOpen ? "grid-cols-[1fr_256px]" : "grid-cols-1"
          )}>
            {/* Main Chat Column */}
            <div className="h-full grid grid-rows-[64px_1fr_auto] min-h-0 overflow-hidden relative">
              {/* Header */}
              <div className="flex-none h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChat(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <UserAvatar 
                    avatarUrl={activeChat.avatar || users.find(u => {
                      const otherId = activeChat.participants.find(p => p !== currentUser?.id);
                      if (u.id === otherId) return true;
                      if (!u.name || !activeChat.name) return false;
                      return u.name.trim().toLowerCase() === activeChat.name.trim().toLowerCase();
                    })?.avatar} 
                    name={activeChat.name} 
                    sizeClass="w-10 h-10" 
                    textClass="text-[10px]" 
                    isGroup={activeChat.type === 'group'}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 
                      className={cn(
                        "font-bold text-slate-800 dark:text-slate-100 leading-tight",
                        activeChat.type === 'group' && "cursor-pointer hover:text-blue-600 transition-colors"
                      )}
                      onClick={() => {
                        if (activeChat.type === 'group') {
                          setShowAvatarEditor(true);
                        }
                      }}
                    >
                      <div className="truncate max-w-[200px] md:max-w-[500px]">
                        {activeChat.type === 'group' && !activeChat.name.startsWith('Групповой чат:') 
                          ? `Групповой чат: ${activeChat.name}` 
                          : activeChat.name}
                      </div>
                    </h2>
                    {activeChat.type === 'direct' ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isOtherUserOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{isOtherUserOnline ? 'В сети' : 'Не в сети'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          {activeChat.participants.length} участников
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">

                  {/* MoreVertical button - now toggles quick actions */}
                  <Button variant="ghost" size="icon" className={cn("text-slate-400", isQuickActionsOpen && "text-blue-600 bg-blue-50 dark:bg-blue-900/20")} onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}>
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 relative h-full overflow-hidden">
                <VList 
                  key={activeChatId} // Force fresh state when switching chats
                  className="h-full px-4 custom-scrollbar transition-opacity duration-300 virtua-list-container"
                  style={{ overflowY: 'auto', opacity: 0 }}
                  onScroll={(offset) => {
                    const list = viewportRef.current as any;
                    if (!list || !activeChatId || chatMessages.length === 0) return;
                    
                    // Оптимизация: проверяем unreadCount перед вызовом clearUnread
                    const currentChat = chats.find(c => c.id === activeChatId);
                    if (currentChat && currentChat.unreadCount > 0) {
                      const isNearBottom = list.scrollSize - offset - list.viewportSize < 150;
                      if (isNearBottom) clearUnread(activeChatId);
                    }
                  }}
                  ref={viewportRef as any}

                >
                  {/* Top padding */}
                  <div className="h-4" />
                  
                  {chatMessages.map((msg, i) => (
                    <div key={msg.id} className="mb-4">
                      <MessageItem 
                        msg={msg}
                        isMe={msg.senderId === currentUser?.id}
                        showSender={msg.senderId !== currentUser?.id && (!chatMessages[i - 1] || chatMessages[i - 1].senderId !== msg.senderId)}
                        sender={msg.senderId === currentUser?.id ? currentUser : ((msg as any).sender || users.find((u: any) => u.id === msg.senderId))}
                      />
                    </div>
                  ))}
                  
                  {/* Bottom padding */}
                  <div className="h-4" />
                </VList>
              </div>

              {/* Input Area */}
              <ChatInput 
                onSendMessage={handleSendMessage} 
                disabled={!activeChatId}
              />
            </div>

            {/* Right Sidebar Column */}

            {isQuickActionsOpen && (
              <div className="flex-none w-64 border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto h-full">
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Участники</h3>

                    <div className="flex items-center gap-1">
                      {activeChat?.type === 'group' && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1"
                          onClick={() => setIsGroupAdminSettingsModalOpen(true)}>
                          <Settings className="w-3 h-3" /> Настройки
                        </Button>
                      )}
                      {activeChat?.type === 'direct' && activeChatId && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1"
                          onClick={() => {
                            setChatToDeleteId(activeChatId);
                            setIsDeleteDialogOpen(true);
                          }}>
                          <Trash2 className="w-3 h-3" /> Удалить
                        </Button>
                      )}
                      {activeChat?.type === 'group' && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1"
                          onClick={() => { setIsGroupMode(true); setSelectedParticipants(activeChat.participants.filter(id => id !== currentUser?.id)); setIsNewChatModalOpen(true); }}>
                          <UserPlus className="w-3 h-3" /> Добавить
                        </Button>
                      )}
                    </div>
                  </div>
                  {activeChat.type === 'group' ? (
                    <div className="space-y-2">
                      {Array.from(new Set(activeChat.participants)).map(participantId => {
                        const participant = users.find(u => u.id === participantId);
                        if (!participant) return null;
                        return (
                          <div key={participantId} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all">
                            <UserAvatar avatarUrl={participant.avatar} name={participant.name} sizeClass="w-8 h-8" textClass="text-[10px]" />
                            <div className="min-w-0"><p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{participant.name}</p><p className="text-[10px] text-slate-500 truncate">{participant.position || 'Пользователь'}</p></div>
                          </div>
                        );
                      })}
                    </div>
                  ) : activeChatDirectoryInfo ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                      <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner shrink-0"><UserIcon className="w-6 h-6" /></div><div className="min-w-0"><p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{activeChatDirectoryInfo.name}</p><p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate mt-0.5">{activeChatDirectoryInfo.position}</p></div></div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="space-y-2"><div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Building className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] font-medium truncate">{activeChatDirectoryInfo.department}</span></div><div className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span className="text-[11px] font-medium">Кабинет {activeChatDirectoryInfo.cabinet}</span></div></div>
                        <div className="grid grid-cols-1 gap-2 pt-2">
                          <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/50" onClick={() => handleContactAction('call', activeChatDirectoryInfo.internalPhone)}><Phone className="w-3.5 h-3.5" /> Вн. {activeChatDirectoryInfo.internalPhone}</Button>
                          {activeChatDirectoryInfo.mobilePhone && <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-transparent hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => handleContactAction('call', activeChatDirectoryInfo.mobilePhone!)}><Smartphone className="w-3.5 h-3.5" /> Позвонить</Button>}
                          {activeChatDirectoryInfo.telegram && <Button variant="secondary" size="sm" className="h-9 text-[11px] font-bold gap-2 bg-[#0088cc15] text-[#0088cc] dark:text-[#33aaff] border-transparent hover:bg-[#0088cc25]" onClick={() => handleContactAction('telegram', activeChatDirectoryInfo.telegram!)}><SendHorizontal className="w-3.5 h-3.5" /> Telegram</Button>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 text-center shadow-sm"><div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-slate-300" /></div><p className="text-[11px] text-slate-400 leading-relaxed px-2">Выберите личный чат для просмотра контактов</p></div>
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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6"><MessageSquare className="w-10 h-10 opacity-20" /></div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Выберите чат</h3>
            <p className="max-w-xs text-sm">Выберите чат из списка слева или начните новый поиск пользователя</p>
          </div>
        )}
      </div>

      <Dialog open={isNewChatModalOpen} onOpenChange={(open) => { setIsNewChatModalOpen(open); if (!open) { setExpandedPersonId(null); setIsGroupMode(false); setSelectedParticipants([]); setGroupName(''); } }}>
        <DialogContent className="max-w-[440px] bg-white dark:bg-slate-900 p-0 overflow-hidden border-0 shadow-2xl rounded-[32px] gap-0">
          <div className="p-6 pb-4 flex flex-col items-center relative">
            <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase mt-2">
              Новое сообщение или группа
            </h2>
          </div>

          <div className="px-6 space-y-4">
            {/* Toggle Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner">
              <button 
                onClick={() => { setIsGroupMode(false); setSelectedParticipants([]); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  !isGroupMode ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md" : "text-slate-500"
                )}
              >
                <MessageSquare className="w-4 h-4" /> Чат
              </button>
              <button 
                onClick={() => setIsGroupMode(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                  isGroupMode ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md" : "text-slate-500"
                )}
              >
                <Users className="w-4 h-4" /> Группа
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Поиск коллег, отделов..." 
                className="pl-11 bg-slate-50 dark:bg-slate-800/50 border-0 h-12 rounded-2xl text-sm placeholder:text-slate-400" 
                value={userSearchQuery} 
                onChange={(e) => { setUserSearchQuery(e.target.value); setExpandedPersonId(null); }} 
              />
            </div>

            {/* Selected Participants Row */}
            {isGroupMode && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap gap-2 items-center">
                  {selectedParticipants.map(id => {
                    const u = users.find(user => user.id === id);
                    const initials = u?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
                    return (
                      <div key={id} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 pl-1 pr-2 py-1 rounded-xl group transition-all hover:border-blue-300">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white relative">
                          {initials}
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 border border-white rounded-full flex items-center justify-center">
                            <Check className="w-1.5 h-1.5 text-white" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{u?.name?.split(' ')[0]}</span>
                        <button onClick={() => toggleParticipant(id)} className="text-blue-400 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] font-medium text-slate-500 pl-1">
                  Участников выбрано: {selectedParticipants.length}
                </p>
              </div>
            )}

            {/* List */}
            <ScrollArea className="h-[400px] -mx-2 px-2 custom-scrollbar">
              <div className="space-y-1 pb-4">
                {filteredDirectoryEntries.map((entry) => {
  const initials = entry.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?';
  const isSelected = selectedParticipants.includes(entry.id);
  const reg = isUserRegistered(entry);
  const isExpanded = expandedPersonId === entry.id;

                  return (
                    <div 
                      key={entry.id} 
                      className={cn(
                        "group rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden",
                        isSelected 
                          ? "bg-white dark:bg-slate-800 border border-blue-400/50 shadow-sm" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isGroupMode) {
                          if (reg) toggleParticipant(entry.id);
                        } else {
                          if (reg) setExpandedPersonId(isExpanded ? null : entry.id);
                        }
                      }}
                    >
                      <div className="p-3 flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm",
                            isSelected ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                          )}>
                            {initials}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {entry.position}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] text-slate-400 truncate">
                              {entry.department}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand for Direct Chat */}
                      {!isGroupMode && isExpanded && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex gap-4 text-[10px] text-slate-500 font-medium px-1">
                              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Каб. {entry.cabinet}</span>
                              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Вн. {entry.internalPhone}</span>
                            </div>
                            <Button 
                              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-2 shadow-lg shadow-blue-500/20" 
                              onClick={() => handleCreateDirectChat(entry)}
                            >
                              Написать сообщение
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="p-6 pt-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <Button 
              variant="ghost" 
              onClick={() => setIsNewChatModalOpen(false)} 
              className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
            >
              Закрыть
            </Button>
            {isGroupMode ? (
              <Button 
                className={cn(
                  "h-12 px-8 rounded-full font-bold text-sm text-white shadow-xl transition-all flex items-center gap-2",
                  selectedParticipants.length > 0 
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-105 shadow-blue-500/30" 
                    : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50"
                )}
                onClick={handleCreateGroupChat} 
                disabled={selectedParticipants.length < 1}
              >
                <UserPlus className="w-5 h-5" />
                {activeChat?.type === 'group' ? 'Добавить участника' : 'Создать группу'}
                <Sparkles className="w-3 h-3 text-blue-100" />
              </Button>
            ) : null}
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

      {/* Group Avatar Editor Dialog (from ProfileScreen style) */}
      <Dialog open={showAvatarEditor} onOpenChange={(open) => {
          if (!open) {
            setShowAvatarEditor(false);
            setTempAvatar(null);
          }
        }}>
          <DialogContent className="max-w-[460px] p-0 overflow-hidden border-none bg-[#F2F2F7] dark:bg-black rounded-[32px] shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Редактирование аватара группы</DialogTitle>
            </DialogHeader>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <button 
                onClick={() => {
                  setShowAvatarEditor(false);
                  setTempAvatar(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex gap-1">
                <button className="px-4 py-1 rounded-full bg-white dark:bg-slate-700 text-xs font-bold shadow-sm">Аватар</button>
                <button className="px-4 py-1 rounded-full text-xs font-bold text-slate-400">Постер</button>
              </div>

              <button 
                onClick={handleSaveAvatar}
                disabled={!tempAvatar || isUpdatingAvatar}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  tempAvatar ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-300"
                )}
              >
                {isUpdatingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-8">
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              
              {/* Preview Circle */}
              <div className="relative group">
                <div className="w-48 h-48 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl">
                  <UserAvatar 
                    avatarUrl={tempAvatar || activeChat?.avatar} 
                    name={activeChat?.name || 'Группа'} 
                    sizeClass="w-full h-full" 
                    textClass="text-7xl"
                    className="border-0"
                    isGroup={true}
                  />
                </div>
                
                {(tempAvatar || activeChat?.avatar) && (
                  <button 
                    onClick={handleResetAvatar}
                    className="absolute -top-1 -right-1 w-8 h-8 bg-slate-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors border-2 border-white dark:border-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <button className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-900 dark:text-white">
                Настроить
              </button>

              {/* Grid Options (iOS Style) */}
              <div className="w-full space-y-6 overflow-y-auto max-h-[300px] px-6 py-2 custom-scrollbar">
                {/* Photo Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Фото &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6" />
                    </button>
                    {/* Empty history for now, can be added later if needed */}
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="aspect-square rounded-full bg-slate-300/30 dark:bg-slate-700/30 overflow-hidden" />
                    ))}
                  </div>
                </div>

                {/* Memoji Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Memoji &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Smile className="w-6 h-6" />
                    </button>
                    {memojis.map((emoji, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setTempAvatar(emoji)}
                        className={cn(
                          "aspect-square rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110",
                          idx % 4 === 0 ? "bg-blue-100" : idx % 4 === 1 ? "bg-amber-100" : idx % 4 === 2 ? "bg-emerald-100" : "bg-rose-100",
                          tempAvatar === emoji && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monogram Row */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Монограмма &gt;</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <button className="aspect-square rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Aa</button>
                    {monogramColors.map((color, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setTempAvatar(`monogram:${color}`)}
                        className={cn(
                          "aspect-square rounded-full flex items-center justify-center text-xl font-bold text-white transition-all hover:scale-110",
                          color,
                          tempAvatar === `monogram:${color}` && "ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-black"
                        )}
                      >
                        {(activeChat?.name || 'Г').charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
         </Dialog>
      {activeChatId && (
       <GroupSettingsModal
          isOpen={isGroupAdminSettingsModalOpen}
          onClose={() => setIsGroupAdminSettingsModalOpen(false)}
          chatId={activeChatId}
        />
      )}

       <ChatSecurityModal 
         isOpen={showSecurityModal} 
         onClose={handleCloseSecurityModal} 
       />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены, что хотите удалить этот чат?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Вся история переписки будет безвозвратно удалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (chatToDeleteId) {
                await deleteChat(chatToDeleteId);
                setIsDeleteDialogOpen(false);
                setChatToDeleteId(null);
              }
            }} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
     </div>
   );
 }
