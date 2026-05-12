import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { chatService } from '@/api/chat';
import { cryptoUtils } from '@/utils/cryptoUtils';
import { sanitizeText, isZalgo } from '@/lib/utils';
import { toast as sonnerToast } from 'sonner';

import { useNotificationStore } from './notificationStore';

export interface ChatMessage {
  id: string;
  chatId: string;
  chatName?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRealName?: string;
  createdAt: string;
  timestamp?: string;
  isSystem?: boolean;
  creatorId?: string; // Добавляем creatorId
}

interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  avatar?: string | null;
  isPinned?: boolean;
  isMuted?: boolean;
  isAutoNamed?: boolean;
  creatorId?: string; // Добавляем creatorId
  adminIds?: string[]; // Добавляем adminIds для группы
}

interface ChatStore {
  chats: Chat[];
  messages: ChatMessage[];
  activeChatId: string | null;
  socket: Socket | null;
  isLoading: boolean;
  showDirectoryUsers: boolean;
  
  initSocket: () => void;
  disconnectSocket: () => void;
  authenticateSocket: (token: string) => void;
  fetchMessages: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, text: string, senderId: string, senderName: string, recipientName: string) => Promise<void>;
  createDirectChat: (participantId: string, name: string) => Promise<string>;
  /** Личный чат → группа с сохранением истории */
  promoteDirectToGroup: (
    sourceChatId: string,
    additionalParticipantIds: string[],
    groupName?: string
  ) => Promise<string>;
  createGroupChat: (participantIds: string[], name: string, existingChatId?: string) => Promise<string>;
  addMessage: (message: ChatMessage) => void;
  clearUnread: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  leaveChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteGroup: (chatId: string, masterPassword?: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<boolean>;
  updateChatAvatar: (chatId: string, avatar: string | null) => Promise<boolean>;
  deleteChatLocally: (chatId: string) => void;
  setShowDirectoryUsers: (show: boolean) => void;
  setGroupAdmin: (chatId: string, userId: string) => Promise<boolean>;
  removeParticipant: (chatId: string, userIdToRemove: string, masterPassword?: string) => Promise<boolean>;
}

