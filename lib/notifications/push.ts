import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationsApi } from "@/lib/api/notifications";

const STORAGE_KEY_FCM_TOKEN = "boimix_fcm_token";

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * Configure Android notification channel with high priority and vibration
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "BoiMix Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563EB",
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      });
    } catch (err) {
      console.warn("Failed to set Android notification channel:", err);
    }
  }
}

/**
 * Request notification permissions and register the device FCM token with BoiMix backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    await setupNotificationChannels();

    if (Platform.OS === "web") {
      // Web notification support via Web Notifications API if permitted
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
      }
      return null;
    }

    // 1. Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission not granted");
      return null;
    }

    // 2. Obtain token (Prefer native FCM device push token)
    let token: string | null = null;
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      token = deviceToken.data;
    } catch {
      // Fallback for Expo development clients
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync();
        token = expoToken.data;
      } catch (expoErr) {
        console.warn("Could not retrieve push token:", expoErr);
      }
    }

    if (!token) {
      return null;
    }

    // 3. Register token with BoiMix Backend: POST /api/v1/notifications/devices/
    const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
    const deviceName =
      Platform.OS === "ios"
        ? "Apple iPhone"
        : Platform.OS === "android"
        ? "Android Device"
        : "Web Client";

    await notificationsApi.registerDeviceToken({
      fcm_token: token,
      device_name: deviceName,
      platform,
    });

    await AsyncStorage.setItem(STORAGE_KEY_FCM_TOKEN, token);
    return token;
  } catch (err) {
    console.warn("Push notification registration error:", err);
    return null;
  }
}

/**
 * Unregister device token with BoiMix backend upon logout.
 */
export async function unregisterPushTokenAsync(): Promise<void> {
  try {
    const savedToken = await AsyncStorage.getItem(STORAGE_KEY_FCM_TOKEN);
    if (savedToken) {
      await notificationsApi.unregisterDeviceToken({ fcm_token: savedToken });
      await AsyncStorage.removeItem(STORAGE_KEY_FCM_TOKEN);
    }
  } catch (err) {
    console.warn("Failed to unregister push token:", err);
  }
}
