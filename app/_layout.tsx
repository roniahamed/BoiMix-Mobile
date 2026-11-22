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
          </Stack>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
