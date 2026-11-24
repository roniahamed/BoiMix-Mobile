import { useCallback, useMemo } from "react";
import { Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Animated, { cancelAnimation, scrollTo, useAnimatedRef, useFrameCallback, useReducedMotion, useSharedValue, withDecay } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type { BookCategory } from "@/types/book";

const ITEM_WIDTH = 69;
const GROUPS = [
  ["school", "স্কুল", "বিদ্যালয়", "primary", "প্রাথমিক"],
  ["college", "কলেজ", "hsc", "এইচএসসি", "একাদশ", "দ্বাদশ"],
  ["admission", "ভর্তি", "প্রবেশিকা"],
  ["academic", "education", "শিক্ষা", "একাডেমিক"],
  ["novel", "উপন্যাস"],
  ["islam", "ইসলাম", "ইসলামিক"],
];

type Entry = { category: BookCategory | null; key: string };
function priority(category: BookCategory) {
  const name = `${category.name} ${category.nameBn || ""} ${(category as BookCategory & { name_bn?: string }).name_bn || ""} ${category.slug}`.toLowerCase();
  const match = GROUPS.findIndex((group) => group.some((term) => name.includes(term)));
  return match < 0 ? GROUPS.length : match;
}

export function CategoryCarousel({ categories }: { categories: BookCategory[] }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const sorted = useMemo(() => [...categories].sort((a, b) => priority(a) - priority(b) || (b.count ?? 0) - (a.count ?? 0)), [categories]);
  const entries: Entry[] = useMemo(() => [{ category: null, key: "all" }, ...sorted.map((category) => ({ category, key: category.id }))], [sorted]);
  const cycle = entries.length * ITEM_WIDTH;
  const copies = sorted.length === 0 ? 1 : Math.max(3, Math.ceil(width / cycle) + 2);
  const repeated = useMemo(() => Array.from({ length: copies }, (_, index) => entries.map((entry) => ({ ...entry, key: `${entry.key}-${index}` }))).flat(), [copies, entries]);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const focused = useSharedValue(false);
  const touching = useSharedValue(false);
  const coasting = useSharedValue(false);
  const gestureStart = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    focused.set(true);
    return () => { focused.set(false); cancelAnimation(offset); coasting.set(false); };
  }, [focused, offset, coasting]));

  useFrameCallback((frame) => {
    if (!focused.get() || touching.get() || sorted.length === 0) return;
    if (coasting.get()) {
      const position = cycle + (((offset.get() % cycle) + cycle) % cycle);
      scrollTo(scrollRef, position, 0, false);
      return;
    }
    if (reducedMotion) return;
    const next = cycle + ((offset.get() + Math.min(frame.timeSincePreviousFrame ?? 0, 40) * 0.018) % cycle);
    offset.set(next);
    scrollTo(scrollRef, next, 0, false);
  });

  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      touching.set(true);
      cancelAnimation(offset);
      coasting.set(false);
      gestureStart.set(offset.get());
    })
    // Reanimated resolves this animated ref only when the gesture runs on the UI thread.
    // eslint-disable-next-line react-hooks/refs
    .onUpdate((event) => {
      const next = cycle + (((gestureStart.get() - event.translationX) % cycle + cycle) % cycle);
      offset.set(next);
      scrollTo(scrollRef, next, 0, false);
    })
    .onEnd((event) => {
      if (reducedMotion || Math.abs(event.velocityX) < 80) return;
      coasting.set(true);
      const velocity = Math.max(-2200, Math.min(2200, -event.velocityX));
      offset.set(withDecay({ velocity, deceleration: 0.99 }, (finished) => {
        if (finished) {
          offset.set(cycle + (((offset.get() % cycle) + cycle) % cycle));
          coasting.set(false);
        }
      }));
    })
    .onFinalize(() => { touching.set(false); }), [cycle, gestureStart, offset, scrollRef, touching, coasting, reducedMotion]);

  return (
    <GestureDetector gesture={pan} touchAction="pan-y">
    <Animated.ScrollView ref={scrollRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} style={{ marginBottom: 12 }}>
      {repeated.map(({ category, key }) => {
        const group = category ? priority(category) : -1;
        const icon = group === 0 || group === 1 || group === 2 || group === 3 ? "school-outline" : group === 5 ? "library-outline" : "book-outline";
        return <TouchableOpacity key={key} onPress={() => category ? router.push({ pathname: "/category/[slug]", params: { slug: category.slug, name: category.name, nameBn: category.nameBn || (category as BookCategory & { name_bn?: string }).name_bn || category.name } }) : router.push("/tabs/explore")} style={{ width: 62, marginRight: 7 }} className={`h-[68px] rounded-2xl items-center justify-center px-1 ${category ? "bg-white border border-border-light" : "bg-primary/10"}`} accessibilityRole="button">
          <Ionicons name={icon} size={24} color={category ? Colors.secondary : Colors.primary} /><Text className={`text-[10px] font-semibold text-center mt-1 ${category ? "text-text-primary" : "text-primary"}`} numberOfLines={2}>{category ? category.nameBn || (category as BookCategory & { name_bn?: string }).name_bn || category.name : "সব বই"}</Text>
        </TouchableOpacity>;
      })}
    </Animated.ScrollView>
    </GestureDetector>
  );
}
