import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessagesScreen from "@/components/inbox/MessagesScreen";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import NotificationsScreen from "@/components/inbox/NotificationsScreen";

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { messageCount, notificationCount } = useInboxCounts();
  const [activeTab, setActiveTab] = useState<"messages" | "notifications">("messages");
  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-3 pb-2 bg-white border-b border-border-light">
        <Text className="text-xl font-bold text-secondary mb-3">মেসেজ ও নোটিফিকেশন</Text>
        <View className="flex-row bg-surface-dark rounded-xl p-1">
          {([ ["messages", "মেসেজ"], ["notifications", "নোটিফিকেশন"] ] as const).map(([key, label]) => <TouchableOpacity key={key} onPress={() => setActiveTab(key)} accessibilityRole="tab" accessibilityState={{ selected: activeTab === key }} className={`flex-1 items-center py-2 rounded-lg ${activeTab === key ? "bg-white" : ""}`}><View className="flex-row items-center"><Text className={`font-bold text-sm ${activeTab === key ? "text-primary" : "text-text-secondary"}`}>{label}</Text>{(key === "messages" ? messageCount : notificationCount) > 0 && <View className="ml-1.5 min-w-[18px] h-[18px] rounded-full bg-error px-1 items-center justify-center"><Text className="text-white text-[10px] font-bold">{(key === "messages" ? messageCount : notificationCount) > 99 ? "99+" : (key === "messages" ? messageCount : notificationCount)}</Text></View>}</View></TouchableOpacity>)}
        </View>
      </View>
      {activeTab === "messages" ? <MessagesScreen embedded /> : <NotificationsScreen embedded />}
    </View>
  );
}
