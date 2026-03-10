import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, ChatMessage } from '@/types';

interface ChatStore {
  chats: Chat[];
  messages: ChatMessage[];
  activeChatId: string | null;
  
  setActiveChat: (id: string | null) => void;
  sendMessage: (chatId: string, text: string, senderId: string, senderName: string, senderRealName?: string) => void;
  createGroupChat: (name: string, participants: string[]) => string;
  createDirectChat: (participantId: string, participantName: string) => string;
  clearUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [
        {
          id: 'group-1',
          name: 'Medin Reception & CC',
          type: 'group',
          participants: ['Medin Reception', 'Medin CC'],
          lastMessage: 'Добро пожаловать в общий чат!',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0
        },
        {
          id: 'direct-1',
          name: 'Сисадмин',
          type: 'direct',
          participants: ['current-user', 'admin'],
          lastMessage: 'Привет, проверь принтер в 306',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 1
        }
      ],
      messages: [
        {
          id: 'm1',
          chatId: 'group-1',
          senderId: 'system',
          senderName: 'System',
          text: 'Группа создана',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'm2',
          chatId: 'group-1',
          senderId: 'Medin Reception',
          senderName: 'Medin Reception',
          text: 'Добро пожаловать в общий чат!',
          timestamp: new Date().toISOString()
        }
      ],
      activeChatId: null,

      setActiveChat: (id) => set({ activeChatId: id }),

      sendMessage: (chatId, text, senderId, senderName, senderRealName) => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          chatId,
          senderId,
          senderName,
          senderRealName,
          text,
          timestamp: new Date().toISOString()
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { 
                  ...chat, 
                  lastMessage: text, 
                  lastMessageTime: newMessage.timestamp,
                  unreadCount: state.activeChatId === chatId ? 0 : chat.unreadCount + 1
                } 
              : chat
          )
        }));
      },

      createGroupChat: (name, participants) => {
        const id = `group-${Date.now()}`;
        const newChat: Chat = {
          id,
          name,
          type: 'group',
          participants,
          unreadCount: 0,
          lastMessage: 'Группа создана',
          lastMessageTime: new Date().toISOString()
        };
        set((state) => ({ chats: [newChat, ...state.chats] }));
        return id;
      },

      createDirectChat: (participantId, participantName) => {
        // Check if chat already exists
        const existing = get().chats.find(c => 
          c.type === 'direct' && c.participants.includes(participantId)
        );
        if (existing) return existing.id;

        const id = `direct-${Date.now()}`;
        const newChat: Chat = {
          id,
          name: participantName,
          type: 'direct',
          participants: ['current-user', participantId],
          unreadCount: 0
        };
        set((state) => ({ chats: [newChat, ...state.chats] }));
        return id;
      },

      clearUnread: (chatId) => {
        set((state) => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c)
        }));
      }
    }),
    {
      name: 'helpdesk-chat-storage'
    }
  )
);
