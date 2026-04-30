import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { chatService } from '@/api/chat';

interface ChatMessage {
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

export const useChatStore = create<ChatStore>((set, get) => ({
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
      upgrade: false
    });

    // Authenticate socket for status tracking
    const token = localStorage.getItem('auth_token');
    if (token) {
      socket.emit('authenticate', token);
    }
    
    socket.on('chat:message', (message: ChatMessage) => {
      get().addMessage(message);
    });

    socket.on('user_deactivated', ({ userId }: { userId: string }) => {
      // Proactively log out if we know the ID.
      try {
        const authState = (window as any).useAuthStore?.getState();
        if (authState?.user?.id === userId) {
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
      // We need to update the user status in roleStore or wherever users are managed
      // Since stores are separate, we can use a global event or direct store update if possible
      // For now, let's just log it and assume roleStore will handle the update if we can access it
      console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      
      // Try to update roleStore users if it's available in the same context
      // Alternatively, we can use a callback or window event
      const event = new CustomEvent('user_status_updated', { detail: { userId, isOnline } });
      window.dispatchEvent(event);
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
      const messages = await chatService.getMessages();
      set({ messages, isLoading: false });
    } catch (error: any) {
      console.error('Fetch messages error:', error);
      set({ isLoading: false });
    }
  },

  setActiveChat: (chatId) => set({ activeChatId: chatId }),

  sendMessage: async (chatId, text, senderId, senderName, _recipientName) => {
    try {
      // Mock for now until backend supports full chat model
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        chatId,
        text,
        senderId,
        senderName,
        senderRealName: senderName, // Fallback
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
      
      set(state => ({
        messages: [...state.messages, newMessage],
        chats: state.chats.map(c => c.id === chatId ? {
          ...c,
          lastMessage: text,
          lastMessageTime: newMessage.createdAt
        } : c)
      }));

      await chatService.sendMessage(text, chatId);
    } catch (error: any) {
      console.error('Send message error:', error);
    }
  },

  createDirectChat: async (participantId, name) => {
    const existingChat = get().chats.find(c => 
      c.type === 'direct' && c.participants.includes(participantId)
    );
    
    if (existingChat) {
      set({ activeChatId: existingChat.id });
      return existingChat.id;
    }

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
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
      messages: [...state.messages, message]
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
}));
