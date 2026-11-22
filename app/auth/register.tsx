import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { authApi } from "@/lib/api/auth";

// ─── Validation ───────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, "নাম দিন")
      .min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে")
      .max(50, "নাম ৫০ অক্ষরের বেশি হতে পারবে না"),
    email: z.string().min(1, "ইমেইল দিন").email("সঠিক ইমেইল দিন"),
    password: z
      .string()
      .min(1, "পাসওয়ার্ড দিন")
      .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "পাসওয়ার্ডে অক্ষর ও সংখ্যা উভয়ই থাকতে হবে",
      ),
    confirm_password: z.string().min(1, "পাসওয়ার্ড নিশ্চিত করুন"),
    terms_accepted: z
      .boolean()
      .refine((v) => v === true, "শর্তাবলী মেনে নিতে হবে"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "পাসওয়ার্ড মিলছে না",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Password strength helper ─────────────────────────────────────────────────
function getPasswordStrength(password: string): {
  label: string;
  color: string;
  width: string;
} {
  if (password.length === 0) return { label: "", color: "", width: "0%" };
  if (password.length < 6) return { label: "দুর্বল", color: "#EF4444", width: "25%" };
  if (password.length < 8) return { label: "মোটামুটি", color: "#F59E0B", width: "50%" };
  if (/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password))
    return { label: "শক্তিশালী", color: "#10B981", width: "100%" };
  if (/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(password))
    return { label: "ভালো", color: "#3B82F6", width: "75%" };
  return { label: "মোটামুটি", color: "#F59E0B", width: "50%" };
}

// ─── Error messages ───────────────────────────────────────────────────────────
function getErrorMessage(error: unknown): string {
  const err = error as { code?: string; response?: { status?: number; data?: Record<string, string[]> } };
  if (err.code === "ERR_NETWORK") return "ইন্টারনেট সংযোগ নেই";

  if (err.response?.status === 400) {
    const data = err.response.data ?? {};
    if (data.email) return "এই ইমেইল আগে থেকেই নিবন্ধিত";
    return "তথ্য সঠিক নয়। আবার চেক করুন";
  }
  if (err.response?.status === 429) return "অনেকবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন";
  return "নিবন্ধন করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন";
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      terms_accepted: false,
    },
  });

  const passwordValue = watch("password");
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await authApi.register(data);
      // Redirect to OTP screen with email
      router.push({
        pathname: "/auth/verify-otp",
        params: { email: data.email, mode: "register" },
      });
    } catch (error) {
      setError("root", { message: getErrorMessage(error) });
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
        <AuthHeader
          title="নিবন্ধন করুন"
          subtitle="নতুন অ্যাকাউন্ট তৈরি করুন"
        />

        <View className="px-6">
          {/* Root Error */}
          {errors.root && (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error">{errors.root.message}</Text>
            </View>
          )}

          {/* Full Name */}
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="পূর্ণ নাম"
                placeholder="আপনার নাম লিখুন"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.full_name?.message}
                autoCapitalize="words"
                autoComplete="name"
              />
            )}
          />

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
              <View>
                <Input
                  label="পাসওয়ার্ড"
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  autoComplete="new-password"
                />
                {/* Strength bar */}
                {passwordValue.length > 0 && (
                  <View className="mb-3 -mt-2">
                    <View className="h-1 bg-border-light rounded-full overflow-hidden">
                      <View
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                          height: "100%",
                          borderRadius: 999,
                        }}
                      />
                    </View>
                    <Text
                      style={{ color: strength.color }}
                      className="text-xs mt-0.5"
                    >
                      পাসওয়ার্ড শক্তি: {strength.label}
                    </Text>
                  </View>
                )}
              </View>
            )}
          />

          {/* Confirm Password */}
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
                autoComplete="new-password"
              />
            )}
          />

          {/* Terms */}
          <View className="mb-6">
            <Controller
              control={control}
              name="terms_accepted"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  checked={value}
                  onChange={onChange}
                  error={errors.terms_accepted?.message}
                  label={
                    <Text className="text-sm text-text-secondary leading-5">
                      আমি BoiMix-এর{" "}
                      <Text className="text-primary font-medium">
                        শর্তাবলী
                      </Text>{" "}
                      এবং{" "}
                      <Text className="text-primary font-medium">
                        গোপনীয়তা নীতি
                      </Text>{" "}
                      মেনে নিচ্ছি
                    </Text>
                  }
                />
              )}
            />
          </View>

          <Button
            label="নিবন্ধন করুন"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-text-secondary">
              আগে থেকেই অ্যাকাউন্ট আছে?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text className="text-sm text-primary font-semibold">
                সাইন ইন করুন
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
