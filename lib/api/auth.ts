import apiClient from "@/lib/api/client";
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
  confirm_password: string;
  terms_accepted: boolean;
};

export type AuthTokenResponse = {
  access: string;
  refresh: string;
  user: AuthUser;
};

export type OTPVerifyPayload = {
  email: string;
  otp: string;
  mode?: "register" | "reset";
};

export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = {
  token: string;
  new_password: string;
  confirm_password: string;
};

export type GoogleAuthPayload = { id_token: string };

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.LOGIN, payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<{ message: string; email: string }>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload,
    ),

  verifyOtp: (payload: OTPVerifyPayload) =>
    apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, payload),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload,
    ),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      payload,
    ),

  googleAuth: (payload: GoogleAuthPayload) =>
    apiClient.post<AuthTokenResponse>(API_ENDPOINTS.AUTH.GOOGLE, payload),

  getProfile: () =>
    apiClient.get<AuthUser>(API_ENDPOINTS.ME.PROFILE),

  logout: () =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => null), // best effort
};
