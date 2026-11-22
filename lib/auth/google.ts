import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

// BoiMix Google OAuth Client ID
export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  "784300988198-5dg7ruupm4q5akj2lln89nl5s6msttde.apps.googleusercontent.com";

/**
 * Loads Google Identity Services (GSI) script on web platforms.
 */
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || Platform.OS !== "web") {
      return resolve();
    }
    if ((window as any).google?.accounts?.oauth2) {
      return resolve();
    }

    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

/**
 * Requests a Google OAuth access token on Web using Google Identity Services (GSI).
 */
function promptGoogleLoginWeb(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleScript();
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        throw new Error("গুগল আইডেন্টিটি সার্ভিস লোড হতে ব্যর্থ হয়েছে।");
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        prompt: "select_account",
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error("গুগল থেকে অ্যাক্সেস টোকেন পাওয়া যায়নি।"));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Requests a Google OAuth token on Native (iOS/Android) using WebBrowser auth session.
 */
async function promptGoogleLoginNative(): Promise<string> {
  const redirectUrl = Linking.createURL("auth/google");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    GOOGLE_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    redirectUrl
  )}&response_type=token&scope=${encodeURIComponent(
    "openid email profile"
  )}&prompt=select_account`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

  if (result.type === "success" && result.url) {
    // Parse access_token or id_token from the hash fragment or query params
    const hashIndex = result.url.indexOf("#");
    const queryIndex = result.url.indexOf("?");
    const paramsString =
      hashIndex !== -1
        ? result.url.substring(hashIndex + 1)
        : queryIndex !== -1
        ? result.url.substring(queryIndex + 1)
        : "";

    const params = new URLSearchParams(paramsString);
    const token = params.get("access_token") || params.get("id_token");

    if (token) {
      return token;
    }
    throw new Error("গুগল থেকে অ্যাক্সেস টোকেন পাওয়া যায়নি।");
  } else if (result.type === "cancel" || result.type === "dismiss") {
    throw new Error("Google সাইন ইন বাতিল করা হয়েছে।");
  } else {
    throw new Error("Google সাইন ইন সম্পন্ন করা যায়নি।");
  }
}

/**
 * Primary Google Sign-in function for BoiMix mobile & web.
 * 1. Prompts user with Google OAuth.
 * 2. Receives OAuth token (access_token or id_token).
 * 3. Sends token to backend POST /api/v1/auth/google.
 * 4. Stores JWT tokens and user session in zustand / SecureStore.
 * 5. Returns authenticated user.
 */
export async function performGoogleSignIn(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    let token: string;
    if (Platform.OS === "web") {
      token = await promptGoogleLoginWeb();
    } else {
      token = await promptGoogleLoginNative();
    }

    if (!token) {
      return { success: false, error: "গুগল থেকে টোকেন পাওয়া যায়নি।" };
    }

    // Send token to BoiMix backend
    const response = await authApi.googleAuth({
      id_token: token,
      terms_accepted: true,
    });

    const data = response.data;
    const accessToken = data.access_token || data.access || "";
    const refreshToken = data.refresh_token || data.refresh || "";
    const user = data.user;

    if (!user || !accessToken) {
      return { success: false, error: "সার্ভার থেকে সঠিক ব্যবহারকারীর তথ্য পাওয়া যায়নি।" };
    }

    // Persist session
    await useAuthStore.getState().setSession(user, accessToken, refreshToken);
    return { success: true, user };
  } catch (err: any) {
    const errorMsg =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.response?.data?.error?.message ||
      err.message ||
      "Google সাইন ইন করা যায়নি।";
    return { success: false, error: errorMsg };
  }
}
