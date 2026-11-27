import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { secureStorage, TOKEN_KEYS } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { Colors } from "@/constants/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { isHydrated, clearSession } = useAuthStore();
  const [entrance] = useState(() => new Animated.Value(0));
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        entrance.setValue(1);
      } else {
        animation = Animated.timing(entrance, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        animation.start();
      }
    }).catch(() => entrance.setValue(1));
    return () => { active = false; animation?.stop(); };
  }, [entrance]);

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function checkAuth() {
      try {
        const token = await secureStorage.getItem(TOKEN_KEYS.ACCESS);
        if (token) {
          const response = await authApi.getProfile();
          if (!response.data) await clearSession();
        }
      } catch (error: any) {
        // A temporary network failure must not sign the user out or discard account state.
        if (error?.response?.status === 401 || error?.response?.status === 403) await clearSession();
      }
      if (!active) return;
      const remaining = Math.max(0, 750 - (Date.now() - startedAt));
      timer = setTimeout(() => { if (active) router.replace("/tabs"); }, remaining);
    }
    checkAuth();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [isHydrated, clearSession, router, startedAt]);

  return (
    <View className="flex-1 bg-surface-dark items-center justify-center overflow-hidden" accessibilityLabel="BoiMix চালু হচ্ছে">
      <View pointerEvents="none" className="absolute rounded-full bg-primary/10" style={{ width: 250, height: 250, top: -100, right: -80 }} />
      <View pointerEvents="none" className="absolute rounded-full bg-primary/10" style={{ width: 300, height: 300, bottom: -150, left: -100 }} />
      <Animated.View style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) }] }} className="items-center px-8">
        <View className="bg-white rounded-3xl px-7 py-6 items-center justify-center border border-border-light shadow-sm">
          <Image source={require("@/assets/images/boimix-logo.png")} resizeMode="contain" style={{ width: 210, height: 76 }} accessibilityLabel="BoiMix" />
        </View>
        <Text className="text-secondary text-base font-semibold mt-5">আপনার বইয়ের দুনিয়া</Text>
        <View className="flex-row items-center gap-2 mt-3">
          <Ionicons name="book-outline" size={16} color={Colors.primary} />
          <Text className="text-text-secondary text-xs">পড়ুন · খুঁজুন · ভাগ করে নিন</Text>
        </View>
      </Animated.View>
    </View>
  );
}
