import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { ChatMessage, Conversation, SendMessagePayload } from '@/types/chat.types';

export const chatService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data } = await api.get(API_ENDPOINTS.CHAT.CONVERSATIONS(userId));
    return data.data;
  },

  async startConversation(userId: string, recipientId: string): Promise<Conversation> {
    const { data } = await api.post(API_ENDPOINTS.CHAT.START_CONVERSATION, {
      userId,
      recipientId,
    });
    return data.data;
  },

  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    let url = API_ENDPOINTS.CHAT.MESSAGES(conversationId, userId);
    if (limit) url += `&limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    const { data } = await api.get(url);
    return data.data;
  },

  async getMessagesByOtherUser(
    otherUserId: string,
    limit = 50,
    page = 1,
    before?: string
  ): Promise<ChatMessage[]> {
    let url = `${API_ENDPOINTS.CHAT.MESSAGES_BY_USER(otherUserId)}?limit=${limit}&page=${page}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    const { data } = await api.get(url);
    return data.data;
  },

  async sendMessage(payload: SendMessagePayload): Promise<{ message: ChatMessage; conversation: Conversation }> {
    const { data } = await api.post(API_ENDPOINTS.CHAT.SEND_MESSAGE, payload);
    return data.data;
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await api.patch(API_ENDPOINTS.CHAT.MARK_READ(conversationId), { userId });
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { data } = await api.get(API_ENDPOINTS.CHAT.UNREAD_COUNT(userId));
    return data.data?.unreadCount ?? 0;
  },
};
