import { Alert, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";

export type PermissionResult = {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
};

/**
 * Open device system settings for BoiMix app
 */
export async function openAppSettings(): Promise<void> {
  if (Platform.OS === "web") {
    alert("আপনার ব্রাউজারের সাইট সেটিংস থেকে অনুমতি চালু করুন।");
    return;
  }
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert("ত্রুটি", "ডিভাইসের সেটিংস খোলা সম্ভব হয়নি।");
  }
}

/**
 * Request Location Permission with polite fallback explanation
 */
export async function requestLocationPermission(options: {
  showAlertOnDenial?: boolean;
} = { showAlertOnDenial: true }): Promise<PermissionResult> {
  if (Platform.OS === "web") {
    return { granted: true, canAskAgain: true, status: "granted" };
  }

  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) {
      return { granted: true, canAskAgain: current.canAskAgain, status: current.status };
    }

    if (!current.canAskAgain && options.showAlertOnDenial) {
      Alert.alert(
        "লোকেশন অনুমতি প্রয়োজন",
        "কাছের বই এবং বইপ্রেমীদের দূরত্ব দেখতে আপনার লোকেশন অনুমতি চালু রাখা প্রয়োজন। সেটিংস থেকে অনুমতি প্রদান করুন।",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "সেটিংস খুলুন", onPress: openAppSettings },
        ]
      );
      return { granted: false, canAskAgain: false, status: current.status };
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    if (!requested.granted && options.showAlertOnDenial) {
      Alert.alert(
        "অনুমতি বাতিল করা হয়েছে",
        "লোকেশন অনুমতি ছাড়া কাছাকাছি বইগুলোর সঠিক দূরত্ব গণনা করা সম্ভব হবে না।",
        [{ text: "ঠিক আছে" }]
      );
    }

    return {
      granted: requested.granted,
      canAskAgain: requested.canAskAgain,
      status: requested.status,
    };
  } catch {
    return { granted: false, canAskAgain: true, status: "undetermined" };
  }
}

/**
 * Request Camera Permission (for taking book photos / scanning ISBN)
 */
export async function requestCameraPermission(options: {
  showAlertOnDenial?: boolean;
} = { showAlertOnDenial: true }): Promise<PermissionResult> {
  if (Platform.OS === "web") {
    return { granted: true, canAskAgain: true, status: "granted" };
  }

  try {
    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) {
      return { granted: true, canAskAgain: current.canAskAgain, status: current.status };
    }

    if (!current.canAskAgain && options.showAlertOnDenial) {
      Alert.alert(
        "ক্যামেরা অনুমতি প্রয়োজন",
        "বইয়ের ছবি তুলতে বা ISBN স্ক্যান করতে ডিভাইসের ক্যামেরা অনুমতি চালু রাখা প্রয়োজন। সেটিংস থেকে অনুমতি প্রদান করুন।",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "সেটিংস খুলুন", onPress: openAppSettings },
        ]
      );
      return { granted: false, canAskAgain: false, status: current.status };
    }

    const requested = await ImagePicker.requestCameraPermissionsAsync();
    if (!requested.granted && options.showAlertOnDenial) {
      Alert.alert(
        "অনুমতি বাতিল করা হয়েছে",
        "ক্যামেরা অনুমতি না দিলে সরাসরি ছবি তোলা সম্ভব হবে না।",
        [{ text: "ঠিক আছে" }]
      );
    }

    return {
      granted: requested.granted,
      canAskAgain: requested.canAskAgain,
      status: requested.status,
    };
  } catch {
    return { granted: false, canAskAgain: true, status: "undetermined" };
  }
}

/**
 * Request Media Library / Photos Permission (for uploading book covers)
 */
export async function requestMediaLibraryPermission(options: {
  showAlertOnDenial?: boolean;
} = { showAlertOnDenial: true }): Promise<PermissionResult> {
  if (Platform.OS === "web") {
    return { granted: true, canAskAgain: true, status: "granted" };
  }

  try {
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (current.granted) {
      return { granted: true, canAskAgain: current.canAskAgain, status: current.status };
    }

    if (!current.canAskAgain && options.showAlertOnDenial) {
      Alert.alert(
        "গ্যালারি অনুমতি প্রয়োজন",
        "বইয়ের ছবি আপলোড করতে ফটো লাইব্রেরির অ্যাক্সেস প্রয়োজন। সেটিংস থেকে অনুমতি প্রদান করুন।",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "সেটিংস খুলুন", onPress: openAppSettings },
        ]
      );
      return { granted: false, canAskAgain: false, status: current.status };
    }

    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!requested.granted && options.showAlertOnDenial) {
      Alert.alert(
        "অনুমতি বাতিল করা হয়েছে",
        "গ্যালারির অনুমতি না দিলে মেমোরি থেকে ছবি নির্বাচন করা সম্ভব হবে না।",
        [{ text: "ঠিক আছে" }]
      );
    }

    return {
      granted: requested.granted,
      canAskAgain: requested.canAskAgain,
      status: requested.status,
    };
  } catch {
    return { granted: false, canAskAgain: true, status: "undetermined" };
  }
}

/**
 * Request Push Notification Permission
 */
export async function requestNotificationPermission(options: {
  showAlertOnDenial?: boolean;
} = { showAlertOnDenial: false }): Promise<PermissionResult> {
  if (Platform.OS === "web") {
    return { granted: false, canAskAgain: false, status: "unsupported" };
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return { granted: true, canAskAgain: current.canAskAgain, status: current.status };
    }

    if (!current.canAskAgain && options.showAlertOnDenial) {
      Alert.alert(
        "বিজ্ঞপ্তি অনুমতি প্রয়োজন",
        "অর্ডার আপডেট ও নতুন মেসেজের নোটিফিকেশন পেতে ডিভাইসের সেটিংস থেকে নোটিফিকেশন চালু করুন।",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "সেটিংস খুলুন", onPress: openAppSettings },
        ]
      );
      return { granted: false, canAskAgain: false, status: current.status };
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return {
      granted: requested.granted,
      canAskAgain: requested.canAskAgain,
      status: requested.status,
    };
  } catch {
    return { granted: false, canAskAgain: true, status: "undetermined" };
  }
}
