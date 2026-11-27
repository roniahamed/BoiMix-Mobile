import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from "react-native";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";


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

export const HeroBanner = memo(function HeroBanner({ items, autoScrollInterval = 4000 }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        flatListRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, autoScrollInterval);
  }, [items.length, autoScrollInterval, width]);

  useEffect(() => {
    if (items.length <= 1) return;
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, width, startAutoScroll]);

  const handleScrollBegin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleScrollEnd = () => {
    startAutoScroll();
  };

  if (!items.length) return null;

  return (
    <View className="mb-3">
      <ScrollView
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={(event) => {
          setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
          handleScrollEnd();
        }}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={{ width }}
            onPress={() => {
              if (item.link) {
                router.push(item.link as never);
              } else if (item.id === "2") {
                router.push({ pathname: "/search" as never, params: { mode: "exchange" } });
              } else {
                router.push("/search" as never);
              }
            }}
          >
            <View style={{ width: width - 32, height: Math.min((width - 32) * 0.43, 200), marginHorizontal: 16, borderRadius: 20, overflow: "hidden" }} className="relative">
              <Image
                source={resolveBannerSource(item.imageUrl)}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={300}
              />

              <View className="absolute top-3 bottom-3 left-5 justify-center" style={{ width: "52%" }}>
                <Text className="text-secondary font-bold text-xl leading-6" numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.subtitle && (
                  <Text className="text-text-primary text-sm mt-1" numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                )}
                <View className="bg-primary rounded-full self-start px-4 py-2 mt-2"><Text className="text-white font-bold text-xs">এখনই ঘুরে দেখুন  →</Text></View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {items.length > 1 && (
        <View style={{ position: "absolute", bottom: 10, left: 0, right: 0 }} className="flex-row justify-center gap-1.5">
          {items.map((_, i) => (
            <View
              key={i}
              className={`h-1.5 rounded-full ${
                i === activeIndex ? "bg-primary w-1.5" : "bg-white w-1.5"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
});
