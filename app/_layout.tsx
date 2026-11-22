import { Platform } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryProvider } from "@/providers/QueryProvider";
import { useAuthEvents } from "@/lib/hooks/useAuthEvents";
import "../global.css";

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.setProperty("--css-interop-darkMode", "class dark");
}

function AppEventListeners() {
  useAuthEvents();
  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AppEventListeners />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="tabs" />
            <Stack.Screen name="near-me" />
            <Stack.Screen name="search" />
            <Stack.Screen name="book/[slug]" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="wishlist" />
            <Stack.Screen name="borrow/index" />
            <Stack.Screen name="exchange/index" />
            <Stack.Screen name="exchange/[id]" />
            <Stack.Screen name="upload/index" />
            <Stack.Screen name="user/[username]" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="messages/index" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="profile/edit" />
          </Stack>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
