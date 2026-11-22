import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { authApi } from "@/lib/api/auth";

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে",
      ),
    confirm_password: z.string().min(1, "পাসওয়ার্ড নিশ্চিত করুন"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token: string }>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.resetPassword({
        token: params.token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      Alert.alert(
        "সফল",
        "পাসওয়ার্ড পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।",
        [{ text: "ঠিক আছে", onPress: () => router.replace("/auth/login") }],
      );
    } catch (error) {
      const err = error as { code?: string; response?: { status?: number } };
      if (err.code === "ERR_NETWORK") {
        setError("root", { message: "ইন্টারনেট সংযোগ নেই" });
      } else if (err.response?.status === 400) {
        setError("root", { message: "লিংকের মেয়াদ শেষ হয়ে গেছে। আবার চেষ্টা করুন।" });
      } else {
        setError("root", { message: "পাসওয়ার্ড পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।" });
      }
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
      >
        <AuthHeader title="নতুন পাসওয়ার্ড" subtitle="নতুন পাসওয়ার্ড সেট করুন" />

        <View className="px-6">
          {errors.root && (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error">{errors.root.message}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="new_password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="নতুন পাসওয়ার্ড"
                placeholder="কমপক্ষে ৮ অক্ষর"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.new_password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="পাসওয়ার্ড নিশ্চিত করুন"
                placeholder="পাসওয়ার্ড আবার লিখুন"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirm_password?.message}
              />
            )}
          />

          <Button
            label="পাসওয়ার্ড পরিবর্তন করুন"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
