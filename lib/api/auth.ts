import apiClient, { secureStorage, TOKEN_KEYS } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { AuthUser } from "@/types/user";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  confirm_password?: string;
  terms_accepted: boolean;
};

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  access?: string;
  refresh?: string;
  user: AuthUser;
};

export type OTPVerifyPayload = {
  email: string;
  otp: string;
  purpose?: "email_verification" | "phone_verification" | "login" | "password_reset";
  mode?: "register" | "reset";
};

export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = {
  token: string;
  new_password: string;
  confirm_password?: string;
};

export type GoogleAuthPayload = {
  id_token: string;
  terms_accepted?: boolean;
};

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    return res;
  },

  register: (payload: RegisterPayload) =>
    apiClient.post<{ detail: string; email: string; email_verified: boolean }>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        email: payload.email,
        password: payload.password,
        full_name: payload.full_name,
        phone: payload.phone || "",
        terms_accepted: payload.terms_accepted,
      },
    ),

  sendOtp: (payload: { email: string; purpose?: string }) =>
    apiClient.post<{ detail: string; cooldown_remaining_seconds: number }>(
      API_ENDPOINTS.AUTH.SEND_OTP,
      {
        email: payload.email,
        purpose: payload.purpose || "email_verification",
      },
    ),

  verifyOtp: (payload: OTPVerifyPayload) =>
    apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      email: payload.email,
      otp_code: payload.otp,
      purpose: payload.purpose || "email_verification",
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<{ detail: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload,
    ),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<{ detail: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        token: payload.token,
        new_password: payload.new_password,
      },
    ),

  googleAuth: (payload: GoogleAuthPayload) =>
    apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.GOOGLE, payload),

  getProfile: () =>
    apiClient.get<AuthUser>(API_ENDPOINTS.PROFILES.ME),

  logout: async () => {
    try {
      const refreshToken = await secureStorage.getItem(TOKEN_KEYS.REFRESH);
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh_token: refreshToken });
      }
    } catch {
      // Best effort logout
    }
  },
};
