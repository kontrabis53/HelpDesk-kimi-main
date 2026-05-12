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

  updateAvatar: async (chatId: string, avatar: string | null) => {
    const response = await apiClient.patch(`/chat/avatar/${chatId}`, { avatar });
    return response.data;
  },

  leaveGroup: async (chatId: string) => {
    const response = await apiClient.post(`/chat/leave/${chatId}`);
    return response.data;
  },

  notifyCreation: async (chatId: string, type: 'direct' | 'group', participants: string[], name: string, isUpdate: boolean = false, creatorId?: string) => {
    const response = await apiClient.post('/chat/notify-creation', { chatId, type, participants, name, isUpdate, creatorId });
    return response.data;
  },

  deleteGroup: async (chatId: string, masterPassword?: string) => {
    const response = await apiClient.post('/chat/purge', { chatId, masterPassword });
    return response.data;
  },

  setGroupAdmin: async (chatId: string, userId: string) => {
    const response = await apiClient.post(`/chat/set-admin/${chatId}`, { userId });
    return response.data;
  },

  removeParticipant: async (chatId: string, userIdToRemove: string, masterPassword?: string) => {
    const response = await apiClient.post(`/chat/remove-participant/${chatId}`, { userIdToRemove, masterPassword });
    return response.data;
  }
};
