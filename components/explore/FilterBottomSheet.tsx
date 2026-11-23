import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useFilterStore } from "@/stores/filter-store";
import { Button } from "@/components/ui/Button";
import type { BookCondition, BookAvailabilityMode } from "@/types/book";

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
};

const MODE_OPTIONS: { value: BookAvailabilityMode; label: string }[] = [
  { value: "sell", label: "বিক্রয়" },
  { value: "exchange", label: "বিনিময়" },
  { value: "borrow", label: "ধার" },
];

const CONDITION_OPTIONS: { value: BookCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "excellent", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const DISTANCE_OPTIONS = [1, 5, 10, 20, 50];

const SORT_OPTIONS = [
  { value: "newest" as const, label: "সর্বশেষ" },
  { value: "rating" as const, label: "সর্বোচ্চ রেটিং" },
  { value: "price_low" as const, label: "কম দাম" },
  { value: "price_high" as const, label: "বেশি দাম" },
  { value: "distance" as const, label: "কাছের" },
];

function ChipButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`
        px-3.5 py-2 rounded-full border mr-2 mb-2
        ${selected ? "bg-primary border-primary" : "bg-white border-border"}
      `}
    >
      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-text-primary"}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function FilterBottomSheet({ visible, onClose, onApply }: Props) {
  const {
    mode, setMode,
    conditions, toggleCondition,
    distanceKm, setDistanceKm,
    sortBy, setSortBy,
    resetFilters,
    getActiveFilterCount,
  } = useFilterStore();

  const handleApply = () => {
    onApply();
    onClose();
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
      >
        <Pressable
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
          onPress={() => {}}
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1.5 bg-border rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
            <Text className="text-lg font-bold text-text-primary">ফিল্টার</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-sm text-primary font-medium">রিসেট করুন</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="max-h-96"
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Mode */}
            <Text className="text-sm font-semibold text-text-primary mb-2">
              বইয়ের ধরন
            </Text>
            <View className="flex-row flex-wrap mb-4">
              <ChipButton
                label="সব ধরন"
                selected={!mode}
                onPress={() => setMode(null)}
              />
              {MODE_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  label={opt.label}
                  selected={mode === opt.value}
                  onPress={() => setMode(mode === opt.value ? null : opt.value)}
                />
              ))}
            </View>

            {/* Condition */}
            <Text className="text-sm font-semibold text-text-primary mb-2">
              অবস্থা
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {CONDITION_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  label={opt.label}
                  selected={conditions.includes(opt.value)}
                  onPress={() => toggleCondition(opt.value)}
                />
              ))}
            </View>

            {/* Distance */}
            <Text className="text-sm font-semibold text-text-primary mb-2">
              দূরত্ব
            </Text>
            <View className="flex-row flex-wrap mb-4">
              <ChipButton
                label="যেকোনো দূরত্ব"
                selected={!distanceKm}
                onPress={() => setDistanceKm(null)}
              />
              {DISTANCE_OPTIONS.map((km) => (
                <ChipButton
                  key={km}
                  label={`${km} কিমি`}
                  selected={distanceKm === km}
                  onPress={() => setDistanceKm(distanceKm === km ? null : km)}
                />
              ))}
            </View>

            {/* Sort */}
            <Text className="text-sm font-semibold text-text-primary mb-2">
              সাজান
            </Text>
            <View className="flex-row flex-wrap mb-2">
              {SORT_OPTIONS.map((opt) => (
                <ChipButton
                  key={opt.value}
                  label={opt.label}
                  selected={sortBy === opt.value}
                  onPress={() => setSortBy(opt.value)}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-border">
            <Button
              label={`ফলাফল দেখুন${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()}টি ফিল্টার)` : ""}`}
              onPress={handleApply}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
