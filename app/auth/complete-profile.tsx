import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import { Colors } from "@/constants/theme";

const schema = z.object({
  bio: z.string().max(300, "বায়ো ৩০০ অক্ষরের বেশি হতে পারবে না").optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { bio: "", location: "" },
  });

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "অনুমতি প্রয়োজন",
        "ছবি নির্বাচন করতে ফটো লাইব্রেরির অনুমতি দিন।",
        [{ text: "ঠিক আছে" }],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("ফাইল বড়", "৫MB-এর বেশি ছবি আপলোড করা যাবে না।");
        return;
      }

      setAvatarUri(asset.uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    setAvatarLoading(true);
    try {
      const filename = uri.split("/").pop() ?? "avatar.jpg";
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: filename,
        type: "image/jpeg",
      } as unknown as Blob);
      formData.append("type", "avatar");

      const response = await apiClient.post<{ url: string }>(
        API_ENDPOINTS.MEDIA.UPLOAD,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data.url;
    } catch {
      return null;
    } finally {
      setAvatarLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      let avatarUrl: string | undefined;

      if (avatarUri) {
        const uploaded = await uploadAvatar(avatarUri);
        if (uploaded) avatarUrl = uploaded;
      }

      await apiClient.patch(API_ENDPOINTS.ME.PROFILE, {
        bio: data.bio || undefined,
        location: data.location || undefined,
        avatar_url: avatarUrl,
        is_onboarded: true,
      });

      updateUser({ avatarUrl, isOnboarded: true });
      router.replace("/auth/choose-language");
    } catch {
      setError("root", { message: "প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
    }
  };

  const handleSkip = async () => {
    try {
      await apiClient.patch(API_ENDPOINTS.ME.PROFILE, { is_onboarded: true });
      updateUser({ isOnboarded: true });
    } catch {
      // best effort
    }
    router.replace("/tabs");
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
          title="প্রোফাইল সম্পন্ন করুন"
          subtitle="আপনার সম্পর্কে একটু বলুন"
          showBack={false}
        />

        <View className="px-6">
          {/* Avatar Picker */}
          <View className="items-center mb-6">
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} className="relative">
              <View className="w-24 h-24 rounded-full bg-surface-dark border-2 border-border items-center justify-center overflow-hidden">
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={44} color={Colors.textMuted} />
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-primary rounded-full w-8 h-8 items-center justify-center border-2 border-white shadow-sm">
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text className="text-sm text-text-secondary mt-2">
              ছবি যোগ করুন (ঐচ্ছিক)
            </Text>
          </View>

          {errors.root && (
            <View className="bg-red-50 border border-error rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-error">{errors.root.message}</Text>
            </View>
          )}

          {/* Bio */}
          <Controller
            control={control}
            name="bio"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="বায়ো (ঐচ্ছিক)"
                placeholder="নিজের সম্পর্কে সংক্ষেপে লিখুন..."
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.bio?.message}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
            )}
          />

          {/* Location */}
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="এলাকা (ঐচ্ছিক)"
                placeholder="যেমন: ঢাকা, মিরপুর"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.location?.message}
              />
            )}
          />

          <Button
            label={avatarLoading ? "আপলোড হচ্ছে..." : "সম্পন্ন করুন"}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || avatarLoading}
          />

          <Button
            label="এখন না, পরে করব"
            onPress={handleSkip}
            variant="ghost"
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
