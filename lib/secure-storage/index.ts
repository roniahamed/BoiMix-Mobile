import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";
const CHUNK_SIZE = 1900; // SecureStore limit is ~2048 bytes, keep safe margin

/** Save a potentially large value by chunking if necessary */
async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    // Clear any old chunks
    await SecureStore.deleteItemAsync(`${key}_chunk_count`).catch(() => null);
    return;
  }

  // Split into chunks
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(`${key}_chunk_${index}`, chunk),
    ),
  );
  await SecureStore.setItemAsync(`${key}_chunk_count`, String(chunks.length));
}

/** Retrieve a potentially chunked value */
async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  const countStr = await SecureStore.getItemAsync(`${key}_chunk_count`).catch(
    () => null,
  );

  if (!countStr) {
    return SecureStore.getItemAsync(key).catch(() => null);
  }

  const count = parseInt(countStr, 10);
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      SecureStore.getItemAsync(`${key}_chunk_${i}`).catch(() => ""),
    ),
  );

  return chunks.join("") || null;
}

/** Remove a potentially chunked value */
async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }

  const countStr = await SecureStore.getItemAsync(`${key}_chunk_count`).catch(
    () => null,
  );

  if (countStr) {
    const count = parseInt(countStr, 10);
    await Promise.all([
      ...Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}_chunk_${i}`).catch(() => null),
      ),
      SecureStore.deleteItemAsync(`${key}_chunk_count`).catch(() => null),
    ]);
  } else {
    await SecureStore.deleteItemAsync(key).catch(() => null);
  }
}

export const secureStorage = {
  setItem,
  getItem,
  removeItem,
};

// Zustand persist storage adapter
export const zustandSecureStorage = {
  getItem: async (name: string) => {
    const value = await secureStorage.getItem(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await secureStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await secureStorage.removeItem(name);
  },
};
