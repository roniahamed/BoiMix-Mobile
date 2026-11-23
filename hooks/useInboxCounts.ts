import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api/messages";
import { notificationsApi } from "@/lib/api/notifications";
import { useAuthStore } from "@/stores/auth-store";

export function useInboxCounts() {
  const user = useAuthStore((state) => state.user);
  const enabled = !!user;
  const messages = useQuery({
    queryKey: ["inbox-unread-messages", user?.id],
    queryFn: async () => (await messagesApi.getUnreadCount()).data.total_unread_count,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const notifications = useQuery({
    queryKey: ["inbox-unread-notifications", user?.id],
    queryFn: async () => (await notificationsApi.getSummary()).data.unread_notifications_count,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  return {
    messageCount: enabled ? Math.max(0, Number(messages.data) || 0) : 0,
    notificationCount: enabled ? Math.max(0, Number(notifications.data) || 0) : 0,
  };
}
