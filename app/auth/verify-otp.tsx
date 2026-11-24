import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; mode?: "register" | "reset" }>();
  const setSession = useAuthStore((s) => s.setSession);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [errorMsg, setErrorMsg] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const inputRefs = useRef<any[]>(Array(OTP_LENGTH).fill(null));

  const handleVerify = useCallback(async (code: string) => {
    if (locked) return;
    if (code.length !== OTP_LENGTH) {
      setErrorMsg("৬ সংখ্যার কোড দিন");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const response = await authApi.verifyOtp({
        email: params.email,
        otp: code,
        mode: params.mode,
      });

      const accessToken = response.data.access_token || response.data.access || "";
      const refreshToken = response.data.refresh_token || response.data.refresh || "";

      if (params.mode === "reset") {
        // For reset mode, redirect to reset-password
        router.replace({
          pathname: "/auth/reset-password",
          params: { token: accessToken },
        });
        return;
      }

      // Register mode — save session
      await setSession(
        response.data.user,
        accessToken,
        refreshToken,
      );

      if (!response.data.user.isOnboarded) {
        router.replace("/auth/complete-profile");
      } else {
        router.replace("/tabs");
      }
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { code?: string } } };
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLocked(true);
        setErrorMsg("অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোডের জন্য অপেক্ষা করুন।");
      } else if (err.response?.data?.code === "otp_expired") {
        setErrorMsg("কোডের মেয়াদ শেষ হয়ে গেছে। নতুন কোড পাঠান।");
      } else {
        setErrorMsg(`ভুল কোড। আরও ${5 - newAttempts}টি চেষ্টা বাকি।`);
      }

      // Clear OTP input on error
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [locked, params.email, params.mode, router, setSession, wrongAttempts]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-submit when all digits filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH && !code.includes("")) {
      const timer = setTimeout(() => {
        void handleVerify(code);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [otp, handleVerify]);

  const handleChange = (text: string, index: number) => {
    setErrorMsg("");

    // Handle paste (6 digits at once)
    if (text.length === OTP_LENGTH) {
      const digits = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      if (digits.length === OTP_LENGTH) {
        setOtp(digits);
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        return;
      }
    }

    const digit = text.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };



  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await authApi.forgotPassword({ email: params.email });
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setWrongAttempts(0);
      setLocked(false);
      setErrorMsg("");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      Alert.alert("সফল", "নতুন কোড পাঠানো হয়েছে।");
    } catch {
      Alert.alert("ব্যর্থ", "কোড পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = params.email
    ? params.email.replace(/(.{2}).+(@.+)/, "$1***$2")
    : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{ paddingBottom: insets.bottom + 24 }}
        className="flex-1 bg-white"
      >
        <AuthHeader
          title="কোড যাচাই করুন"
          subtitle={`${maskedEmail} এ একটি ৬ সংখ্যার কোড পাঠানো হয়েছে`}
        />

        <View className="flex-1 px-6">
          {/* OTP Inputs */}
          <View className="flex-row justify-between mb-6">
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`
                  w-12 h-14 border-2 rounded-xl text-center text-xl font-bold
                  ${otp[index] ? "border-primary bg-primary/5 text-primary" : "border-border text-text-primary"}
                  ${errorMsg ? "border-error" : ""}
                `}
                maxLength={OTP_LENGTH} // Allow paste
                keyboardType="number-pad"
                value={otp[index]}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                selectTextOnFocus
                editable={!locked && !loading}
              />
            ))}
          </View>

          {/* Error */}
          {errorMsg ? (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error text-center">{errorMsg}</Text>
            </View>
          ) : null}

          {/* Verify Button */}
          <Button
            label="যাচাই করুন"
            onPress={() => handleVerify(otp.join(""))}
            loading={loading}
            disabled={otp.join("").length !== OTP_LENGTH || locked}
          />

          {/* Resend */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-text-secondary">
              কোড পাননি?{" "}
            </Text>
            {cooldown > 0 ? (
              <Text className="text-sm text-text-muted">
                {cooldown}s পরে পুনরায় পাঠান
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                <Text className="text-sm text-primary font-semibold">
                  {resendLoading ? "পাঠানো হচ্ছে..." : "পুনরায় পাঠান"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
