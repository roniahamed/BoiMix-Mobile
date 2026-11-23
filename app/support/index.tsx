import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { messagesApi } from "@/lib/api/messages";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "কিভাবে BoiMix-এ বই বিক্রি বা লিস্টিং করব?",
    answer:
      "বই বিক্রি করতে নিচের 'বিক্রি' ট্যাবে যান অথবা প্রোফাইল থেকে '+ নতুন বই যোগ' বাটনে ট্যাপ করুন। এরপর বইয়ের ছবি, নাম, লেখক, অবস্থা ও বিক্রয়মূল্য দিয়ে প্রকাশ করুন।",
  },
  {
    id: "faq-2",
    question: "বই ধার নেওয়ার নিয়ম ও জামানত ফেরত পাওয়ার পদ্ধতি কি?",
    answer:
      "ধারযোগ্য বইয়ের পাতায় গিয়ে সময়কাল (১ সপ্তাহ / ২ সপ্তাহ / ১ মাস) নির্বাচন করে ধার আবেদন করুন। বই ফেরত দেওয়ার পর সিকিউরিটি জামানতের টাকা স্বয়ংক্রিয়ভাবে ফেরত প্রদান করা হয়।",
  },
  {
    id: "faq-3",
    question: "বই বিনিময় (Exchange) কিভাবে কাজ করে?",
    answer:
      "বিনিময়যোগ্য বইয়ের পৃষ্ঠায় 'বিনিময়ের প্রস্তাব পাঠান' এ চাপুন এবং আপনার তালিকাভুক্ত যেকোনো একটি বই অফার করুন। অপর পাঠক প্রস্তাব গ্রহণ করলে আপনারা সরাসরি বা কুরিয়ারের মাধ্যমে বই অদলবদল করতে পারবেন।",
  },
  {
    id: "faq-4",
    question: "কুরিয়ার ডেলিভারি চার্জ কত এবং কতদিনে বই পৌঁছাবে?",
    answer:
      "পাঠাও ও বিশ্বস্ত কুরিয়ার পার্টনারদের মাধ্যমে দেশব্যাপী ডেলিভারি দেওয়া হয়। সাধারণত স্ট্যান্ডার্ড ডেলিভারি চার্জ ৬০ টাকা এবং ২ থেকে ৩ কার্যদিবসের মধ্যে বই পৌঁছে যায়।",
  },
  {
    id: "faq-5",
    question: "পেমেন্ট কি নিরাপদ এবং কি কি মাধ্যমে পেমেন্ট করা যায়?",
    answer:
      "হ্যাঁ, BoiMix-এর প্রতিটি লেনদেন এনক্রিপ্টেড ও সম্পূর্ণ সুরক্ষিত। আপনি বিকাশ, নগদ, রকেট, কার্ড এবং ক্যাশ অন ডেলিভারি (COD)-এর মাধ্যমে মূল্য পরিশোধ করতে পারবেন।",
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<string | null>("faq-1");

  const user = useAuthStore((s) => s.user);
  const [chatLoading, setChatLoading] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleLiveChat = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setChatLoading(true);
    try {
      const res = await messagesApi.getSupportConversation();
      const conv = res.data;
      router.push({
        pathname: "/messages/[id]",
        params: {
          id: conv.id,
          name: "BoiMix সাপোর্ট টিম",
          username: "support",
        },
      });
    } catch {
      Alert.alert("সাপোর্ট চ্যাট খোলা যায়নি", "আবার চেষ্টা করুন।");
    } finally {
      setChatLoading(false);
    }
  };

  const handleCall = () => {
    Linking.openURL("tel:+8801700000000").catch(() => {});
  };

  const handleEmail = () => {
    Linking.openURL("mailto:support@boimix.com").catch(() => {});
  };

  return (
    <View className="flex-1 bg-surface-dark" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-4 py-3.5 bg-white border-b border-border-light flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary">সাহায্য ও সাপোর্ট</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Banner */}
        <View className="bg-primary rounded-3xl p-6 mb-5 shadow-sm">
          <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mb-3">
            <Ionicons name="headset" size={26} color="#FFF" />
          </View>
          <Text className="text-xl font-bold text-white">আমরা আপনাকে সাহায্য করতে প্রস্তুত</Text>
          <Text className="text-xs text-white/85 mt-1.5 leading-5">
            অর্ডার, ডেলিভারি, বই ধার বা পেমেন্ট সংক্রান্ত যেকোনো সমস্যায় আমাদের সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন।
          </Text>

          <TouchableOpacity
            onPress={handleLiveChat}
            disabled={chatLoading}
            activeOpacity={0.85}
            className="bg-white rounded-xl py-3 px-4 mt-5 flex-row items-center justify-center gap-2"
          >
            {chatLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
                <Text className="text-xs font-bold text-primary">
                  লাইভ চ্যাট শুরু করুন
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Contact Methods */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5 px-1">
          সরাসরি যোগাযোগ
        </Text>
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.75}
            className="flex-1 bg-white p-4 rounded-2xl border border-border-light items-center shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mb-2">
              <Ionicons name="call-outline" size={20} color="#059669" />
            </View>
            <Text className="text-xs font-bold text-text-primary">হেল্পলাইন</Text>
            <Text className="text-[10px] text-text-muted mt-0.5">সকাল ৯টা - রাত ১০টা</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            activeOpacity={0.75}
            className="flex-1 bg-white p-4 rounded-2xl border border-border-light items-center shadow-xs"
          >
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mb-2">
              <Ionicons name="mail-outline" size={20} color="#2563EB" />
            </View>
            <Text className="text-xs font-bold text-text-primary">ইমেইল সাপোর্ট</Text>
            <Text className="text-[10px] text-text-muted mt-0.5">support@boimix.com</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5 px-1">
          সাধারণ জিজ্ঞাসা (FAQ)
        </Text>
        <View className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-xs mb-6">
          {FAQS.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            const isLast = index === FAQS.length - 1;

            return (
              <View
                key={faq.id}
                className={`${!isLast ? "border-b border-slate-100" : ""}`}
              >
                <TouchableOpacity
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                  className="p-4 flex-row items-center justify-between"
                >
                  <Text className="text-sm font-semibold text-text-primary flex-1 mr-3 leading-5">
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View className="px-4 pb-4 pt-1 bg-slate-50/60">
                    <Text className="text-xs text-text-secondary leading-5">
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
