import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { SocialButton } from "@/components/auth/SocialButton";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { Image } from "expo-image";

// ─── Validation Schema ────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "ইমেইল দিন")
    .email("সঠিক ইমেইল দিন"),
  password: z
    .string()
    .min(1, "পাসওয়ার্ড দিন")
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── API error → Bangla message ──────────────────────────────────────────────
function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "কিছু একটা সমস্যা হয়েছে";
  const err = error as { response?: { status?: number; data?: { detail?: string } }; code?: string };

  if (err.code === "ERR_NETWORK") return "ইন্টারনেট সংযোগ নেই";

  switch (err.response?.status) {
    case 400:
    case 401:
      return "ইমেইল বা পাসওয়ার্ড ভুল";
    case 403:
      return "অ্যাকাউন্ট নিষিদ্ধ করা হয়েছে";
    case 429:
      return "অনেকবার চেষ্টা করা হয়েছে। ৫ মিনিট পরে আবার চেষ্টা করুন";
    case 500:
    case 502:
    case 503:
      return "সার্ভারে সমস্যা হচ্ছে। একটু পরে চেষ্টা করুন";
    default:
      return "সাইন ইন করতে সমস্যা হচ্ছে";
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // ── Email/Password Login ──────────────────────────────────────────────────
  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authApi.login(data);
      const accessToken = response.data.access_token || response.data.access || "";
      const refreshToken = response.data.refresh_token || response.data.refresh || "";
      const user = response.data.user;

      await setSession(user, accessToken, refreshToken);

      // If onboarding not complete, redirect there
      if (!user.isOnboarded) {
        router.replace("/auth/complete-profile");
      } else {
        router.replace("/tabs");
      }
    } catch (error) {
      const msg = getErrorMessage(error);

      // Check if email needs verification
      const err = error as { response?: { data?: { code?: string } } };
      if (err.response?.data?.code === "email_not_verified") {
        Alert.alert(
          "ইমেইল ভেরিফাই করুন",
          "আপনার ইমেইল যাচাই করা হয়নি। ভেরিফিকেশন কোড পাঠাবো?",
          [
            { text: "না" },
            {
              text: "হ্যাঁ, পাঠাও",
              onPress: () =>
                router.push({
                  pathname: "/auth/verify-otp",
                  params: { email: data.email, mode: "register" },
                }),
            },
          ],
        );
        return;
      }

      setError("root", { message: msg });
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // TODO: Implement Firebase Google Auth
      // const { idToken } = await signInWithGoogle();
      // const response = await authApi.googleAuth({ id_token: idToken });
      // await setSession(response.data.user, response.data.access, response.data.refresh);
      // router.replace("/(tabs)/");
      Alert.alert("শীঘ্রই আসছে", "Google সাইন ইন খুব শীঘ্রই চালু হবে।");
    } catch {
      Alert.alert("ব্যর্থ হয়েছে", "Google সাইন ইন করা যায়নি।");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <View
          style={{ paddingTop: insets.top + 28 }}
          className="items-center px-6 pb-6"
        >
          <Image
            source={require("@/assets/images/boimix-logo.png")}
            style={{ width: 180, height: 56 }}
            contentFit="contain"
          />
          <Text className="text-xs text-text-secondary mt-2">
            আপনার বইয়ের দুনিয়া
          </Text>
        </View>

        <View className="px-6">
          <Text className="text-xl font-bold text-text-primary mb-1">
            সাইন ইন করুন
          </Text>
          <Text className="text-sm text-text-secondary mb-6">
            আপনার অ্যাকাউন্টে প্রবেশ করুন
          </Text>

          {/* Root Error */}
          {errors.root && (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error">{errors.root.message}</Text>
            </View>
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="ইমেইল"
                placeholder="example@email.com"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                autoComplete="email"
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="পাসওয়ার্ড"
                placeholder="আপনার পাসওয়ার্ড"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                autoComplete="password"
              />
            )}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push("/auth/forgot-password")}
            className="self-end mb-6"
          >
            <Text className="text-sm text-primary font-medium">
              পাসওয়ার্ড ভুলে গেছেন?
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <Button
            label="সাইন ইন"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          <Divider label="অথবা" />

          {/* Google */}
          <SocialButton
            provider="google"
            onPress={handleGoogleLogin}
            loading={googleLoading}
          />

          {/* Register Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-sm text-text-secondary">
              অ্যাকাউন্ট নেই?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text className="text-sm text-primary font-semibold">
                নিবন্ধন করুন
              </Text>
            </TouchableOpacity>
          </View>

          {/* Guest Link */}
          <View className="items-center mt-6">
            <TouchableOpacity onPress={() => router.replace("/tabs")}>
              <Text className="text-sm text-text-secondary font-medium underline">
                এখনই সাইন ইন না করে বই ব্রাউজ করুন
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
