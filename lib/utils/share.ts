import { Platform, Share, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";

export interface ShareOptions {
  title: string;
  message?: string;
  url: string;
  successMessage?: string;
}

/**
 * Cross-platform share utility for BoiMix mobile and web.
 * - On Web with Web Share API: triggers native browser share sheet.
 * - On Web without Web Share API (desktop): copies link to clipboard and notifies user.
 * - On Native (Android/iOS): triggers OS share sheet, with clipboard fallback.
 */
export async function shareContent({
  title,
  message,
  url,
  successMessage = "লিংক ক্লিপবোর্ডে কপি করা হয়েছে।",
}: ShareOptions): Promise<boolean> {
  const shareText = message ? `${message}\n${url}` : url;

  if (Platform.OS === "web") {
    // 1. If Web Share API is available (e.g. mobile Safari / Chrome Android)
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text: message || title,
          url,
        });
        return true;
      } catch (err: any) {
        // User cancelled or dismissed share sheet
        if (err?.name === "AbortError") {
          return false;
        }
      }
    }

    // 2. Desktop Web Fallback: copy to clipboard
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert("শেয়ার লিংক", successMessage);
      return true;
    } catch {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          Alert.alert("শেয়ার লিংক", successMessage);
          return true;
        } catch {
          // Ignore
        }
      }
      return false;
    }
  }

  // 3. Native iOS / Android
  try {
    const result = await Share.share(
      Platform.OS === "ios"
        ? { title, message: message || title, url }
        : { title, message: shareText }
    );
    return result.action === Share.sharedAction;
  } catch (error) {
    // Fallback to clipboard if share sheet fails
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert("শেয়ার লিংক", successMessage);
      return true;
    } catch {
      return false;
    }
  }
}
