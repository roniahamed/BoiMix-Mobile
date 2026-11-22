import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { Notification, NotificationSummary } from "@/types/notification";
import type { PaginatedResponse } from "@/lib/api/books";

export const notificationsApi = {
  getNotifications: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<Notification>>(
      API_ENDPOINTS.NOTIFICATIONS.LIST,
      { params },
    ),

  markAsRead: (id: string) =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),

  markAllAsRead: () =>
    apiClient.post(API_ENDPOINTS.NOTIFICATIONS.READ_ALL),

  getSummary: () =>
    apiClient.get<NotificationSummary>(API_ENDPOINTS.NOTIFICATIONS.SUMMARY),
};
