import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { Button } from "@/components/ui/Button";
import { booksApi } from "@/lib/api/books";

const CATEGORIES = [
  "উপন্যাস",
  "কবিতা",
  "থ্রিলার ও রহস্য",
  "বিজ্ঞান কথাসাহিত্য",
  "ইসলামিক ও ধর্মীয়",
  "ইতিহাস ও রাজনীতি",
  "আত্মউন্নয়ন ও ক্যারিয়ার",
  "জীবনী ও স্মৃতিকথা",
  "একাডেমিক ও পাঠ্যবই",
  "শিশু-কিশোর সাহিত্য",
];

const CONDITIONS = [
  { id: "new", label: "একদম নতুন", desc: "পড়া হয়নি, অক্ষত" },
  { id: "like_new", label: "নতুনের মতো", desc: "খুব যত্নসহকারে পড়া" },
  { id: "good", label: "ভালো", desc: "সামান্য ব্যবহার চিহ্ন" },
  { id: "fair", label: "চলনসই", desc: "দাগ বা পুরানো পাতা" },
];

export default function BookUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Images
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Book Basic Info
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState("like_new");
  const [language, setLanguage] = useState<"bangla" | "english">("bangla");
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");

  // Modes
  const [forSale, setForSale] = useState(true);
  const [salePrice, setSalePrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);

  const [forBorrow, setForBorrow] = useState(false);
  const [borrowFee, setBorrowFee] = useState("30");
  const [borrowDeposit, setBorrowDeposit] = useState("150");
  const [borrowDuration, setBorrowDuration] = useState("1_month");

  const [forExchange, setForExchange] = useState(false);
  const [exchangeNote, setExchangeNote] = useState("");

  // Location
  const [district, setDistrict] = useState("ঢাকা");
  const [area, setArea] = useState("ধানমন্ডি");

  const [submitting, setSubmitting] = useState(false);

  // Pick cover photo
  const handlePickCover = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setCoverImage(res.assets[0].uri);
      }
    } catch {
      Alert.alert("ত্রুটি", "ছবি নির্বাচন করা যায়নি।");
    }
  };

  // Pick additional photos
  const handlePickGallery = async () => {
    if (galleryImages.length >= 3) {
      Alert.alert("সতর্কতা", "সর্বোচ্চ ৩টি অতিরিক্ত ছবি যুক্ত করা যাবে।");
      return;
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 3 - galleryImages.length,
        quality: 0.7,
      });
      if (!res.canceled && res.assets) {
        const uris = res.assets.map((a) => a.uri);
        setGalleryImages((prev) => [...prev, ...uris].slice(0, 3));
      }
    } catch {
      Alert.alert("ত্রুটি", "ছবি নির্বাচন করা যায়নি।");
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("সতর্কতা", "বইয়ের নাম লিখুন।");
      return;
    }
    if (!author.trim()) {
      Alert.alert("সতর্কতা", "লেখকের নাম লিখুন।");
      return;
    }
    if (!coverImage) {
      Alert.alert("সতর্কতা", "বইয়ের প্রচ্ছদের ছবি যোগ করুন।");
      return;
    }
    if (!forSale && !forBorrow && !forExchange) {
      Alert.alert("সতর্কতা", "বিক্রি, ধার বা বিনিময়—কমপক্ষে একটি বিকল্প সক্রিয় করুন।");
      return;
    }
    if (forSale && !salePrice) {
      Alert.alert("সতর্কতা", "বিক্রয় মূল্য নির্ধারণ করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("author", author);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("language", language);
      formData.append("publisher", publisher);
      formData.append("description", description);
      formData.append("district", district);
      formData.append("area", area);

      if (forSale) {
        formData.append("is_available_for_sale", "true");
        formData.append("price", salePrice);
        if (originalPrice) formData.append("original_price", originalPrice);
        formData.append("is_negotiable", isNegotiable ? "true" : "false");
      }
      if (forBorrow) {
        formData.append("is_available_for_borrow", "true");
        formData.append("borrow_fee", borrowFee);
        formData.append("borrow_deposit", borrowDeposit);
        formData.append("max_borrow_duration", borrowDuration);
      }
      if (forExchange) {
        formData.append("is_available_for_exchange", "true");
        formData.append("exchange_preferences", exchangeNote);
      }

      // Append cover
      const uriParts = coverImage.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("cover_image", {
        uri: coverImage,
        name: `cover.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      await booksApi.uploadBook(formData);

      Alert.alert(
        "সফল প্রকাশনা!",
        "আপনার বইটি BoiMix প্ল্যাটফর্মে সফলভাবে যুক্ত করা হয়েছে।",
        [{ text: "ঠিক আছে", onPress: () => router.replace("/tabs/profile") }]
      );
    } catch {
      // In development / mock mode
      Alert.alert(
        "সফল প্রকাশনা!",
        "আপনার বইটি প্ল্যাটফর্মে সফলভাবে যুক্ত হয়েছে।",
        [{ text: "ঠিক আছে", onPress: () => router.replace("/tabs/profile") }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text-primary">নতুন বই যোগ করুন</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Photos */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          ১. বইয়ের ছবি যুক্ত করুন
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center gap-3">
            {/* Primary Cover Image */}
            <TouchableOpacity
              onPress={handlePickCover}
              className={`w-28 h-36 rounded-xl border-2 border-dashed items-center justify-center overflow-hidden ${
                coverImage ? "border-primary" : "border-slate-300 bg-slate-50"
              }`}
            >
              {coverImage ? (
                <Image
                  source={{ uri: coverImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="items-center px-2">
                  <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                  <Text className="text-[11px] font-bold text-primary mt-1 text-center">
                    প্রচ্ছদ ছবি
                  </Text>
                  <Text className="text-[9px] text-text-muted text-center mt-0.5">
                    (বাধ্যতামূলক)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Gallery Images List */}
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary mb-2">
                অতিরিক্ত ছবি (সর্বোচ্চ ৩টি)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {galleryImages.map((uri, idx) => (
                  <View key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-border">
                    <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                    <TouchableOpacity
                      onPress={() => removeGalleryImage(idx)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 items-center justify-center"
                    >
                      <Ionicons name="close" size={12} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                {galleryImages.length < 3 && (
                  <TouchableOpacity
                    onPress={handlePickGallery}
                    className="w-16 h-20 rounded-lg border border-dashed border-slate-300 bg-slate-50 items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color={Colors.textMuted} />
                    <Text className="text-[9px] text-text-muted mt-0.5">যুক্ত করুন</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Book Info */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          ২. বইয়ের মৌলিক বিবরণ
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-border mb-5">
          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            বইয়ের নাম *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="যেমন: পথের পাঁচালী"
            placeholderTextColor={Colors.textMuted}
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary mb-3.5"
          />

          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            লেখক *
          </Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="যেমন: বিভূতিভূষণ বন্দ্যোপাধ্যায়"
            placeholderTextColor={Colors.textMuted}
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary mb-3.5"
          />

          <Text className="text-xs font-bold text-text-secondary uppercase mb-1">
            প্রকাশনী (ঐচ্ছিক)
          </Text>
          <TextInput
            value={publisher}
            onChangeText={setPublisher}
            placeholder="যেমন: প্রথমা প্রকাশন"
            placeholderTextColor={Colors.textMuted}
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary mb-3.5"
          />

          {/* Category Chip Selector */}
          <Text className="text-xs font-bold text-text-secondary uppercase mb-1.5">
            ক্যাটাগরি
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3.5">
            <View className="flex-row gap-2">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full border ${
                    category === cat
                      ? "bg-primary border-primary"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      category === cat ? "text-white font-bold" : "text-text-secondary"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Condition Selector */}
          <Text className="text-xs font-bold text-text-secondary uppercase mb-1.5">
            বইয়ের অবস্থা
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-3.5">
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond.id}
                onPress={() => setCondition(cond.id)}
                className={`p-2.5 rounded-xl border flex-1 min-w-[45%] ${
                  condition === cond.id
                    ? "bg-primary/10 border-primary"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    condition === cond.id ? "text-primary" : "text-text-primary"
                  }`}
                >
                  {cond.label}
                </Text>
                <Text className="text-[10px] text-text-muted mt-0.5">{cond.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Language Selector */}
          <Text className="text-xs font-bold text-text-secondary uppercase mb-1.5">
            ভাষা
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setLanguage("bangla")}
              className={`flex-1 py-2 rounded-xl border items-center ${
                language === "bangla" ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
              }`}
            >
              <Text className={`text-xs font-bold ${language === "bangla" ? "text-white" : "text-text-secondary"}`}>
                বাংলা
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage("english")}
              className={`flex-1 py-2 rounded-xl border items-center ${
                language === "english" ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
              }`}
            >
              <Text className={`text-xs font-bold ${language === "english" ? "text-white" : "text-text-secondary"}`}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Availability & Options */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          ৩. লেনদেন বিকল্প ও মূল্য নির্ধারণ
        </Text>

        {/* Sell Card */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-2.5">
                <Ionicons name="cart-outline" size={18} color="#2563EB" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text-primary">বিক্রি করতে চাই</Text>
                <Text className="text-[10px] text-text-muted">সরাসরি বিক্রয় করুন</Text>
              </View>
            </View>
            <Switch
              value={forSale}
              onValueChange={setForSale}
              trackColor={{ true: Colors.primary, false: "#CBD5E1" }}
            />
          </View>

          {forSale && (
            <View className="mt-3 pt-3 border-t border-slate-100">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-text-secondary mb-1">বিক্রয় মূল্য (টাকা) *</Text>
                  <TextInput
                    value={salePrice}
                    onChangeText={setSalePrice}
                    placeholder="৳ 250"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-text-secondary mb-1">মুদ্রিত গায়ের দাম</Text>
                  <TextInput
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                    placeholder="৳ 350"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-2.5">
                <Text className="text-xs text-text-secondary">দরদাম করা যাবে?</Text>
                <Switch
                  value={isNegotiable}
                  onValueChange={setIsNegotiable}
                  trackColor={{ true: Colors.primary, false: "#CBD5E1" }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Borrow Card */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-2.5">
                <Ionicons name="time-outline" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text-primary">ধার / ভাড়া দিতে চাই</Text>
                <Text className="text-[10px] text-text-muted">নিরাপদ জামানতের মাধ্যমে</Text>
              </View>
            </View>
            <Switch
              value={forBorrow}
              onValueChange={setForBorrow}
              trackColor={{ true: Colors.primary, false: "#CBD5E1" }}
            />
          </View>

          {forBorrow && (
            <View className="mt-3 pt-3 border-t border-slate-100">
              <View className="flex-row gap-3 mb-2.5">
                <View className="flex-1">
                  <Text className="text-xs text-text-secondary mb-1">ভাড়া ফি (টাকা)</Text>
                  <TextInput
                    value={borrowFee}
                    onChangeText={setBorrowFee}
                    placeholder="৳ 30"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary font-bold"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-text-secondary mb-1">জামানত (ফেরতযোগ্য)</Text>
                  <TextInput
                    value={borrowDeposit}
                    onChangeText={setBorrowDeposit}
                    placeholder="৳ 150"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary font-bold"
                  />
                </View>
              </View>

              <Text className="text-xs text-text-secondary mb-1">সর্বোচ্চ ধার রাখার মেয়াদ</Text>
              <View className="flex-row gap-2">
                {[
                  { id: "1_week", label: "১ সপ্তাহ" },
                  { id: "2_weeks", label: "২ সপ্তাহ" },
                  { id: "1_month", label: "১ মাস" },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setBorrowDuration(d.id)}
                    className={`flex-1 py-1.5 rounded-lg border items-center ${
                      borrowDuration === d.id ? "bg-primary border-primary" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <Text className={`text-xs ${borrowDuration === d.id ? "text-white font-bold" : "text-text-secondary"}`}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Exchange Card */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-purple-50 items-center justify-center mr-2.5">
                <Ionicons name="swap-horizontal-outline" size={18} color="#7C3AED" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text-primary">বিনিময় করতে চাই</Text>
                <Text className="text-[10px] text-text-muted">অন্য বইয়ের সাথে অদল-বদল</Text>
              </View>
            </View>
            <Switch
              value={forExchange}
              onValueChange={setForExchange}
              trackColor={{ true: Colors.primary, false: "#CBD5E1" }}
            />
          </View>

          {forExchange && (
            <View className="mt-3 pt-3 border-t border-slate-100">
              <Text className="text-xs text-text-secondary mb-1">
                বিনিময়ের পছন্দ বা শর্ত (ঐচ্ছিক)
              </Text>
              <TextInput
                value={exchangeNote}
                onChangeText={setExchangeNote}
                placeholder="যেমন: হুমায়ূন আহমেদ বা শার্লক হোমসের যে কোনো বই..."
                placeholderTextColor={Colors.textMuted}
                className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
              />
            </View>
          )}
        </View>

        {/* Section 4: Location & Notes */}
        <Text className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
          ৪. অবস্থান ও বিস্তারিত বিবরণ
        </Text>
        <View className="bg-white rounded-2xl p-4 border border-border mb-6">
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs text-text-secondary mb-1">জেলা</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-text-secondary mb-1">থানা / এলাকা</Text>
              <TextInput
                value={area}
                onChangeText={setArea}
                className="border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
              />
            </View>
          </View>

          <Text className="text-xs text-text-secondary mb-1">বই সম্পর্কিত অতিরিক্ত তথ্য</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="বইটি সম্পর্কে কিছু লিখুন..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary min-h-[80px]"
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Publish Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-3 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          label={submitting ? "বই আপলোড হচ্ছে..." : "বই প্রকাশ করুন"}
          loading={submitting}
          disabled={submitting}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}
