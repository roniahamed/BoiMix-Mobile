import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type {
  ChatMessage,
  Conversation,
  CreateConversationPayload,
  SendMessagePayload,
} from "@/types/message";
import type { PaginatedResponse } from "@/lib/api/books";

export type ConversationsParams = {
  search?: string;
  context_type?: string;
  page?: number;
  page_size?: number;
};

export const messagesApi = {
  getConversations: (params: ConversationsParams = {}) =>
    apiClient.get<PaginatedResponse<Conversation>>(API_ENDPOINTS.CHAT.CONVERSATIONS, {
      params,
    }),

  getConversation: (id: string) =>
    apiClient.get<Conversation>(API_ENDPOINTS.CHAT.CONVERSATION(id)),

  createConversation: (data: CreateConversationPayload) =>
    apiClient.post<Conversation>(API_ENDPOINTS.CHAT.CONVERSATIONS, data),

  getMessages: (
    id: string,
    params: { limit?: number; before_id?: string; after_id?: string } = {}
  ) =>
    apiClient.get<ChatMessage[]>(API_ENDPOINTS.CHAT.MESSAGES(id), {
      params,
    }),

  sendMessage: (id: string, data: SendMessagePayload) =>
    apiClient.post<ChatMessage>(API_ENDPOINTS.CHAT.MESSAGES(id), data),

  markAsRead: (id: string) =>
    apiClient.post<{ status: string; unread_count: number }>(
      API_ENDPOINTS.CHAT.MARK_READ(id)
    ),

  getUnreadCount: () =>
    apiClient.get<{ total_unread_count: number }>(API_ENDPOINTS.CHAT.UNREAD_COUNT),

  getSupportConversation: () =>
    apiClient.get<Conversation>(API_ENDPOINTS.CHAT.SUPPORT),
};
