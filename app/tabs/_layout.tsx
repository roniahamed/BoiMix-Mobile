import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { Colors } from "@/constants/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { messageCount, notificationCount } = useInboxCounts();
  const unreadCount = messageCount + notificationCount;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textPrimary,
        tabBarStyle: {
          borderTopColor: Colors.borderLight,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: Colors.surface,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          height: 58 + Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "হোম",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ backgroundColor: focused ? "#DCEFD8" : "transparent", borderRadius: 14, width: 54, height: 32, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={focused ? "home" : "home-outline"} size={size || 22} color={color as string} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "ক্যাটাগরি",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={size || 22}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "বই বিক্রি",
          tabBarIcon: () => (
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center", marginTop: -10, borderWidth: 3, borderColor: Colors.surface }}>
              <Ionicons name="add" size={27} color={Colors.textInverse} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "মেসেজ",
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, color: "white" },
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size || 22} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "অ্যাকাউন্ট",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size || 22}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
