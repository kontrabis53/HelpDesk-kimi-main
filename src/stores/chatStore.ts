import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { chatService } from '@/api/chat';
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
}

interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isPinned?: boolean;
  isHidden?: boolean;
  isMuted?: boolean;
}

interface ChatStore {
  chats: Chat[];
  messages: ChatMessage[];
  activeChatId: string | null;
  socket: Socket | null;
  isLoading: boolean;
  showHiddenChats: boolean;
  showDirectoryUsers: boolean;
  
  initSocket: () => void;
  disconnectSocket: () => void;
  authenticateSocket: (token: string) => void;
  fetchMessages: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, text: string, senderId: string, senderName: string, recipientName: string) => Promise<void>;
  createDirectChat: (participantId: string, name: string) => Promise<string>;
  createGroupChat: (participantIds: string[], name: string) => Promise<string>;
  addMessage: (message: ChatMessage) => void;
  clearUnread: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleHideChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => Promise<boolean>;
  deleteChatLocally: (chatId: string) => void;
  setShowHiddenChats: (show: boolean) => void;
  setShowDirectoryUsers: (show: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
  chats: [],
  messages: [],
  activeChatId: null,
  socket: null,
  isLoading: false,
  showHiddenChats: false,
  showDirectoryUsers: false,

  initSocket: () => {
    if (get().socket) {
      return;
    }

    // NUCLEAR OPTION: Ignore .env and use browser location for everything
    const currentHost = window.location.hostname;
    const socketUrl = `http://${currentHost}:3000`;

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

      // Check for duplicate messages to avoid multiple notifications
      const isDuplicate = get().messages.some(m => m.id === message.id);
      if (isDuplicate) {
        console.log('[Socket] Duplicate message ignored:', message.id);
        return;
      }

      // Normalize message properties (server sends 'sender', client expects 'senderName')
      const normalizedMessage = {
        ...message,
        text: sanitizeText(message.text),
        senderName: message.senderName || (message as any).sender?.name || 'Пользователь',
        receiverName: (message as any).receiverName || (message as any).receiver?.name || 'Пользователь'
      };

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
      
      // Add notification for new message if it's from someone else AND not the active chat
      if (normalizedMessage.senderId !== currentUser.id && get().activeChatId !== targetChatId) {
        console.log('[Socket] Triggering notification for:', normalizedMessage.senderName);
        
        sonnerToast(normalizedMessage.senderName || 'Новое сообщение', {
          description: normalizedMessage.text,
          duration: 5000,
          position: 'bottom-right',
          action: {
            label: 'Ответить',
            onClick: () => {
              if (window.location.pathname !== '/chat') {
                window.location.href = `/chat?activeChatId=${targetChatId}`;
              } else {
                get().setActiveChat(targetChatId);
              }
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

      // Notification logic
      if (deletedById !== currentUser?.id) {
        sonnerToast.info('Чат удален', {
          description: `Пользователь ${deletedBy || 'собеседник'} удалил этот чат.`
        });
      }
    });

    socket.on('chat:renamed', ({ chatId, newName }: { chatId: string, newName: string }) => {
      console.log(`[Socket] Chat ${chatId} renamed to ${newName}`);
      set(state => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, name: newName } : c)
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

          // First pass: Find all rename system messages to get the latest names
          rawMessages.forEach((m: any) => {
            if (m.isSystem && m.text.includes('Группа переименована в "')) {
              const match = m.text.match(/Группа переименована в "([^"]+)"/);
              if (match && match[1]) {
                const chatId = m.chatId || 'public';
                const existingNameTime = (m as any)._nameTime || 0;
                const msgTime = new Date(m.timestamp || m.createdAt).getTime();
                
                if (msgTime > existingNameTime) {
                  chatNamesFromSystemMessages.set(chatId, match[1]);
                  (m as any)._nameTime = msgTime;
                }
              }
            }
          });

          // Map raw messages to include chatId
          const messages = rawMessages.map((m: any) => {
            // A message belongs to a direct chat ONLY if it has a receiverId
            const participantId = m.senderId === currentUser.id ? m.receiverId : (m.receiverId ? m.senderId : null);
            
            let chatId = m.chatId || 'public';
            if (participantId) {
              chatId = `chat_${[currentUser.id, participantId].sort().join('_')}`;
            } else if (!m.chatId || m.chatId === 'public') {
              chatId = 'public';
            }

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
                  unreadCount: existingChatInState?.unreadCount || 0,
                  lastMessage: m.text,
                  lastMessageTime: lastMessageTime
                });
              }
            } else {
              // Group or Public chat
              const lastMessageTime = m.timestamp || m.createdAt;
              const isPublic = chatId === 'public';
              
              // Use name from system messages if available, otherwise fallback
              const chatName = chatNamesFromSystemMessages.get(chatId) || 
                              m.chatName || 
                              (isPublic ? 'Общий чат' : 'Групповой чат');
              
              const existingChatInState = get().chats.find(c => c.id === chatId);
              const existingChatInMap = newChatsMap.get(chatId);
              
              if (!existingChatInMap || new Date(lastMessageTime) > new Date(existingChatInMap.lastMessageTime)) {
                newChatsMap.set(chatId, {
                  id: chatId,
                  name: chatName,
                  type: 'group',
                  participants: [], // Participants will be filled as messages arrive or from state
                  unreadCount: existingChatInState?.unreadCount || 0,
                  lastMessage: m.text,
                  lastMessageTime: lastMessageTime
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
                  updatedChats[idx] = { ...updatedChats[idx], ...newChat };
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

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  sendMessage: async (chatId, text, senderId, _senderName, _recipientName) => {
        try {
          const trimmedText = text.trim();
          if (!trimmedText) return;

          // Enforce max length limit (4096 characters like Telegram)
          if (trimmedText.length > 4096) {
            sonnerToast.error('Сообщение слишком длинное', {
              description: `Максимальная длина — 4096 символов. Сейчас: ${trimmedText.length}`
            });
            return;
          }

          // Prevent sending Zalgo text
          if (isZalgo(trimmedText)) {
            sonnerToast.error('Обнаружены недопустимые символы', {
              description: 'Сообщение содержит вредоносный текст и было заблокировано.'
            });
            return;
          }

          const sanitizedText = sanitizeText(text);

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

          // We no longer add a mock message here because it will be received 
          // via Socket.io (chat:message) and added to the state there.
          // This prevents double messages.

          await chatService.sendMessage(sanitizedText, receiverId, effectiveChatId, chatName);
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

  createGroupChat: async (participantIds, name) => {
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        if (!currentUser) return '';

        try {
          // Generate a unique ID for the group chat
          const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
          
          // Ensure currentUser is added but NOT duplicated
          const uniqueParticipantIds = Array.from(new Set([currentUser.id, ...participantIds]));
          
          const newChat: Chat = {
            id: groupId,
            name,
            type: 'group',
            participants: uniqueParticipantIds,
            unreadCount: 0
          };

          set(state => ({
            chats: [newChat, ...state.chats],
            activeChatId: newChat.id
          }));

          // Notify server and all participants about new group
          try {
            await chatService.notifyCreation(groupId, 'group', uniqueParticipantIds, name);
          } catch (error) {
            console.error('Failed to notify group creation:', error);
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
              // For group chats, prefer chatName from message, then check if it's a rename message
              chatName = message.chatName || (effectiveChatId === 'public' ? 'Общий чат' : 'Групповой чат');
              
              if (message.isSystem && message.text.includes('Группа переименована в "')) {
                const match = message.text.match(/Группа переименована в "([^"]+)"/);
                if (match && match[1]) chatName = match[1];
              }
            }

            updatedChats.unshift({
              id: effectiveChatId,
              name: chatName,
              type: effectiveChatId.startsWith('group_') ? 'group' : ((message as any).receiverId || effectiveChatId.startsWith('chat_') ? 'direct' : 'group'),
              participants: currentUser ? Array.from(new Set([currentUser.id, otherId, message.senderId].filter(Boolean))) : [],
              unreadCount: 0, // Will be incremented below
              lastMessage: message.text,
              lastMessageTime: message.timestamp || message.createdAt
            });
          }

          // 2. Update the chat data and increment unread if needed
          updatedChats = updatedChats.map(c => {
            if (c && c.id === effectiveChatId) {
              const isUnread = state.activeChatId !== effectiveChatId;
              const currentUser = (window as any).useAuthStore?.getState()?.user;
              
              // Resolve correct name
              let resolvedName = c.name;
              
              // If it's a system rename message, always update the name
              if (message.isSystem && message.text.includes('Группа переименована в "')) {
                const match = message.text.match(/Группа переименована в "([^"]+)"/);
                if (match && match[1]) resolvedName = match[1];
              } else if (!c.name || c.name === 'Чат' || c.name === 'Пользователь' || c.name === 'Групповой чат' || c.name === 'Общий чат') {
                if (message.chatName) {
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

              // Update participants if message contains them (optional, but good for sync)
              const participants = c.participants;
              if (message.senderId && !participants.includes(message.senderId)) {
                participants.push(message.senderId);
              }

              return {
                ...c,
                name: resolvedName,
                participants: Array.from(new Set(participants)),
                lastMessage: message.text,
                lastMessageTime: message.timestamp || message.createdAt,
                unreadCount: isUnread ? (c.unreadCount || 0) + 1 : 0
              };
            }
            return c;
          });

          // Sort messages by creation time
          const newMessages = [...state.messages, msgWithFixedId].sort((a, b) => {
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
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c)
    }));
  },

  togglePinChat: (chatId) => {
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c)
    }));
  },

  toggleHideChat: (chatId) => {
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, isHidden: !c.isHidden } : c)
    }));
  },

  toggleMuteChat: (chatId) => {
    set(state => ({
      chats: state.chats.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c)
    }));
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
          
          sonnerToast.success('Чат успешно удален');
        } catch (error) {
          console.error('Failed to delete chat on server:', error);
          sonnerToast.error('Не удалось полностью удалить чат на сервере');
        }
      },

  deleteChatLocally: (chatId) => {
    set(state => {
      const isActive = state.activeChatId === chatId;
      return {
        chats: state.chats.filter(c => c && c.id !== chatId),
        messages: state.messages.filter(m => m.chatId !== chatId),
        activeChatId: isActive ? null : state.activeChatId
      };
    });
  },

  renameChat: async (chatId, newName) => {
      try {
        // Update locally immediately for better UX
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, name: newName } : c)
        }));

        if (chatId.startsWith('group_') || chatId === 'public') {
          await chatService.renameChat(chatId, newName);
          sonnerToast.success('Чат переименован');
        } else {
          sonnerToast.success('Чат переименован');
        }
        return true;
     } catch (error) {
       console.error('Failed to rename chat:', error);
       sonnerToast.error('Не удалось переименовать чат');
       return false;
     }
   },

  setShowHiddenChats: (show) => set({ showHiddenChats: show }),
  setShowDirectoryUsers: (show) => set({ showDirectoryUsers: show })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        messages: state.messages,
        showHiddenChats: state.showHiddenChats,
        showDirectoryUsers: state.showDirectoryUsers,
      }),
    }
  )
);
