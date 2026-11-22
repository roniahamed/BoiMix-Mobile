import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { authApi } from "@/lib/api/auth";

const schema = z.object({
  email: z.string().min(1, "ইমেইল দিন").email("সঠিক ইমেইল দিন"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data);
      // Generic success — don't reveal if email exists (security best practice)
      router.push({
        pathname: "/auth/verify-otp",
        params: { email: data.email, mode: "reset" },
      });
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === "ERR_NETWORK") {
        setError("root", { message: "ইন্টারনেট সংযোগ নেই" });
      } else {
        // Show generic message — don't reveal if email exists
        router.push({
          pathname: "/auth/verify-otp",
          params: { email: data.email, mode: "reset" },
        });
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
        <AuthHeader
          title="পাসওয়ার্ড পুনরুদ্ধার"
          subtitle="আপনার ইমেইলে একটি রিসেট কোড পাঠানো হবে"
        />

        <View className="px-6">
          {errors.root && (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error">{errors.root.message}</Text>
            </View>
          )}

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

          <Button
            label="রিসেট কোড পাঠান"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
