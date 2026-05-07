import apiClient from './client/apiClient';

export const chatService = {
  getMessages: async () => {
    const response = await apiClient.get('/chat');
    return response.data;
  },

  sendMessage: async (text: string, receiverId?: string, chatId?: string, chatName?: string) => {
    const response = await apiClient.post('/chat', { text, receiverId, chatId, chatName });
    return response.data;
  },

  deleteChatMessages: async (chatId: string, otherParticipantId?: string) => {
    const response = await apiClient.post('/chat/purge', { chatId, otherParticipantId });
    return response.data;
  },

  renameChat: async (chatId: string, newName: string) => {
    const response = await apiClient.patch(`/chat/rename/${chatId}`, { newName });
    return response.data;
  },

  notifyCreation: async (chatId: string, type: 'direct' | 'group', participants: string[], name: string) => {
    const response = await apiClient.post('/chat/notify-creation', { chatId, type, participants, name });
    return response.data;
  }
};
