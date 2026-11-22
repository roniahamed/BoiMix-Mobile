import { Platform } from "react-native";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";

export type PaymentIntent = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method_code: string;
  provider_transaction_id?: string;
  created_at: string;
  expires_at?: string;
};

export type EPSInitializeResponse = {
  payment_intent_id: string;
  redirect_url: string;
  provider: "eps";
};

export type EPSVerifyResponse = {
  id: string;
  status: string;
  amount: string;
  order_id?: string;
  order_number?: string;
  verified: boolean;
};

export const paymentsApi = {
  /**
   * Create an escrow payment intent for checkout.
   */
  createIntent: (payload: { order_id?: string; amount: number; method_code?: "eps" | "cod" }) =>
    apiClient.post<PaymentIntent>(API_ENDPOINTS.PAYMENTS.INTENTS, {
      method_code: payload.method_code || "eps",
      amount: payload.amount,
      purpose: "marketplace_checkout",
      metadata: payload.order_id ? { order_id: payload.order_id } : {},
    }),

  /**
   * Initialize EPS hosted checkout session and receive RedirectURL.
   * transaction_type_id: 1 = Web, 2 = Android Devices, 3 = IOS Devices.
   */
  initializeEps: (intentId: string, transactionTypeId?: number) =>
    apiClient.post<EPSInitializeResponse>(API_ENDPOINTS.PAYMENTS.EPS_INITIALIZE(intentId), {
      platform: Platform.OS,
      transaction_type_id: transactionTypeId || (Platform.OS === "android" ? 2 : Platform.OS === "ios" ? 3 : 1),
    }),

  /**
   * Independently verify payment status directly with EPS gateway.
   */
  verifyEps: (intentId: string) =>
    apiClient.post<EPSVerifyResponse>(API_ENDPOINTS.PAYMENTS.EPS_VERIFY(intentId)),

  /**
   * Fetch payment intent details.
   */
  getEpsDetails: (intentId: string) =>
    apiClient.get(API_ENDPOINTS.PAYMENTS.EPS_DETAILS(intentId)),
};
