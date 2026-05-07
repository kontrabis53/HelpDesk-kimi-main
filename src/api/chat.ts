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
    const url = otherParticipantId 
      ? `/chat/${chatId}?otherParticipantId=${otherParticipantId}`
      : `/chat/${chatId}`;
    const response = await apiClient.delete(url);
    return response.data;
  }
};
