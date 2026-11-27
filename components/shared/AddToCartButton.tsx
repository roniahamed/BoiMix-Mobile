import { useState } from "react";
import { Text, Pressable } from "react-native";
import { useCartStore } from "@/stores/cart-store";
import { useCartConfirmationStore } from "@/stores/cart-confirmation-store";
import type { BookCardBook } from "@/types/book";
import { Colors } from "@/constants/theme";
import { isCartReadyForCurrentAccount } from "@/lib/cart-ready";

export function AddToCartButton({ book }: { book: BookCardBook }) {
  const [pressed, setPressed] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const showConfirmation = useCartConfirmationStore((state) => state.show);
  const mode = book.availabilityMode as string | undefined;
  const canSell = !mode || mode === "sell" || mode === "for_sale" || (Number(book.price ?? 0) > 0 && mode !== "borrow" && mode !== "exchange" && mode !== "library");
  if (!canSell || book.isOutOfStock || book.availability === "out-of-stock") return null;

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        if (!isCartReadyForCurrentAccount()) return;
        showConfirmation(book.title);
        addItem(book);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Add ${book.title} to cart`}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ backgroundColor: pressed ? Colors.primarySoft : "transparent" }}
      className="mt-2 min-h-[44px] border border-primary rounded-lg py-2 px-2 items-center justify-center"
    >
      <Text className="text-sm font-bold text-primary" numberOfLines={1}>Add to Cart</Text>
    </Pressable>
  );
}
