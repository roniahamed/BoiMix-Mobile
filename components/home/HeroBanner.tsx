import { View, Text, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";

const { width } = Dimensions.get("window");

type BannerItem = {
  id: string;
  imageUrl: any;
  title: string;
  subtitle?: string;
  link?: string;
};

function resolveBannerSource(source: any) {
  if (!source) return undefined;
  if (typeof source === "string") return { uri: source };
  if (typeof source === "number") return source;
  if (source.default) {
    return typeof source.default === "string" ? { uri: source.default } : source.default;
  }
  if (source.uri && typeof source.uri === "string") return source;
  return source;
}

type Props = {
  items: BannerItem[];
  autoScrollInterval?: number;
};

export function HeroBanner({ items, autoScrollInterval = 4000 }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = () => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoScrollInterval);
  };

  useEffect(() => {
    if (items.length <= 1) return;
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  const handleScrollBegin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleScrollEnd = () => {
    startAutoScroll();
  };

  if (!items.length) return null;

  return (
    <View className="mb-5">
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
          handleScrollEnd();
        }}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.95} style={{ width }}>
            <View style={{ width, height: 180 }} className="relative">
              <Image
                source={resolveBannerSource(item.imageUrl)}
                style={{ width, height: 180 }}
                contentFit="cover"
                transition={300}
              />
              <View className="absolute inset-0 bg-black/30" />
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-white font-bold text-lg" numberOfLines={2}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-white/80 text-sm mt-0.5" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Pagination dots */}
      {items.length > 1 && (
        <View className="flex-row justify-center mt-2 gap-1.5">
          {items.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                i === activeIndex ? "bg-primary w-4" : "bg-border w-1.5"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