/** Разбор chat_<id1>_<id2> — id собеседника (в т.ч. для системных сообщений без receiverId). */
function otherParticipantFromDirectChatId(chatId: string, myId: string): string | null {
  if (!chatId.startsWith('chat_')) return null;
  const rest = chatId.slice('chat_'.length);
  const sep = rest.indexOf('_');
  if (sep === -1) return null;
  const id1 = rest.slice(0, sep);
  const id2 = rest.slice(sep + 1);
  if (id1 === myId) return id2;
  if (id2 === myId) return id1;
  return null;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
  chats: [],
  messages: [],
  activeChatId: null,
  socket: null,
  isLoading: false,
  showDirectoryUsers: false,

  initSocket: () => {
    if (get().socket) {
      return;
    }

    // NUCLEAR OPTION: Ignore .env and use browser location for everything
    const socketUrl = import.meta.env.VITE_SOCKET_URL || `http://localhost:3000`; // Fallback for dev

    console.log('[Socket] NUCLEAR CONNECT:', socketUrl);
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    });

    // Debug globally
    (window as any).chatSocket = socket;
    (window as any).testNotification = () => {
      sonnerToast('Тестовое уведомление', {
        description: 'Если вы это видите, уведомления работают!',
        position: 'bottom-right',
      });
    };

    // Re-authenticate on every connection/reconnection
    socket.on('connect', () => {
      console.log('Socket connected, authenticating...');
      const token = localStorage.getItem('auth_token');
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('chat:message', async (message: ChatMessage) => {
      console.log('[Socket] New message received:', message);
      // Check if message is for us or from us
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      if (!currentUser) {
        console.log('[Socket] No current user found, skipping message');
        return;
      }

      // SECURITY: Check if this message is actually for us (if it's a direct message)
          const msgReceiverId = (message as any).receiverId;
          if (msgReceiverId && msgReceiverId !== currentUser.id && message.senderId !== currentUser.id) {
            console.warn('[Socket] Security Alert: Received message intended for another user!', {
              receiverId: msgReceiverId,
              myId: currentUser.id
            });
            return;
          }

          // SECURITY: If it's a group message, check if we are still a participant
          if (message.chatId && message.chatId.startsWith('group_')) {
            const chat = get().chats.find(c => c.id === message.chatId);
            if (chat && !chat.participants.includes(currentUser.id)) {
              console.log('[Socket] Ignoring message for group user has left:', message.chatId);
              return;
            }
          }

          // Check for duplicate messages to avoid multiple notifications
          const isDuplicate = get().messages.some(m => m.id === message.id);
      if (isDuplicate) {
        console.log('[Socket] Duplicate message ignored:', message.id);
        return;
      }

      // Normalize message properties (server sends 'sender', client expects 'senderName')
      const normalizedMessage = {
        ...message,
        senderName: message.senderName || (message as any).sender?.name || 'Пользователь',
        receiverName: (message as any).receiverName || (message as any).receiver?.name || 'Пользователь'
      };

      // Расшифровка текста сообщения (если зашифровано)
      let displayText = normalizedMessage.text;
      if (displayText && displayText.startsWith('[ENC]')) {
        // Мы не санитизируем зашифрованный блоб, санитизация должна быть перед шифрованием на стороне отправителя
        // Но для безопасности можно санитизировать результат расшифровки
        displayText = cryptoUtils.decryptMessage(displayText, message.chatId);
      } else if (message.isSystem && displayText) {
            // Handle system messages early to avoid unnecessary sanitization or issues
            if (displayText.startsWith('[GROUP_CREATED]|')) {
              const parts = displayText.split('|');
              displayText = `Группа "${parts[1]}" создана`;
            } else if (displayText.startsWith('[GROUP_UPDATED]|')) {
              const parts = displayText.split('|');
              displayText = `Участники добавлены в "${parts[1]}"`;
            } else if (displayText.startsWith('[USER_LEFT_GROUP]|')) {
              const parts = displayText.split('|');
              displayText = `Пользователь ${parts[1]} покинул группу`;
            } else if (displayText.startsWith('[DIRECT_CREATED]|')) {
              displayText = `Чат начат`;
            } else if (displayText.startsWith('[GROUP_AVATAR_CHANGED]|')) {
              displayText = `Аватар группы изменен`;
            }
          } else {
        // Если не зашифровано, санитизируем обычный текст
        displayText = sanitizeText(displayText);
      }
      
      normalizedMessage.text = displayText;

      // Handle direct chat ID matching
      let targetChatId = normalizedMessage.chatId;
      
      // If it's a direct message (has receiverId), use consistent chatId
      const participantId = normalizedMessage.senderId === currentUser.id ? msgReceiverId : normalizedMessage.senderId;

      if (msgReceiverId || normalizedMessage.chatId.startsWith('chat_')) {
        if (participantId) {
          targetChatId = `chat_${[currentUser.id, participantId].sort().join('_')}`;
        }
      }

      // Add message to state (this now handles chat creation and unread counting)
      get().addMessage({ ...normalizedMessage, chatId: targetChatId });
      
      // ПРОВЕРКА: Если нас нет в списке участников этого чата (и это не общий чат), не показываем уведомление
      const chat = get().chats.find(c => c.id === targetChatId);
      const isUserParticipant = targetChatId === 'public' || chat?.participants.includes(currentUser.id);
      
      if (!isUserParticipant) {
        console.log('[Socket] User is not a participant of this chat, skipping notification');
        return;
      }

      // Add notification for new message if it's from someone else AND not the active chat
      if (normalizedMessage.senderId !== currentUser.id && get().activeChatId !== targetChatId) {
        // ПРОВЕРКА: Если чат на беззвучном режиме, уведомление не показываем
        if (chat?.isMuted) {
          console.log('[Socket] Chat is muted, skipping notification');
          return;
        }

        console.log('[Socket] Triggering notification for:', normalizedMessage.senderName);
        
        // Throttling notifications for the same message ID to avoid duplicates
        const lastNotifyId = (window as any)._lastNotifyId;
        if (lastNotifyId === message.id) {
          console.log('[Socket] Notification already shown for this message ID');
          return;
        }
        (window as any)._lastNotifyId = message.id;

        sonnerToast(normalizedMessage.senderName || 'Новое сообщение', {
          description: normalizedMessage.text,
          duration: 5000,
          position: 'bottom-right',
          action: {
            label: 'Ответить',
            onClick: () => {
              // Находим chatId и устанавливаем его активным
              get().setActiveChat(targetChatId);
              
              // Если мы не на странице чата, переходим на неё
              if (!window.location.pathname.startsWith('/chat')) {
                window.location.href = `/chat?activeChatId=${targetChatId}`;
              }
              // Если уже на странице чата, setActiveChat выше уже сработал,
              // но на мобилках может потребоваться закрыть сайдбар, что произойдет автоматически
              // при обновлении activeChatId в сторе.
            }
          }
        });
      }
    });

    socket.on('chat:deleted', ({ chatId, deletedBy, deletedById }: { chatId: string, deletedBy?: string, deletedById?: string }) => {
      console.log(`[Socket] Received chat:deleted event for ${chatId} by ${deletedBy}`);
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      
      // Local deletion
      get().deleteChatLocally(chatId);

      // Notification logic with grouping/throttling
      if (deletedById !== currentUser?.id) {
            // Group multiple deletions into one notification if they happen rapidly
            const now = Date.now();
            const lastTime = (window as any)._lastDeleteToastTime || 0;
            
            if (now - lastTime < 2000) {
              // If less than 2s passed, update existing or just skip to avoid spam
              return; 
            }
            
            (window as any)._lastDeleteToastTime = now;

            const isGroup = chatId.startsWith('group_') || chatId === 'public';
            sonnerToast.info(`${isGroup ? 'Групповой чат' : 'Чат'} удален пользователем ${deletedBy || 'собеседник'}`, {
              description: 'История сообщений была очищена.',
              duration: 5000,
            });
          }
        });

        socket.on(
          'chat:direct_upgraded',
          async (payload: {
            sourceChatId: string;
            newGroupId: string;
            name: string;
            participants: string[];
            upgradeByUserId?: string;
          }) => {
            const me = (window as any).useAuthStore?.getState()?.user?.id;
            set(state => ({
              chats: state.chats.filter(c => c && c.id !== payload.sourceChatId),
              messages: state.messages.filter(m => m.chatId !== payload.sourceChatId),
              activeChatId:
                state.activeChatId === payload.sourceChatId
                  ? payload.newGroupId
                  : state.activeChatId
            }));
            await get().fetchMessages();
            if (payload.upgradeByUserId && payload.upgradeByUserId !== me) {
              sonnerToast.info('Чат преобразован в группу', {
                description: payload.name,
                duration: 4500
              });
            }
          }
        );

        socket.on('chat:renamed', ({ chatId, newName }: { chatId: string, newName: string }) => {
          console.log(`[Socket] Chat ${chatId} renamed to ${newName}`);
          const isGroup = chatId.startsWith('group_') || chatId === 'public';
          
          sonnerToast.info(`${isGroup ? 'Групповой чат' : 'Чат'} переименован`, {
            description: `Новое название: ${newName}`,
            duration: 4000
          });

          set(state => ({
            chats: state.chats.map(c => c.id === chatId ? { ...c, name: newName, isAutoNamed: false } : c)
          }));
        });

        socket.on('chat:participant_left', ({ chatId, userId }: { chatId: string, userId: string }) => {
          console.log(`[Socket] User ${userId} left chat ${chatId}`);
          
          const currentUser = (window as any).useAuthStore?.getState()?.user;
          if (currentUser?.id === userId) {
            // Если это МЫ вышли, удаляем чат из нашего списка
            get().deleteChatLocally(chatId);
          } else {
            // Если вышел кто-то другой, обновляем список участников
            set(state => ({
              chats: state.chats.map(c => 
                c.id === chatId 
                  ? { ...c, participants: c.participants.filter(p => p !== userId) } 
                  : c
              )
            }));
          }
        });

    socket.on('chat:avatar_updated', ({ chatId, avatar }: { chatId: string, avatar: string | null }) => {
      console.log(`[Socket] Chat ${chatId} avatar updated`);
      
      set(state => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, avatar } : c)
      }));
    });

    socket.on('user_deactivated', ({ userId }: { userId: string }) => {
      // Proactively log out if we know the ID.
      try {
        const authState = (window as any).useAuthStore?.getState();
        if (authState?.user?.id === userId) {
          // Add notification to store before logout (though it might be lost on redirect)
          useNotificationStore.getState().addNotification({
            title: 'Доступ ограничен',
            message: 'Ваша учетная запись деактивирована администратором.',
            type: 'error',
          });

          // Показываем уведомление перед разлогином
          sonnerToast.error('Доступ к системе ограничен', {
            description: 'Ваша учетная запись деактивирована администратором.',
            duration: 5000,
          });

          // Небольшая задержка, чтобы пользователь успел прочитать
          setTimeout(() => {
            localStorage.removeItem('auth_token');
            window.location.href = '/login?error=deactivated';
          }, 1500);
        }
      } catch (e) {
        // Fallback or ignore
      }
    });

    socket.on('user_status_change', ({ userId, isOnline }: { userId: string, isOnline: boolean }) => {
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      
      // Add notification for status change
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      if (currentUser && currentUser.id !== userId && currentUser.notificationsEnabled) {
        // We need the user name, but we only have userId here. 
        // We can get it from roleStore if needed, or just show a generic message for now.
        const users = (window as any).useRoleStore?.getState()?.users || [];
        const changedUser = users.find((u: any) => u.id === userId);
        
        if (changedUser) {
          useNotificationStore.getState().addNotification({
            title: isOnline ? 'Пользователь в сети' : 'Пользователь вышел',
            message: `${changedUser.name} теперь ${isOnline ? 'в сети' : 'не в сети'}`,
            type: 'system',
          });
        }
      }
      
      const event = new CustomEvent('user_status_updated', { detail: { userId, isOnline } });
      window.dispatchEvent(event);
    });

    socket.on('new_registration_request', (request: any) => {
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      if (currentUser && currentUser.role === 'admin') {
        useNotificationStore.getState().addNotification({
          title: 'Новая заявка на доступ',
          message: `${request.name} (${request.department}) запрашивает доступ к системе`,
          type: 'warning',
        });
      }
    });

    socket.on('ticket_updated', (ticket: any) => {
      console.log('Ticket update received through socket:', ticket);
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      
      // Обновляем список заявок в ticketStore, если он существует
      try {
        const ticketStore = (window as any).useTicketStore?.getState();
        if (ticketStore) {
          console.log('Updating ticket in ticketStore:', ticket.id);
          ticketStore.fetchTickets(); // Самый надежный способ - перекачать актуальный список
        }
      } catch (e) {
        console.error('Failed to update ticketStore:', e);
      }
      
      if (currentUser && (
        currentUser.id === ticket.authorId || 
        currentUser.id === ticket.assigneeId || 
        currentUser.role === 'admin' || 
        currentUser.role === 'technician'
      )) {
        // Если это не сам текущий пользователь обновил заявку
        // (Мы не хотим уведомлять админа о его собственных действиях)
        // Но если он автор, и кто-то другой обновил - тогда надо.
        
        let title = `Заявка #${ticket.number} обновлена`;
        let message = `Статус: ${ticket.status}`;

        if (currentUser.id === ticket.assigneeId) {
          title = 'Вам назначена заявка';
          message = `Заявка #${ticket.number}: ${ticket.title}`;
        }

        useNotificationStore.getState().addNotification({
          title,
          message,
          type: 'info',
        });
      }
    });

    socket.on('inventory_low_stock', (item: any) => {
      console.log('Low stock alert received:', item);
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      
      // Notify admins and technicians if they have notifications enabled
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'technician') && currentUser.notificationsEnabled) {
        useNotificationStore.getState().addNotification({
          title: 'Мало товаров на складе',
          message: `Товар "${item.name}" (SKU: ${item.sku}) заканчивается. Осталось: ${item.quantity} ${item.unit || 'шт.'}`,
          type: 'warning',
        });
        
        // Also show a toast for immediate feedback
        sonnerToast.warning('Заканчивается товар', {
          description: `${item.name}: осталось ${item.quantity}`,
          duration: 5000,
        });
      }
    });

    socket.on('new_comment', ({ comment }: { ticketId: string, comment: any }) => {
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      if (currentUser && currentUser.id !== comment.authorId) {
        useNotificationStore.getState().addNotification({
          title: 'Новый комментарий',
          message: `${comment.author.name}: ${comment.text}`,
          type: 'info',
        });
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        socket.emit('logout', token);
      }
      socket.disconnect();
      set({ socket: null });
    }
  },

  authenticateSocket: (token: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('authenticate', token);
    } else {
      get().initSocket();
    }
  },

  fetchMessages: async () => {
        set({ isLoading: true });
        try {
          const rawMessages = await chatService.getMessages();
          const currentUser = (window as any).useAuthStore?.getState()?.user;
          
          if (!currentUser) {
            set({ messages: [], isLoading: false });
            return;
          }

          const newChatsMap = new Map<string, any>();
          const chatNamesFromSystemMessages = new Map<string, string>();
          const chatAvatarsFromSystemMessages = new Map<string, string | null>();
          const chatParticipantsFromSystemMessages = new Map<string, string[]>();

          // First pass: Find all rename, avatar and creation system messages to get the latest names, avatars and participants
          rawMessages.forEach((m: any) => {
            if (m.isSystem) {
              const chatId = m.chatId || 'public';
              const msgTime = new Date(m.timestamp || m.createdAt).getTime();
              const existingNameTime = (m as any)._nameTime || 0;
              const existingAvatarTime = (m as any)._avatarTime || 0;

              if (m.text.includes('Группа переименована в "')) {
                const match = m.text.match(/Группа переименована в "([^"]+)"/);
                if (match && match[1] && msgTime > existingNameTime) {
                  chatNamesFromSystemMessages.set(chatId, match[1]);
                  (m as any)._nameTime = msgTime;
                }
              } else if (m.text.startsWith('[GROUP_AVATAR_CHANGED]|')) {
                const avatarData = m.text.split('|')[1] || null;
                if (msgTime > existingAvatarTime) {
                  chatAvatarsFromSystemMessages.set(chatId, avatarData);
                  (m as any)._avatarTime = msgTime;
                }
              } else if (m.text.startsWith('[GROUP_CREATED]|') || m.text.startsWith('[GROUP_UPDATED]|')) {
                const parts = m.text.split('|');
                if (parts.length >= 3) {
                  const groupName = parts[1];
                  const participants = parts[2].split(',');
                  
                  if (msgTime > existingNameTime) {
                    chatNamesFromSystemMessages.set(chatId, groupName);
                    chatParticipantsFromSystemMessages.set(chatId, participants);
                    (m as any)._nameTime = msgTime;
                  }
                }
              } else if (m.text.startsWith('[USER_LEFT_GROUP]|')) {
                // Handle user leaving in history pass
                const participants = chatParticipantsFromSystemMessages.get(chatId) || [];
                if (participants.length > 0 && m.senderId) {
                  const updatedParticipants = participants.filter(id => id !== m.senderId);
                  chatParticipantsFromSystemMessages.set(chatId, updatedParticipants);
                }
              } else if (m.text.includes('создал группу "')) {
                // Legacy format support
                const match = m.text.match(/создал группу "([^"]+)"/);
                if (match && match[1] && msgTime > existingNameTime) {
                  chatNamesFromSystemMessages.set(chatId, match[1]);
                  (m as any)._nameTime = msgTime;
                }
              }
            }
          });

          // Map raw messages to include chatId and DECRYPT them
          const messages = rawMessages.map((m: any) => {
            // Собеседник в личке: receiverId/senderId или разбор chat_ из БД (старые DIRECT_CREATED)
            let participantId =
              m.senderId === currentUser.id ? m.receiverId : m.receiverId ? m.senderId : null;
            if (!participantId && m.chatId?.startsWith('chat_')) {
              const other = otherParticipantFromDirectChatId(m.chatId, currentUser.id);
              if (other) participantId = other;
            }
            
            let chatId = m.chatId || 'public';
            if (participantId) {
              chatId = `chat_${[currentUser.id, participantId].sort().join('_')}`;
            } else if (!m.chatId || m.chatId === 'public') {
              chatId = 'public';
            }

            // Расшифровка текста сообщения
            if (m.text && m.text.startsWith('[ENC]')) {
              m.text = cryptoUtils.decryptMessage(m.text, chatId);
            }
            m.timestamp = m.timestamp || m.createdAt;

            // Resolve name
            let chatName = 'Чат';
            if (participantId) {
              if (m.senderId !== currentUser.id) {
                chatName = m.senderName || m.sender?.name || 'Пользователь';
              } else {
                // If we are sender, try to find receiver name from backend-provided receiver object
                chatName = m.receiver?.name || m.receiverName || 'Пользователь';
                
                // Fallback to directory/role store if still missing
                if (chatName === 'Пользователь') {
                  const receiver = (window as any).useRoleStore?.getState()?.users.find((u: any) => u.id === m.receiverId);
                  chatName = receiver?.name || 'Чат';
                }
              }

              const lastMessageTime = m.timestamp || m.createdAt;

              // Превью в списке: не показывать сырое [DIRECT_CREATED]|...
              let directListPreview = m.text;
              if (m.text?.startsWith('[DIRECT_CREATED]|')) {
                directListPreview = 'Чат начат';
              }

              // Update newChatsMap with the LATEST data for this chatId
              const existingChatInState = get().chats.find(c => c.id === chatId);
              const existingChatInMap = newChatsMap.get(chatId);
              
              if (!existingChatInMap || new Date(lastMessageTime) > new Date(existingChatInMap.lastMessageTime)) {
                newChatsMap.set(chatId, {
                  id: chatId,
                  name: chatName,
                  type: 'direct',
                  participants: [currentUser.id, participantId],
                  // Preserve unread count from state if it exists, otherwise 0
                  unreadCount: chatId === get().activeChatId ? 0 : (existingChatInState?.unreadCount || 0),
                  avatar: chatAvatarsFromSystemMessages.get(chatId) || m.chatAvatar || existingChatInState?.avatar,
                  lastMessage: directListPreview,
                  lastMessageTime: lastMessageTime
                });
              }
            } else {
              // Group or Public chat
              const lastMessageTime = m.timestamp || m.createdAt;
              const isPublic = chatId === 'public';
              
              // Resolve name
              let chatName = chatNamesFromSystemMessages.get(chatId) || m.chatName;
              let isAutoNamed = false;

              if (!chatName) {
                if (isPublic) {
                  chatName = 'Общий чат';
                } else {
                  // Reconstruct auto-name from participants
                  const participants = chatParticipantsFromSystemMessages.get(chatId) || m.participants || [];
                  
                  if (participants.length > 0) {
                    const users = (window as any).useRoleStore?.getState()?.users || [];
                    const names = participants
                      .map((id: string) => {
                        const u = users.find((user: any) => user.id === id);
                        return u?.name?.split(' ')[0] || null;
                      })
                      .filter(Boolean);
                    
                    if (names.length > 0) {
                      chatName = names.join(', '); // NO "Групповой чат: " prefix here!
                      isAutoNamed = true;
                    } else {
                      chatName = 'Групповой чат';
                    }
                  } else {
                    chatName = 'Групповой чат';
                  }
                }
              } else if (!isPublic && !chatNamesFromSystemMessages.has(chatId)) {
                // Если имя содержит "Групповой чат:", считаем его авто-именем и очищаем префикс
                if (chatName.includes('Групповой чат:')) {
                  chatName = chatName.replace('Групповой чат:', '').trim();
                  isAutoNamed = true;
                }
              }
              
              const existingChatInState = get().chats.find(c => c.id === chatId);
              const existingChatInMap = newChatsMap.get(chatId);
              
              // ПРИОРИТЕТ: Всегда собираем участников из всех доступных источников
              const allParticipants = Array.from(new Set([
                ...(chatParticipantsFromSystemMessages.get(chatId) || []),
                ...(m.participants || []),
                ...(existingChatInMap?.participants || []),
                ...(existingChatInState?.participants || [])
              ])).filter(Boolean);

              // Resolve last message text for preview
              let lastMessageText = m.text;
              const rawSystemTextForMeta = m.isSystem ? m.text : '';
              if (m.isSystem && m.text) {
                if (m.text.startsWith('[GROUP_CREATED]|')) {
                  const parts = m.text.split('|');
                  lastMessageText = `Группа "${parts[1]}" создана`;
                } else if (m.text.startsWith('[GROUP_UPDATED]|')) {
                   const parts = m.text.split('|');
                   lastMessageText = `Участники добавлены в "${parts[1]}"`;
                 } else if (m.text.startsWith('[USER_LEFT_GROUP]|')) {
                   const parts = m.text.split('|');
                   lastMessageText = `Пользователь ${parts[1]} покинул группу`;
                 } else if (m.text.startsWith('[DIRECT_CREATED]|')) {
                  lastMessageText = `Чат начат`;
                } else if (m.text.startsWith('[GROUP_AVATAR_CHANGED]|')) {
                  lastMessageText = `Аватар группы изменен`;
                }
                
                // ВАЖНО: Обновляем текст самого сообщения, чтобы в истории тоже был нормальный текст
                m.text = lastMessageText;
              }

              if (!existingChatInMap || new Date(lastMessageTime) > new Date(existingChatInMap.lastMessageTime)) {
                let effectiveAvatar = chatAvatarsFromSystemMessages.get(chatId) || m.chatAvatar || existingChatInState?.avatar;
                if (effectiveAvatar === 'null' || effectiveAvatar === 'undefined') effectiveAvatar = undefined;

                // ВАЖНО: Добавляем чат только если текущий пользователь является его участником (или это общий чат)
                const isUserParticipant = isPublic || allParticipants.includes(currentUser.id);
                
                if (isUserParticipant) {
                  newChatsMap.set(chatId, {
                    id: chatId,
                    name: chatName,
                    type: isPublic ? 'group' : 'group',
                    participants: allParticipants,
                    unreadCount: chatId === get().activeChatId ? 0 : (existingChatInState?.unreadCount || 0),
                    avatar: effectiveAvatar,
                    lastMessage: lastMessageText,
                    lastMessageTime: lastMessageTime,
                    isAutoNamed: isAutoNamed,
                    creatorId: m.creatorId || (rawSystemTextForMeta.startsWith('[GROUP_CREATED]|') ? m.senderId || undefined : undefined)
                  });
                } else {
                  // Если пользователя нет в списке участников, удаляем чат из карты (если он там был)
                  newChatsMap.delete(chatId);
                }
              } else if (allParticipants.length > existingChatInMap.participants.length) {
                // Если мы нашли больше участников в текущем сообщении, обновляем только их
                newChatsMap.set(chatId, {
                  ...existingChatInMap,
                  participants: allParticipants
                });
              }
            }

            return { ...m, chatId };
          });

          // Merge new chats into state
          set(state => {
            const currentChats = state.chats;
            const cleanedCurrentChats = currentChats.filter(c => c && c.id && !c.id.startsWith('chat-'));
            const updatedChats = [...cleanedCurrentChats];

            if (newChatsMap.size > 0) {
              newChatsMap.forEach((newChat, id) => {
                const idx = updatedChats.findIndex(c => c && c.id === id);
                if (idx !== -1) {
                  // Merge message data with existing chat (preserve pins, etc.)
                  // ВАЖНО: Приоритет объединения участников, чтобы не потерять их при частичном обновлении
                  const mergedParticipants = Array.from(new Set([
                    ...(updatedChats[idx].participants || []),
                    ...(newChat.participants || [])
                  ])).filter(Boolean);
                  
                  updatedChats[idx] = { 
                    ...updatedChats[idx], 
                    ...newChat,
                    participants: mergedParticipants 
                  };
                } else {
                  updatedChats.unshift(newChat);
                }
              });
            }

            return { 
              chats: updatedChats,
              messages,
              isLoading: false 
            };
          });
        } catch (error: any) {
          console.error('Fetch messages error:', error);
          set({ isLoading: false });
        }
      },

  setActiveChat: (chatId) => {
    set({ activeChatId: chatId });
    if (chatId) {
      get().clearUnread(chatId);
    }
  },

  sendMessage: async (chatId, text, senderId, _senderName, _recipientName) => {
        try {
          const trimmedText = text.trim();
          if (!trimmedText) return;

          // 1. Sanitize raw text BEFORE encryption
          const sanitizedText = sanitizeText(trimmedText);

          // 2. Enforce max length limit (4096 characters like Telegram)
          if (sanitizedText.length > 4096) {
            sonnerToast.error('Сообщение слишком длинное', {
              description: `Максимальная длина — 4096 символов. Сейчас: ${sanitizedText.length}`
            });
            return;
          }

          // 3. Prevent sending Zalgo text
          if (isZalgo(sanitizedText)) {
            sonnerToast.error('Обнаружены недопустимые символы', {
              description: 'Сообщение содержит вредоносный текст и было заблокировано.'
            });
            return;
          }

          // 4. Encrypt the sanitized text
          const encryptedText = cryptoUtils.encryptMessage(sanitizedText, chatId);

          // Find receiverId from chatId if it's a direct chat
          let receiverId: string | undefined;
          let effectiveChatId: string | undefined = chatId;
          let chatName: string | undefined;
          
          const chat = get().chats.find(c => c.id === chatId);
          if (chat) {
            chatName = chat.name;
            if (chat.type === 'direct') {
              receiverId = chat.participants.find(p => p !== senderId);
              effectiveChatId = undefined; // Let server generate direct chatId
            }
          }

          // 5. Send encrypted text to server
          await chatService.sendMessage(encryptedText, receiverId, effectiveChatId, chatName);
        } catch (error: any) {
          console.error('Send message error:', error);
        }
      },

  createDirectChat: async (participantId, name) => {
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        if (!currentUser) return '';

        const existingChat = get().chats.find(c => 
          c.type === 'direct' && c.participants.includes(participantId)
        );
        
        if (existingChat) {
          set({ activeChatId: existingChat.id });
          return existingChat.id;
        }

        const consistentId = `chat_${[currentUser.id, participantId].sort().join('_')}`;
        const newChat: Chat = {
          id: consistentId,
          name,
          type: 'direct',
          participants: [currentUser.id, participantId],
          unreadCount: 0
        };

        set(state => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChat.id
        }));

        // Notify server and other participant about new chat
        try {
          await chatService.notifyCreation(consistentId, 'direct', [currentUser.id, participantId], name);
        } catch (error) {
          console.error('Failed to notify chat creation:', error);
        }

        return newChat.id;
      },

  promoteDirectToGroup: async (sourceChatId, additionalParticipantIds, groupName) => {
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        if (!currentUser || additionalParticipantIds.length === 0) return '';

        try {
          const res = await chatService.upgradeDirectToGroup({
            sourceChatId,
            additionalParticipantIds,
            groupName: groupName?.trim() || undefined
          });
          if (!res?.success || !res.newGroupId) {
            sonnerToast.error('Не удалось преобразовать чат в группу');
            return '';
          }

          set(state => ({
            chats: state.chats.filter(c => c && c.id !== sourceChatId),
            messages: state.messages.filter(m => m.chatId !== sourceChatId),
            activeChatId:
              state.activeChatId === sourceChatId ? res.newGroupId : state.activeChatId
          }));

          await get().fetchMessages();
          return res.newGroupId;
        } catch (error: any) {
          console.error('promoteDirectToGroup:', error);
          sonnerToast.error('Не удалось преобразовать чат в группу', {
            description: error?.response?.data?.message || error?.message
          });
          return '';
        }
      },

  createGroupChat: async (newParticipantIds, name, existingChatId) => {
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        if (!currentUser) return '';

        try {
          let currentParticipants: string[] = [];
          // If existingChatId is provided, retrieve current participants from the existing chat
          if (existingChatId) {
            const existingChatInState = get().chats.find(c => c.id === existingChatId);
            if (existingChatInState) {
              currentParticipants = existingChatInState.participants;
            } else {
              // If existingChatId is provided but chat not found in state, this is an error or a fresh creation attempt for an existing chat.
              // For now, we'll treat it as if no participants exist, and proceed to add only the new ones.
              // A more robust solution might involve fetching participants from the backend if not found locally.
              console.warn(`[chatStore] existingChatId ${existingChatId} provided but chat not found in local state.`);
            }
          }
          
          // 1. Ensure currentUser is added but NOT duplicated
          const allUniqueParticipantIds = Array.from(new Set([
            currentUser.id,
            ...currentParticipants,
            ...newParticipantIds
          ])).sort();
          
          // 2. IMPORTANT: If existingChatId is provided, use it instead of searching/creating
          let groupId = existingChatId;
          
          if (!groupId) {
            // Generate a stable unique ID if no existing group
            groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          }

          // 3. Find if the group already exists in our state (to update it)
          const existingChatInState = get().chats.find(c => c.id === groupId);
          
          // If no name provided, generate one from participant names
          let finalName = name.trim();
          let isAutoNamed = false;

          if (!finalName) {
            isAutoNamed = true;
            const users = (window as any).useRoleStore?.getState()?.users || [];
            const names = allUniqueParticipantIds
              .map(id => {
                const u = users.find((user: any) => user.id === id);
                return u?.name?.split(' ')[0] || null;
              })
              .filter(Boolean);
            
            // ВАЖНО: Теперь просто имена, без префикса
            finalName = names.length > 0 ? names.join(', ') : 'Групповой чат';
          }

          if (existingChatInState) {
            // Update existing group instead of creating a new one
            set(state => ({
              chats: state.chats.map(c => c.id === groupId ? {
                ...c,
                name: finalName,
                participants: allUniqueParticipantIds,
                isAutoNamed
              } : c),
              activeChatId: groupId,
              // Force activeChat to be available for UI immediately
              messages: [...state.messages] 
            }));
          } else {
            // Create new group object
            const newChat: Chat = {
              id: groupId,
              name: finalName,
              type: 'group',
              participants: allUniqueParticipantIds,
              unreadCount: 0,
              isAutoNamed,
              creatorId: currentUser.id, // Добавляем creatorId
            };

            set(state => ({
              chats: [newChat, ...state.chats],
              activeChatId: newChat.id,
              // Initialize empty messages for this new chat so UI knows it's ready
              messages: [...state.messages]
            }));
          }

          // Notify server and all participants about group (new or updated)
          try {
            // Если чат уже существовал, значит мы добавляем участников
            const isUpdate = !!existingChatId || !!existingChatInState || (groupId === 'public');
            await (chatService as any).notifyCreation(groupId, 'group', allUniqueParticipantIds, finalName, isUpdate, currentUser.id);
          } catch (error) {
            console.error('Failed to notify group creation/update:', error);
          }
          
          return groupId;
        } catch (error) {
          console.error('Create group chat error:', error);
          return '';
        }
      },

  addMessage: (message: ChatMessage) => {
        set((state) => {
          // Prevent duplicates
          if (state.messages.some(m => m.id === message.id)) {
            return state;
          }

          // Force update chatId format for direct messages if they come with old '-' format
          let effectiveChatId = message.chatId;
          if (effectiveChatId.startsWith('chat-')) {
            const parts = effectiveChatId.split('-');
            if (parts.length >= 11) {
              const id1 = parts.slice(1, 6).join('-');
              const id2 = parts.slice(6, 11).join('-');
              effectiveChatId = `chat_${[id1, id2].sort().join('_')}`;
            }
          }
          
          const msgWithFixedId = { ...message, chatId: effectiveChatId };

          // Расшифровка текста сообщения для отображения в уведомлении и списке чатов
          let displayText = message.text;
          if (message.text && message.text.startsWith('[ENC]')) {
            displayText = cryptoUtils.decryptMessage(message.text, effectiveChatId);
          } else if (message.isSystem && message.text) {
            if (message.text.startsWith('[GROUP_CREATED]|')) {
              const parts = message.text.split('|');
              displayText = `Группа "${parts[1]}" создана`;
            } else if (message.text.startsWith('[GROUP_UPDATED]|')) {
              const parts = message.text.split('|');
              displayText = `Участники добавлены в "${parts[1]}"`;
            } else if (message.text.startsWith('[USER_LEFT_GROUP]|')) {
              const parts = message.text.split('|');
              displayText = `Пользователь ${parts[1]} покинул группу`;
            } else if (message.text.startsWith('[DIRECT_CREATED]|')) {
              displayText = `Чат начат`;
            } else if (message.text.startsWith('[GROUP_AVATAR_CHANGED]|')) {
              displayText = `Аватар группы изменен`;
            }
          }
          
          const normalizedMessage = { ...msgWithFixedId, text: displayText };

          // 1. Ensure the chat exists in the list
          let chatExists = state.chats.some(c => c && c.id === effectiveChatId);
          let updatedChats = [...state.chats];

          if (!chatExists) {
            const currentUser = (window as any).useAuthStore?.getState()?.user;
            const otherId = (message as any).receiverId === currentUser?.id ? message.senderId : (message as any).receiverId;
            
            // Resolve chat name
            let chatName = message.chatName || message.senderName || 'Чат';
            
            // If it's a direct chat, we want the OTHER person's name
            if ((message as any).receiverId || effectiveChatId.startsWith('chat_')) {
              if (message.senderId === currentUser?.id) {
                // I am the sender, use receiver's name
                chatName = (message as any).receiverName || 'Чат';
                if (chatName === 'Чат') {
                  const receiver = (window as any).useRoleStore?.getState()?.users.find((u: any) => u.id === (message as any).receiverId);
                  if (receiver) chatName = receiver.name;
                }
              } else {
                // I am the receiver, use sender's name
                chatName = message.senderName || 'Чат';
                if (chatName === 'Чат') {
                  const sender = (window as any).useRoleStore?.getState()?.users.find((u: any) => u.id === message.senderId);
                  if (sender) chatName = sender.name;
                }
              }
            } else if (effectiveChatId.startsWith('group_') || effectiveChatId === 'public') {
              // For group chats, prefer chatName from message, then check if it's a rename or create message
              chatName = message.chatName || (effectiveChatId === 'public' ? 'Общий чат' : 'Групповой чат');
              
              if (message.isSystem) {
                if (message.text.includes('Группа переименована в "')) {
                  const match = message.text.match(/Группа переименована в "([^"]+)"/);
                  if (match && match[1]) chatName = match[1];
                } else if (message.text.startsWith('[GROUP_CREATED]|') || message.text.startsWith('[GROUP_UPDATED]|')) {
                  const parts = message.text.split('|');
                  if (parts.length >= 2) chatName = parts[1];
                }
              }
            }

            const isAutoNamed = chatName === 'Групповой чат' || (effectiveChatId.startsWith('group_') && !message.chatName);

            const currentActiveId = get().activeChatId;
            const isCurrentlyActive = effectiveChatId === currentActiveId || 
                                     (effectiveChatId === 'public' && currentActiveId === 'public') ||
                                     (effectiveChatId && currentActiveId && effectiveChatId.startsWith('group_') && effectiveChatId === currentActiveId);

            const allParticipants = (message as any).participants || (currentUser ? Array.from(new Set([currentUser.id, otherId, message.senderId].filter(Boolean))) : []);
            
            // ВАЖНО: Создаем чат локально только если текущий пользователь в списке участников
            const isUserParticipant = effectiveChatId === 'public' || allParticipants.includes(currentUser?.id);

            if (isUserParticipant) {
              updatedChats.unshift({
                id: effectiveChatId,
                name: chatName,
                type: effectiveChatId.startsWith('chat_') ? 'direct' : 'group',
                participants: allParticipants,
                unreadCount: isCurrentlyActive ? 0 : 1, 
                lastMessage: displayText,
                lastMessageTime: message.timestamp || message.createdAt,
                isAutoNamed: isAutoNamed,
                creatorId: message.creatorId || undefined // Добавляем creatorId
              });
            }
          }

          // 2. Update the chat data and increment unread if needed
          updatedChats = updatedChats.map(c => {
            if (c && c.id === effectiveChatId) {
              const currentUser = (window as any).useAuthStore?.getState()?.user;
              
              // Resolve correct name
              let resolvedName = c.name;
              
              // If it's a system rename or create message, always update the name
              if (message.isSystem) {
                if (message.text.includes('Группа переименована в "')) {
                  const match = message.text.match(/Группа переименована в "([^"]+)"/);
                  if (match && match[1]) resolvedName = match[1];
                } else if (message.text.startsWith('[GROUP_CREATED]|') || message.text.startsWith('[GROUP_UPDATED]|')) {
                  const parts = message.text.split('|');
                  if (parts.length >= 2) resolvedName = parts[1];
                }
              } else if (!c.name || c.name === 'Чат' || c.name === 'Пользователь' || c.name === 'Групповой чат' || c.name === 'Общий чат' || c.isAutoNamed) {
                if (message.chatName && !message.isSystem) {
                  resolvedName = message.chatName;
                } else if (c.type === 'direct') {
                  if (message.senderId === currentUser?.id) {
                    resolvedName = (message as any).receiverName || 'Чат';
                    // Final fallback to roleStore
                    if (resolvedName === 'Чат') {
                      const receiver = (window as any).useRoleStore?.getState()?.users.find((u: any) => u.id === (message as any).receiverId);
                      if (receiver) resolvedName = receiver.name;
                    }
                  } else {
                    resolvedName = message.senderName || 'Чат';
                    // Final fallback to roleStore
                    if (resolvedName === 'Чат') {
                      const sender = (window as any).useRoleStore?.getState()?.users.find((u: any) => u.id === message.senderId);
                      if (sender) resolvedName = sender.name;
                    }
                  }
                }
              }

              // Update participants list if provided in message (e.g. from notify-creation)
              let newParticipants = (message as any).participants;
              
              // Handle participants from new system message format
              if (message.isSystem && (message.text.startsWith('[GROUP_CREATED]|') || message.text.startsWith('[GROUP_UPDATED]|'))) {
                const parts = message.text.split('|');
                if (parts.length >= 3) {
                  newParticipants = parts[2].split(',');
                }
              }

              // Handle user leaving group in system message
              if (message.isSystem && message.text.startsWith('[USER_LEFT_GROUP]|')) {
                const leftUserId = message.senderId;
                
                // Если ЭТО МЫ ВЫШЛИ, удаляем чат из списка полностью
                if (leftUserId === currentUser?.id) {
                  return null; // Будет отфильтровано ниже
                }

                if (leftUserId && c.participants.includes(leftUserId)) {
                  // Мы НЕ используем newParticipants здесь, так как это системное сообщение о выходе,
                  // а не полный список. Просто удаляем одного.
                  const updatedParticipants = c.participants.filter(id => id !== leftUserId);
                  return {
                    ...c,
                    participants: updatedParticipants,
                    lastMessage: displayText,
                    lastMessageTime: message.timestamp || message.createdAt
                  };
                }
              }

              // ВАЖНО: Если у нас уже есть список участников и пришло обычное сообщение (без участников), 
              // мы НЕ должны заменять существующий список на пустой.
              let participants = c.participants && c.participants.length > 0 && (!newParticipants || newParticipants.length === 0)
                ? [...c.participants]
                : Array.from(new Set([...(c.participants || []), ...(newParticipants || [])]));

              if (message.senderId && !participants.includes(message.senderId)) {
                participants.push(message.senderId);
              }

              // ВАЖНО: Если ЭТО МЫ ВЫШЛИ (проверка на случай, если мы получили сообщение в чат, из которого вышли)
              if (!participants.includes(currentUser?.id) && c.id !== 'public') {
                return null; // Удаляем чат из списка
              }

              // ВАЖНО: Если это авто-имя, пересчитываем его на основе актуальных участников
              if (c.isAutoNamed) {
                const users = (window as any).useRoleStore?.getState()?.users || [];
                const names = participants
                  .map((id: string) => {
                    const u = users.find((user: any) => user.id === id);
                    return u?.name?.split(' ')[0] || null;
                  })
                  .filter(Boolean);
                
                if (names.length > 0) {
                 resolvedName = names.join(', '); // NO prefix here either!
               }
              }

              const currentActiveId = get().activeChatId;
              const isCurrentlyActive = effectiveChatId === currentActiveId || 
                                       (effectiveChatId === 'public' && currentActiveId === 'public') ||
                                       (effectiveChatId && currentActiveId && effectiveChatId.startsWith('group_') && effectiveChatId === currentActiveId);

              return {
                ...c,
                name: resolvedName,
                participants: participants,
                lastMessage: displayText,
                lastMessageTime: message.timestamp || message.createdAt,
                unreadCount: isCurrentlyActive ? 0 : (c.unreadCount || 0) + 1
              };
            }
            return c;
          }).filter(Boolean) as Chat[]; // Фильтруем удаленные чаты

          // Sort messages by creation time
          const newMessages = [...state.messages, normalizedMessage].sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt).getTime();
            const timeB = new Date(b.timestamp || b.createdAt).getTime();
            return timeA - timeB;
          });

          return {
            messages: newMessages,
            chats: updatedChats
          };
        });
      },

  clearUnread: (chatId) => {
    if (!chatId) return;
    set(state => ({
      chats: state.chats.map(c => {
        if (!c) return c;
        // Strict ID matching + special case for public chat
        const isMatch = c.id === chatId || 
                       (c.id === 'public' && chatId === 'public') ||
                       (c.id.startsWith('group_') && chatId === c.id);
        
        return isMatch ? { ...c, unreadCount: 0 } : c;
      })
    }));
  },

  togglePinChat: (chatId) => {
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c)
    }));
  },

  leaveChat: async (chatId: string) => {
    try {
      await chatService.leaveGroup(chatId);
      get().deleteChatLocally(chatId);
      sonnerToast.success('Вы покинули группу');
    } catch (error) {
      console.error('Failed to leave group:', error);
      sonnerToast.error('Не удалось выйти из группы');
    }
  },

  toggleMuteChat: (chatId: string) => {
    set(state => {
      const updatedChats = state.chats.map(c => {
        if (c.id === chatId) {
          const newMutedStatus = !c.isMuted;
          sonnerToast(newMutedStatus ? 'Уведомления выключены' : 'Уведомления включены', {
            description: `Для чата "${c.name}"`,
            duration: 3000
          });
          return { ...c, isMuted: newMutedStatus };
        }
        return c;
      });
      return { chats: updatedChats };
    });
  },

  deleteChat: async (chatId) => {
        const { chats } = get();
        const chatToDelete = chats.find(c => c.id === chatId);
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        const otherParticipantId = chatToDelete?.participants.find(p => p !== currentUser?.id);
        
        console.log(`[Chat] Deleting chat ${chatId}, otherParticipantId: ${otherParticipantId}`);

        // Immediate local UI update
        get().deleteChatLocally(chatId);

        try {
          // 1. Delete messages from backend - execute immediately
          // Note: The backend route already emits 'chat:deleted' via socket
          await chatService.deleteChatMessages(chatId, otherParticipantId || 'unknown');
          
          sonnerToast.success('Чат успешно удален', { duration: 4000 });
        } catch (error) {
          console.error('Failed to delete chat on server:', error);
          sonnerToast.error('Не удалось полностью удалить чат на сервере');
        }
      },

  deleteChatLocally: (chatId) => {
    set(state => {
      const isActive = state.activeChatId === chatId;
      const filteredChats = state.chats.filter(c => c && c.id !== chatId);
      const filteredMessages = state.messages.filter(m => m.chatId !== chatId);

      let newActiveChatId: string | null = state.activeChatId;
      if (isActive) {
        // If the active chat was deleted, try to find a new one
        const publicChat = filteredChats.find(c => c.id === 'public');
        if (publicChat) {
          newActiveChatId = 'public';
        } else if (filteredChats.length > 0) {
          newActiveChatId = filteredChats[0].id; // Set to the first available chat
        } else {
          newActiveChatId = null; // No chats left
        }
      }

      console.log(`[ChatStore] Locally deleted chat ${chatId}. Remaining chats: ${filteredChats.length}. New activeChatId: ${newActiveChatId}. Filtered chats IDs: ${filteredChats.map(c => c.id).join(', ')}`);

      return {
        chats: filteredChats,
        messages: filteredMessages,
        activeChatId: newActiveChatId
      };
    });
  },

  renameChat: async (chatId, newName) => {
      try {
        const trimmedName = newName.trim();
        // Update locally immediately for better UX
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, name: trimmedName, isAutoNamed: false } : c)
        }));

        if (chatId.startsWith('group_') || chatId === 'public') {
          await chatService.renameChat(chatId, trimmedName);
          sonnerToast.success('Чат переименован', { duration: 4000 });
        } else {
          sonnerToast.success('Чат переименован', { duration: 4000 });
        }
        return true;
     } catch (error) {
       console.error('Failed to rename chat:', error);
       sonnerToast.error('Не удалось переименовать чат');
       return false;
     }
   },

  updateChatAvatar: async (chatId, avatar) => {
    try {
      // Update locally immediately
      set(state => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, avatar } : c)
      }));

      if (chatId.startsWith('group_') || chatId === 'public') {
        await chatService.updateAvatar(chatId, avatar);
        sonnerToast.success('Аватар чата обновлен', { duration: 4000 });
      }
      return true;
    } catch (error) {
      console.error('Failed to update chat avatar:', error);
      sonnerToast.error('Не удалось обновить аватар чата');
      return false;
    }
  },

  deleteGroup: async (chatId: string, masterPassword?: string) => {
    const currentUser = (window as any).useAuthStore?.getState()?.user;
    if (!currentUser) {
      sonnerToast.error('Для удаления группы необходимо авторизоваться.');
      return;
    }

    const chatToDelete = get().chats.find(c => c.id === chatId);

    if (!chatToDelete) {
      sonnerToast.error('Группа не найдена.');
      return;
    }

    // If not creator, and no master password, show error. Otherwise, proceed to API call.
    if (chatToDelete.creatorId !== currentUser.id && !masterPassword) {
      sonnerToast.error('Вы не являетесь создателем этой группы и не можете ее удалить без мастер-пароля.');
      return;
    }

    try {
      await chatService.deleteGroup(chatId, masterPassword);
      get().deleteChatLocally(chatId);
      sonnerToast.success('Группа успешно удалена.');
    } catch (error) {
      console.error('Failed to delete group:', error);
      sonnerToast.error('Не удалось удалить группу.');
    }
  },

  removeParticipant: async (chatId, userIdToRemove, masterPassword) => {
    try {
      const response = await chatService.removeParticipant(chatId, userIdToRemove, masterPassword);
      if (response.success) {
        // If the group was deleted (no participants left)
        if (response.message === 'Группа удалена, так как не осталось участников.') {
          get().deleteChatLocally(chatId);
          sonnerToast.success(response.message);
          return true;
        }

        // Otherwise, update the participants list locally
        set(state => ({
          chats: state.chats.map(c =>
            c.id === chatId
              ? { ...c, participants: c.participants.filter(p => p !== userIdToRemove) }
              : c
          )
        }));
        sonnerToast.success(response.message);
        return true;
      } else {
        sonnerToast.error('Ошибка', { description: response.message });
        return false;
      }
    } catch (error: any) {
      sonnerToast.error('Ошибка при исключении участника', { description: error.message || 'Неизвестная ошибка' });
      return false;
    }
  },

  setGroupAdmin: async (chatId: string, userId: string) => {
    try {
      await chatService.setGroupAdmin(chatId, userId);
      set(state => ({
        chats: state.chats.map(chat =>
          chat.id === chatId
            ? { ...chat, adminIds: Array.from(new Set([...(chat.adminIds || []), userId])) }
            : chat
        ),
      }));
      sonnerToast.success('Пользователь назначен администратором группы');
      return true;
    } catch (error) {
      console.error('Failed to set group admin:', error);
      sonnerToast.error('Не удалось назначить администратора группы');
      return false;
    }
  },

  setShowDirectoryUsers: (show) => set({ showDirectoryUsers: show })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        messages: state.messages,
        showDirectoryUsers: state.showDirectoryUsers,
      }),
    }
  )
);
