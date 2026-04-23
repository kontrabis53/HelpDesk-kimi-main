import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { chatService } from '@/api/chat';

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
}

interface ChatStore {
  messages: ChatMessage[];
  socket: Socket | null;
  isLoading: boolean;
  
  initSocket: () => void;
  fetchMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  socket: null,
  isLoading: false,

  initSocket: () => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);
    
    socket.on('chat:message', (message: ChatMessage) => {
      get().addMessage(message);
    });

    set({ socket });
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

  sendMessage: async (text: string) => {
    try {
      await chatService.sendMessage(text);
      // We don't add to state here because Socket.io will broadcast it back to us
    } catch (error: any) {
      console.error('Send message error:', error);
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message]
    }));
  }
}));
