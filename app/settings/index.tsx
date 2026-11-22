import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [cacheSize, setCacheSize] = useState("১২.৪ MB");

  const handleClearCache = () => {
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
      </ScrollView>
    </View>
  );
}
