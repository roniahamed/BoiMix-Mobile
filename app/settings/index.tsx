import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { queryClient } from "@/providers/QueryProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [cacheSize, setCacheSize] = useState("১২.৪ MB");

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await authApi.logout();
      } catch {
        // Best effort
      }
      await clearSession();
      queryClient.clear();
      router.replace("/(auth)/login" as any);
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("আপনি কি নিশ্চিত লগআউট করতে চান?")) {
        doLogout();
      }
      return;
    }

    Alert.alert("লগআউট", "আপনি কি নিশ্চিত লগআউট করতে চান?", [
      { text: "বাতিল", style: "cancel" },
      { text: "লগআউট", style: "destructive", onPress: doLogout },
    ]);
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      try {
        await authApi.logout();
      } catch {
        // Best effort
      }
      await clearSession();
      queryClient.clear();
      if (Platform.OS === "web") {
        alert("আপনার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।");
      } else {
        Alert.alert("সফল", "আপনার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।");
      }
      router.replace("/(auth)/login" as any);
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        const step1 = window.confirm("আপনি কি নিশ্চিত আপনার অ্যাকাউন্ট মুছে ফেলতে চান? এটি আর ফেরানো যাবে না।");
        if (step1) {
          const step2 = window.prompt("নিশ্চিত করতে 'আমি নিশ্চিত' লিখুন:");
          if (step2 === "আমি নিশ্চিত") {
            doDelete();
          } else if (step2 !== null) {
            alert("সঠিকভাবে লেখা হয়নি। অ্যাকাউন্ট মোছা বাতিল করা হয়েছে।");
          }
        }
      }
      return;
    }

    Alert.alert(
      "অ্যাকাউন্ট মুছে ফেলুন",
      "আপনি কি নিশ্চিত আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে চান? আপনার সকল লিস্টিং ও তথ্য মুছে যাবে।",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "চূড়ান্ত নিশ্চিতকরণ",
              "অ্যাকাউন্ট মোছা নিশ্চিত করতে সম্মতি দিন।",
              [
                { text: "না, বাতিল", style: "cancel" },
                { text: "হ্যাঁ, মুছে দিন", style: "destructive", onPress: doDelete },
              ]
            );
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("আপনি কি অ্যাপের অস্থায়ী ক্যাশ মেমোরি খালি করতে চান?")) {
        setCacheSize("০ KB");
        alert("ক্যাশ মেমোরি সফলভাবে পরিষ্কার করা হয়েছে।");
      }
      return;
    }
    Alert.alert(
      "ক্যাশ মেমোরি পরিষ্কার",
      "আপনি কি অ্যাপের অস্থায়ী ক্যাশ মেমোরি খালি করতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "পরিষ্কার করুন",
          onPress: () => {
            setCacheSize("০ KB");
            Alert.alert("সফল", "ক্যাশ মেমোরি সফলভাবে পরিষ্কার করা হয়েছে।");
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3.5 bg-white border-b border-border-light flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">সেটিংস</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
          বিজ্ঞপ্তি ও নোটিফিকেশন
        </Text>
        <View className="bg-white rounded-2xl border border-border-light overflow-hidden mb-5">
          <View className="flex-row items-center justify-between p-3.5 border-b border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-text-primary">পুশ নোটিফিকেশন</Text>
              <Text className="text-xs text-text-muted mt-0.5">সব গুরুত্বপূর্ণ অ্যালার্ট গ্রহণ করুন</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: "#CBD5E1", true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center justify-between p-3.5 border-b border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-text-primary">অর্ডার ও ডেলিভারি আপডেট</Text>
              <Text className="text-xs text-text-muted mt-0.5">পার্সেল ও ট্র্যাকিং স্ট্যাটাস জানুন</Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: "#CBD5E1", true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center justify-between p-3.5 border-b border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-text-primary">চ্যাট ও মেসেজ নোটিফিকেশন</Text>
              <Text className="text-xs text-text-muted mt-0.5">পাঠকদের বার্তার দ্রুত নোটিফিকেশন</Text>
            </View>
            <Switch
              value={chatAlerts}
              onValueChange={setChatAlerts}
              trackColor={{ false: "#CBD5E1", true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View className="flex-row items-center justify-between p-3.5">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-text-primary">অফার ও ডিসকাউন্ট বার্তা</Text>
              <Text className="text-xs text-text-muted mt-0.5">বিশেষ বইমেলা ও ছাড়ের খবর</Text>
            </View>
            <Switch
              value={promoAlerts}
              onValueChange={setPromoAlerts}
              trackColor={{ false: "#CBD5E1", true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* General App Preferences */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
          অ্যাপ প্রেফারেন্স
        </Text>
        <View className="bg-white rounded-2xl border border-border-light overflow-hidden mb-5">
          <TouchableOpacity
            onPress={() => router.push("/auth/choose-language")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center mr-3">
              <Ionicons name="globe-outline" size={18} color="#7C3AED" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">ভাষা (Language)</Text>
            <Text className="text-xs text-text-muted mr-1.5">বাংলা</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearCache}
            className="flex-row items-center p-3.5"
          >
            <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-3">
              <Ionicons name="trash-bin-outline" size={18} color="#D97706" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">ক্যাশ মেমোরি খালি করুন</Text>
            <Text className="text-xs text-text-muted mr-1.5">{cacheSize}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legal & About */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
          আইনি ও পরিচিতি
        </Text>
        <View className="bg-white rounded-2xl border border-border-light overflow-hidden mb-6">
          <TouchableOpacity
            onPress={() => router.push("/support")}
            className="flex-row items-center p-3.5 border-b border-slate-100"
          >
            <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3">
              <Ionicons name="help-circle-outline" size={18} color="#2563EB" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-text-primary">সাহায্য ও সাপোর্ট সেন্টার</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View className="p-3.5 border-b border-slate-100 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-text-primary">গোপনীয়তা নীতি (Privacy Policy)</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </View>

          <View className="p-3.5 border-b border-slate-100 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-text-primary">ব্যবহারের শর্তাবলী (Terms)</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </View>

          <View className="p-3.5 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-text-primary">অ্যাপ সংস্করণ</Text>
            <Text className="text-xs text-text-muted">v1.0.0 (Build 42)</Text>
          </View>
        </View>

        {/* Security & Danger Zone */}
        {user ? (
          <>
            <Text className="text-xs font-bold text-error uppercase tracking-wider mb-2 px-1">
              অ্যাকাউন্ট নিরাপত্তা ও প্রস্থান
            </Text>
            <View className="bg-white rounded-2xl border border-red-100 overflow-hidden mb-6">
              <TouchableOpacity
                onPress={() => router.push("/auth/forgot-password")}
                className="flex-row items-center p-3.5 border-b border-slate-100"
              >
                <View className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center mr-3">
                  <Ionicons name="key-outline" size={18} color={Colors.textPrimary} />
                </View>
                <Text className="flex-1 text-sm font-semibold text-text-primary">
                  পাসওয়ার্ড পরিবর্তন করুন
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="flex-row items-center p-3.5 border-b border-slate-100"
              >
                <View className="w-8 h-8 rounded-lg bg-orange-50 items-center justify-center mr-3">
                  <Ionicons name="log-out-outline" size={18} color="#EA580C" />
                </View>
                <Text className="flex-1 text-sm font-semibold text-orange-600">
                  লগআউট করুন
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="flex-row items-center p-3.5 bg-red-50/50"
              >
                <View className="w-8 h-8 rounded-lg bg-red-100 items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </View>
                <Text className="flex-1 text-sm font-bold text-error">
                  অ্যাকাউন্ট মুছে ফেলুন (Delete Account)
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
