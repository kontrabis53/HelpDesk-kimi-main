import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { chatService } from '@/api/chat';
import { sanitizeText, isZalgo } from '@/lib/utils';
import { toast } from 'sonner';

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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

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

    console.log('Connecting to socket at:', SOCKET_URL);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // Re-authenticate on every connection/reconnection
    socket.on('connect', () => {
      console.log('Socket connected, authenticating...');
      const token = localStorage.getItem('auth_token');
      if (token) {
        socket.emit('authenticate', token);
      }
    });

    socket.on('chat:message', async (message: ChatMessage) => {
      // Check if message is for us or from us
      const currentUser = (window as any).useAuthStore?.getState()?.user;
      if (!currentUser) return;

      // Sanitize incoming message content to prevent UI issues
      const sanitizedMessage = {
        ...message,
        text: sanitizeText(message.text)
      };

      // Handle direct chat ID matching
      let targetChatId = sanitizedMessage.chatId;
      
      // If it's a direct message (has receiverId), use consistent chatId
      const msgReceiverId = (sanitizedMessage as any).receiverId;
      if (msgReceiverId || sanitizedMessage.chatId.startsWith('chat-')) {
        const participantId = sanitizedMessage.senderId === currentUser.id ? msgReceiverId : sanitizedMessage.senderId;
        if (participantId) {
          targetChatId = `chat-${[currentUser.id, participantId].sort().join('-')}`;
          
          // Ensure chat exists in sidebar
          const existingChat = get().chats.find(c => c.id === targetChatId);
          if (!existingChat) {
            const newChat: Chat = {
              id: targetChatId,
              name: sanitizedMessage.senderName,
              type: 'direct',
              participants: ['current-user', participantId],
              unreadCount: 1
            };
            set(state => ({ chats: [newChat, ...state.chats] }));
            // Refresh to get full history if needed
            await get().fetchMessages();
          }
        }
      }

      get().addMessage({ ...sanitizedMessage, chatId: targetChatId });
      
      // Add notification for new message if it's from someone else AND not the active chat
      if (sanitizedMessage.senderId !== currentUser.id && get().activeChatId !== targetChatId) {
        // Teams-style notification using sonner
        import('sonner').then(({ toast }) => {
          toast(sanitizedMessage.senderName, {
            description: sanitizedMessage.text,
            duration: 5000,
            action: {
              label: 'Ответить',
              onClick: () => {
                // First navigate, then set active chat to ensure UI is ready
                if (window.location.pathname !== '/chat') {
                  window.location.href = `/chat?activeChatId=${targetChatId}`;
                } else {
                  get().setActiveChat(targetChatId);
                }
              }
            }
          });
        });

        useNotificationStore.getState().addNotification({
          title: `Новое сообщение от ${sanitizedMessage.senderName}`,
          message: sanitizedMessage.text,
          type: 'info',
        });
      }
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
          import('sonner').then(({ toast }) => {
            toast.error('Доступ к системе ограничен', {
              description: 'Ваша учетная запись деактивирована администратором.',
              duration: 5000,
            });
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
        import('sonner').then(({ toast }) => {
          toast.warning('Заканчивается товар', {
            description: `${item.name}: осталось ${item.quantity}`,
            duration: 5000,
          });
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

          // Map raw messages to include chatId
          const messages = rawMessages.map((m: any) => {
            let chatId = m.chatId;
            if (!chatId && m.receiverId) {
              // For direct messages, find the existing chat or create a consistent ID
              const participantId = m.senderId === currentUser.id ? m.receiverId : m.senderId;
              const existingChat = get().chats.find(c => 
                c.type === 'direct' && c.participants.includes(participantId)
              );
              chatId = existingChat ? existingChat.id : `chat-${[m.senderId, m.receiverId].sort().join('-')}`;
            }
            return { ...m, chatId };
          });

          set({ messages, isLoading: false });
        } catch (error: any) {
          console.error('Fetch messages error:', error);
          set({ isLoading: false });
        }
      },

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  sendMessage: async (chatId, text, senderId, _senderName, _recipientName) => {
        try {
          // Prevent sending Zalgo text
          if (isZalgo(text)) {
            toast.error('Обнаружены недопустимые символы', {
              description: 'Сообщение содержит вредоносный текст и было заблокировано.'
            });
            return;
          }

          const sanitizedText = sanitizeText(text);

          // Find receiverId from chatId if it's a direct chat
          let receiverId: string | undefined;
          const chat = get().chats.find(c => c.id === chatId);
          if (chat && chat.type === 'direct') {
            receiverId = chat.participants.find(p => p !== 'current-user' && p !== senderId);
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

        const consistentId = `chat-${[currentUser.id, participantId].sort().join('-')}`;
        const newChat: Chat = {
          id: consistentId,
          name,
          type: 'direct',
          participants: ['current-user', participantId],
          unreadCount: 0
        };

        set(state => ({
          chats: [newChat, ...state.chats],
          activeChatId: newChat.id
        }));

        return newChat.id;
      },

  addMessage: (message: ChatMessage) => {
        set((state) => ({
          messages: [...state.messages, message],
          chats: state.chats.map(c => c.id === message.chatId ? {
            ...c,
            lastMessage: message.text,
            lastMessageTime: message.timestamp || message.createdAt,
            unreadCount: state.activeChatId === message.chatId ? 0 : (c.unreadCount || 0) + 1
          } : c)
        }));
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

  deleteChat: (chatId) => {
    set(state => ({
      chats: state.chats.filter(c => c.id !== chatId),
      activeChatId: state.activeChatId === chatId ? null : state.activeChatId
    }));
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
