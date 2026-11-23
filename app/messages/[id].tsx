import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { messagesApi } from "@/lib/api/messages";
import { useAuthStore } from "@/stores/auth-store";
import { resolveMediaUrl } from "@/lib/utils/media";

type MessageItem = {
  id: string;
  body: string;
  isMe: boolean;
  createdAt: string;
};

function formatMessageTime(isoString?: string) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { id, name, username, avatar } = useLocalSearchParams<{
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
  }>();

  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Auto-mark conversation as read on enter
  useEffect(() => {
    if (id && user) {
      messagesApi.markAsRead(id).then(() => {
        queryClient.invalidateQueries({ queryKey: ["inbox-unread-messages"] });
        queryClient.invalidateQueries({ queryKey: ["conversations-list"] });
      }).catch(() => {});
    }
  }, [id, user, queryClient]);

  const { data: messages, isLoading, isError, refetch } = useQuery<MessageItem[]>({
    queryKey: ["conversation-messages", id],
    queryFn: async () => {
      if (!id || !user) return [];
      const res = await messagesApi.getMessages(id, { limit: 50 });
      const items = Array.isArray(res.data) ? res.data : (res.data as any)?.results ?? [];
      const unread = items.some((m: any) => m.sender?.id !== user.id && m.sender?.username !== user.username && (m.is_read === false || m.isRead === false));
      if (unread) {
        messagesApi.markAsRead(id).then(() => {
          queryClient.invalidateQueries({ queryKey: ["inbox-unread-messages"] });
          queryClient.invalidateQueries({ queryKey: ["conversations-list"] });
        }).catch(() => {});
      }
      return items.map((m: any) => ({
        id: m.id,
        body: m.body,
        isMe: m.sender?.id === user.id || m.sender?.username === user.username,
        createdAt: m.created_at || m.createdAt || "",
      }));
    },
    enabled: !!id && !!user,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!id || !user) throw new Error("লগইন প্রয়োজন");
      const res = await messagesApi.sendMessage(id, { body: text });
      return res.data;
    },
    onSuccess: (newMsg, sentText) => {
      queryClient.setQueryData<MessageItem[]>(
        ["conversation-messages", id],
        (old = []) => [
          ...old,
          {
            id: newMsg.id || `msg-${Date.now()}`,
            body: sentText,
            isMe: true,
            createdAt: new Date().toISOString(),
          },
        ]
      );
      setInput((current) => current.trim() === sentText ? "" : current);
      queryClient.invalidateQueries({ queryKey: ["conversations-list"] });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: () => Alert.alert("মেসেজ পাঠানো যায়নি", "ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।"),
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const displayName = name || (username ? `@${username}` : "অজানা ব্যবহারকারী");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: Colors.surfaceDark, paddingTop: insets.top }}
    >
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between px-3 py-2.5 bg-white border-b border-border-light shadow-sm">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => router.back()} className="p-1 mr-1.5">
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => username && router.push(`/user/${username}`)}
            className="flex-row items-center flex-1"
          >
            {avatar ? (
              <Image
                source={{ uri: resolveMediaUrl(avatar) }}
                style={{ width: 38, height: 38, borderRadius: 19 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
            )}

            <View className="ml-2.5 flex-1">
              <Text className="text-sm font-bold text-text-primary" numberOfLines={1}>
                {displayName}
              </Text>

            </View>
          </TouchableOpacity>
        </View>

        {username ? (
          <TouchableOpacity
            onPress={() => router.push(`/user/${username}`)}
            className="w-8 h-8 rounded-full bg-surface-dark items-center justify-center border border-border-light"
          >
            <Ionicons name="information-circle-outline" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Messages List */}
      {!user ? (
        <View className="flex-1 items-center justify-center"><Text className="text-text-secondary">মেসেজ দেখতে সাইন ইন করুন</Text><TouchableOpacity onPress={() => router.push("/auth/login")} className="mt-3"><Text className="text-primary font-bold">সাইন ইন করুন</Text></TouchableOpacity></View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
          <Text className="text-xs text-text-muted mt-2">মেসেজ লোড হচ্ছে...</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center"><Text className="text-text-secondary">মেসেজ লোড করা যায়নি</Text><TouchableOpacity onPress={() => refetch()} className="mt-3"><Text className="text-primary font-bold">আবার চেষ্টা করুন</Text></TouchableOpacity></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View
              className={`mb-3 max-w-[80%] ${
                item.isMe ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <View
                className={`p-3.5 rounded-2xl ${
                  item.isMe
                    ? "bg-primary rounded-tr-sm"
                    : "bg-white border border-border-light rounded-tl-sm shadow-xs"
                }`}
              >
                <Text
                  className={`text-sm leading-5 ${
                    item.isMe ? "text-white font-medium" : "text-text-primary"
                  }`}
                >
                  {item.body}
                </Text>
              </View>
              <Text className="text-[10px] text-text-muted mt-1 px-1">
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-3">
                <Ionicons name="chatbubbles-outline" size={28} color={Colors.primary} />
              </View>
              <Text className="text-base font-bold text-text-primary">কথোপকথন শুরু করুন</Text>
              <Text className="text-xs text-text-muted mt-1 text-center">
                {displayName ? `${displayName}-কে আপনার বার্তা বা বই সংক্রান্ত প্রশ্ন পাঠিয়ে চ্যাট শুরু করুন।` : "বার্তা লিখে পাঠান।"}
              </Text>
            </View>
          }
        />
      )}

      {/* Input Field */}
      {user && <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="px-3 pt-2 bg-white border-t border-border-light flex-row items-center gap-2"
      >
        <View className="flex-1 flex-row items-center bg-surface-dark border border-border-light rounded-2xl px-3.5 py-1.5 min-h-[44px]">
          <TextInput
            className="flex-1 text-sm text-text-primary max-h-24"
            placeholder="একটি বার্তা লিখুন..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          className={`w-11 h-11 rounded-full items-center justify-center ${
            input.trim() ? "bg-primary shadow-sm" : "bg-slate-200"
          }`}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={input.trim() ? "#FFF" : Colors.textMuted}
            />
          )}
        </TouchableOpacity>
      </View>}
    </KeyboardAvoidingView>
  );
}
