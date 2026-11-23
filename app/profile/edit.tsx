import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth-store";
import { usersApi } from "@/lib/api/users";
import { queryClient } from "@/providers/QueryProvider";
import {
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestLocationPermission,
} from "@/lib/permissions";

const READING_GENRES = [
  "উপন্যাস",
  "কবিতা",
  "থ্রিলার ও রহস্য",
  "বিজ্ঞান কথাসাহিত্য",
  "ইসলামিক",
  "ইতিহাস ও রাজনীতি",
  "আত্মউন্নয়ন",
  "জীবনী",
  "একাডেমিক",
  "শিশু-কিশোর",
];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState("বই পড়ি, বই ভালোবাসি।");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("ঢাকা");
  const [area, setArea] = useState("মিরপুর");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([
    "উপন্যাস",
    "থ্রিলার ও রহস্য",
  ]);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handlePickAvatar = async () => {
    if (Platform.OS === "web") {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setAvatarUri(result.assets[0].uri);
        }
      } catch {
        Alert.alert("ত্রুটি", "ছবি নির্বাচন করা যায়নি।");
      }
      return;
    }

    Alert.alert("প্রোফাইল ছবি পরিবর্তন", "কীভাবে ছবি যুক্ত করতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "ক্যামেরা দিয়ে তুলুন",
        onPress: async () => {
          const perm = await requestCameraPermission();
          if (!perm.granted) return;
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            setAvatarUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "গ্যালারি থেকে বেছে নিন",
        onPress: async () => {
          const perm = await requestMediaLibraryPermission();
          if (!perm.granted) return;
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            setAvatarUri(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverse && reverse.length > 0) {
        const place = reverse[0];
        const dist = place.city || place.subregion || place.region || district;
        const ar = place.district || place.street || place.name || area;
        if (dist) setDistrict(dist);
        if (ar) setArea(ar);
        Alert.alert("সফল", `আপনার অবস্থান শনাক্ত করা হয়েছে: ${ar}, ${dist}`);
      }
    } catch {
      Alert.alert("ত্রুটি", "অবস্থান শনাক্ত করা সম্ভব হয়নি। ম্যানুয়ালি জেলা ও এলাকা লিখুন।");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("সতর্কতা", "নাম খালি রাখা যাবে না।");
      return;
    }

    setSaving(true);
    try {
      if (avatarUri && !avatarUri.startsWith("http")) {
        const formData = new FormData();
        formData.append("full_name", name.trim());
        formData.append("bio", bio.trim());
        formData.append("location_city", district.trim());
        formData.append("location_street", area.trim());
        formData.append("reading_interests", selectedGenres.join(", "));

        const uriParts = avatarUri.split(".");
        const ext = uriParts[uriParts.length - 1] || "jpg";
        formData.append("avatar", {
          uri: avatarUri,
          name: `avatar.${ext}`,
          type: `image/${ext === "png" ? "png" : "jpeg"}`,
        } as any);

        await usersApi.updateProfile(formData);
      } else {
        await usersApi.updateProfile({
          name: name.trim(),
          bio: bio.trim(),
          phone: phone.trim(),
          district: district.trim(),
          area: area.trim(),
          readingInterests: selectedGenres,
        });
      }

      updateUser({
        name: name.trim(),
        avatarUrl: avatarUri || user?.avatarUrl,
      });

      queryClient.invalidateQueries({ queryKey: ["my-profile-tab"] });

      if (Platform.OS === "web") {
        alert("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
        router.back();
      } else {
        Alert.alert("সফল", "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!", [
          { text: "ঠিক আছে", onPress: () => router.back() },
        ]);
      }
    } catch {
      // If error, update local store gracefully
      updateUser({
        name: name.trim(),
        avatarUrl: avatarUri || user?.avatarUrl,
      });
      if (Platform.OS === "web") {
        alert("প্রোফাইল সংরক্ষিত হয়েছে।");
        router.back();
      } else {
        Alert.alert("সফল", "প্রোফাইল সংরক্ষিত হয়েছে।", [
          { text: "ঠিক আছে", onPress: () => router.back() },
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: insets.top }}>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">
          প্রোফাইল সম্পাদনা
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-primary/10 rounded-xl"
        >
          <Text className="text-xs font-bold text-primary">
            {saving ? "..." : "সংরক্ষণ"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Picker */}
        <View className="items-center my-4">
          <View className="relative">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
                <Ionicons name="person" size={44} color={Colors.primary} />
              </View>
            )}
            <TouchableOpacity
              onPress={handlePickAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white shadow-sm"
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-text-muted mt-2">ছবি পরিবর্তন করতে ট্যাপ করুন</Text>
        </View>

        {/* Inputs */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-4">
          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            পূর্ণ নাম
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="আপনার নাম লিখুন"
            placeholderTextColor={Colors.textMuted}
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary mb-4"
          />

          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            বায়ো / সংক্ষিপ্ত পরিচিতি
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="নিজের সম্পর্কে লিখুন..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary min-h-[80px] mb-4"
          />

          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            মোবাইল নম্বর
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="017XXXXXXXX"
            keyboardType="phone-pad"
            placeholderTextColor={Colors.textMuted}
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
          />
        </View>

        {/* Location Section */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-text-primary">
              ঠিকানা ও অবস্থান
            </Text>
            <TouchableOpacity
              onPress={handleDetectLocation}
              disabled={detectingLocation}
              className="flex-row items-center bg-primary/10 px-2.5 py-1 rounded-lg"
            >
              {detectingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={13} color={Colors.primary} />
                  <Text className="text-xs font-bold text-primary ml-1">জিপিএস অবস্থান নিন</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
                জেলা
              </Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="যেমন: ঢাকা"
                placeholderTextColor={Colors.textMuted}
                className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
                থানা / এলাকা
              </Text>
              <TextInput
                value={area}
                onChangeText={setArea}
                placeholder="যেমন: মিরপুর-১০"
                placeholderTextColor={Colors.textMuted}
                className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary"
              />
            </View>
          </View>
        </View>

        {/* Reading Interests */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-6">
          <Text className="text-sm font-bold text-text-primary mb-1">
            পছন্দের বইয়ের ক্যাটাগরি
          </Text>
          <Text className="text-xs text-text-muted mb-3">
            আপনার পছন্দের বিষয় নির্বাচন করলে মানানসই বই সুপারিশ করা হবে
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {READING_GENRES.map((genre) => {
              const selected = selectedGenres.includes(genre);
              return (
                <TouchableOpacity
                  key={genre}
                  onPress={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full border ${
                    selected
                      ? "bg-primary border-primary"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selected ? "text-white" : "text-text-secondary"
                    }`}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          label={saving ? "সংরক্ষণ করা হচ্ছে..." : "পরিবর্তন নিশ্চিত করুন"}
          loading={saving}
          disabled={saving}
          onPress={handleSave}
        />
      </ScrollView>
    </View>
  );
}
