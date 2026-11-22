import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import {
  registerForPushNotificationsAsync,
  setupNotificationChannels,
} from "@/lib/notifications/push";

/**
 * Hook to manage push notifications lifecycle:
 * 1. Automatic FCM device registration on login.
 * 2. Real-time foreground notification listener with query cache invalidation.
 * 3. Deep link routing when user taps on push notification.
 */
export function usePushNotifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Setup Android notification channels immediately
    setupNotificationChannels();

    // 1. Register device token if user is logged in
    if (isAuthenticated) {
      registerForPushNotificationsAsync();
    }

    // 2. Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      () => {
        // Invalidate notification caches so bell badge and list update automatically
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notifications-summary"] });
        queryClient.invalidateQueries({ queryKey: ["unread-notifications-count"] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    );

    // 3. User notification tap response listener (deep link navigation)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const targetUrl = data?.target_url || data?.url;

        if (targetUrl && typeof targetUrl === "string") {
          let route = targetUrl;
          // Normalize web routes to mobile routes if necessary
          if (route.startsWith("/dashboard/orders/")) {
            const orderId = route.split("/").pop();
            route = `/orders/${orderId}`;
          } else if (route.startsWith("/dashboard/messages/")) {
            const convId = route.split("/").pop();
            route = `/messages/${convId}`;
          } else if (route === "/dashboard/notifications") {
            route = "/notifications";
          }

          try {
            router.push(route as never);
          } catch (navErr) {
            console.warn("Push notification navigation failed:", navErr);
          }
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, queryClient, router]);
}
