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
  text: string;
  senderId: string;
  senderName: string;
  senderRealName?: string;
  createdAt: string;
  timestamp?: string;
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
  
  initSocket: () => void;
  disconnectSocket: () => void;
  authenticateSocket: (token: string) => void;
  fetchMessages: () => Promise<void>;
  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, text: string, senderId: string, senderName: string, recipientName: string) => Promise<void>;
  createDirectChat: (participantId: string, name: string) => Promise<string>;
  addMessage: (message: ChatMessage) => void;
  clearUnread: (chatId: string) => void;
  togglePinChat: (chatId: string) => void;
  toggleHideChat: (chatId: string) => void;
  toggleMuteChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  setShowHiddenChats: (show: boolean) => void;
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

      // Sanitize incoming message content to prevent UI issues
      const sanitizedMessage = {
        ...message,
        text: sanitizeText(message.text)
      };

      // Handle direct chat ID matching
      let targetChatId = sanitizedMessage.chatId;
      
      // If it's a direct message (has receiverId), use consistent chatId
      const msgReceiverId = (sanitizedMessage as any).receiverId;
      const participantId = sanitizedMessage.senderId === currentUser.id ? msgReceiverId : sanitizedMessage.senderId;

      if (msgReceiverId || sanitizedMessage.chatId.startsWith('chat_')) {
        if (participantId) {
          targetChatId = `chat_${[currentUser.id, participantId].sort().join('_')}`;
        }
      }

      // Add message to state (this now handles chat creation and unread counting)
      get().addMessage({ ...sanitizedMessage, chatId: targetChatId });
      
      // Add notification for new message if it's from someone else AND not the active chat
      if (sanitizedMessage.senderId !== currentUser.id && get().activeChatId !== targetChatId) {
        console.log('[Socket] Triggering notification for:', sanitizedMessage.senderName);
        
        sonnerToast(sanitizedMessage.senderName || 'Новое сообщение', {
          description: sanitizedMessage.text,
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

    socket.on('chat:deleted', ({ chatId }: { chatId: string }) => {
      console.log(`[Socket] Received chat:deleted event for ${chatId}`);
      set(state => {
        const isActive = state.activeChatId === chatId;
        return {
          chats: state.chats.filter(c => c && c.id !== chatId),
          messages: state.messages.filter(m => m.chatId !== chatId),
          activeChatId: isActive ? null : state.activeChatId
        };
      });

      sonnerToast.info('Чат удален', {
        description: 'Собеседник удалил этот чат.'
      });
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

          const existingChats = get().chats;
          const newChatsMap = new Map<string, any>();

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
            } else if (chatId === 'public') {
              const lastMessageTime = m.timestamp || m.createdAt;
              const existingChatInState = get().chats.find(c => c.id === 'public');
              const existingChatInMap = newChatsMap.get('public');
              
              if (!existingChatInMap || new Date(lastMessageTime) > new Date(existingChatInMap.lastMessageTime)) {
                newChatsMap.set('public', {
                  id: 'public',
                  name: 'Общий чат',
                  type: 'group',
                  participants: [],
                  // Preserve unread count from state
                  unreadCount: existingChatInState?.unreadCount || 0,
                  lastMessage: m.text,
                  lastMessageTime: lastMessageTime
                });
              }
            }

            return { ...m, chatId };
          });

          // Filter out old chat- formats from existing chats to prevent duplicates
          const cleanedExistingChats = existingChats.filter(c => c && c.id && !c.id.startsWith('chat-'));

          // Merge new chats into state
          if (newChatsMap.size > 0) {
            const updatedChats = [...cleanedExistingChats];
            newChatsMap.forEach((newChat, id) => {
              const idx = updatedChats.findIndex(c => c && c.id === id);
              if (idx !== -1) {
                updatedChats[idx] = { ...updatedChats[idx], ...newChat };
              } else {
                updatedChats.unshift(newChat);
              }
            });
            set({ chats: updatedChats });
          } else {
            // Even if no new chats from messages, keep cleaned list
            set({ chats: cleanedExistingChats });
          }

          set({ messages, isLoading: false });
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
          const chat = get().chats.find(c => c.id === chatId);
          if (chat && chat.type === 'direct') {
            receiverId = chat.participants.find(p => p !== senderId);
          }

          // We no longer add a mock message here because it will be received 
          // via Socket.io (chat:message) and added to the state there.
          // This prevents double messages.

          await chatService.sendMessage(sanitizedText, receiverId);
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

        return newChat.id;
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
            
            updatedChats.unshift({
              id: effectiveChatId,
              name: message.senderName || 'Чат',
              type: (message as any).receiverId ? 'direct' : 'group',
              participants: currentUser ? [currentUser.id, otherId].filter(Boolean) : [],
              unreadCount: 0, // Will be incremented below
              lastMessage: message.text,
              lastMessageTime: message.timestamp || message.createdAt
            });
          }

          // 2. Update the chat data and increment unread if needed
          updatedChats = updatedChats.map(c => {
            if (c && c.id === effectiveChatId) {
              const isUnread = state.activeChatId !== effectiveChatId;
              
              // Debug log to see if this is triggered
              console.log(`[ChatStore] Message for ${c.name}, isUnread: ${isUnread}, current: ${c.unreadCount}`);

              return {
                ...c,
                name: (!c.name || c.name === 'Чат' || c.name === 'Пользователь') ? message.senderName : c.name,
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
        const { socket, chats } = get();
        const chatToDelete = chats.find(c => c.id === chatId);
        const currentUser = (window as any).useAuthStore?.getState()?.user;
        const otherParticipantId = chatToDelete?.participants.find(p => p !== currentUser?.id);
        
        console.log(`[Chat] Deleting chat ${chatId}, otherParticipantId: ${otherParticipantId}`);

        // Immediate local UI update
        set(state => ({
          chats: state.chats.filter(c => c.id !== chatId),
          messages: state.messages.filter(m => m.chatId !== chatId),
          activeChatId: state.activeChatId === chatId ? null : state.activeChatId
        }));

        try {
          // 1. Delete messages from backend - execute immediately
          await chatService.deleteChatMessages(chatId, otherParticipantId || 'unknown');

          // 2. Notify other participants via socket
          if (socket && chatToDelete && otherParticipantId) {
            console.log(`[Socket] Sending delete notification for ${chatId} to ${otherParticipantId}`);
            socket.emit('chat:delete', { chatId, receiverId: otherParticipantId });
          }
        } catch (error) {
          console.error('Failed to delete chat on server:', error);
          sonnerToast.error('Не удалось полностью удалить чат на сервере');
        }
      },

  setShowHiddenChats: (show) => set({ showHiddenChats: show })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        chats: state.chats,
        messages: state.messages,
        activeChatId: state.activeChatId,
        showHiddenChats: state.showHiddenChats,
      }),
    }
  )
);
