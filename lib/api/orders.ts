import { Platform } from "react-native";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook } from "@/types/book";
import type { PaginatedResponse } from "@/lib/api/books";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type BorrowOrderStatus =
  | "pending"
  | "approved"
  | "active"
  | "returned"
  | "overdue";

export type ExchangeStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed";

export type OrderItem = {
  id: string;
  book: BookCardBook;
  quantity: number;
  price: number;
};

export type DeliveryAddress = {
  fullName: string;
  phone: string;
  district: string;
  thana: string;
  fullAddress: string;
};

export type Order = {
  id: string;
  orderNumber?: string;
  order_number?: string;
  items: OrderItem[];
  totalAmount: number;
  total_amount?: number;
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: "eps" | "cod" | "bkash" | "nagad" | "rocket" | "card" | string;
  createdAt: string;
  created_at?: string;
};

export type BorrowOrder = {
  id: string;
  book: BookCardBook;
  borrowerName?: string;
  lenderName?: string;
  duration: string;
  depositAmount: number;
  status: BorrowOrderStatus;
  dueDate: string;
  overdueDays?: number;
  fineAmount?: number;
  createdAt: string;
};

export type ExchangeOrder = {
  id: string;
  requestedBook: BookCardBook;
  offeredBook: BookCardBook;
  otherUserName?: string;
  status: ExchangeStatus;
  createdAt: string;
};

export type CreateOrderPayload = {
  cart_item_ids?: string[];
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    title?: string;
    seller?: { id: string };
  }>;
  delivery_address: DeliveryAddress;
  payment_method: "eps" | "cod" | "bkash" | "nagad" | "rocket" | "card" | string;
  delivery_method: "home" | "pickup";
  coupon_code?: string | null;
};

export type CreateBorrowPayload = {
  book_id: string;
  duration: "1_week" | "2_weeks" | "1_month";
  delivery_preference: "home" | "pickup";
  notes?: string;
};

export type CreateExchangePayload = {
  requested_book_id: string;
  offered_book_id: string;
  note?: string;
};

export const ordersApi = {
  // Purchases (Mounted at /api/v1/me/orders/ and /api/v1/orders/)
  getOrders: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<Order>>(API_ENDPOINTS.ME.ORDERS, { params }),

  getOrderDetail: (id: string) =>
    apiClient.get<Order>(API_ENDPOINTS.ORDERS.DETAIL(id)),

  getOrderTracking: (id: string) =>
    apiClient.get(API_ENDPOINTS.ORDERS.TRACKING(id)),

  createOrder: (payload: CreateOrderPayload) =>
    apiClient.post<{
      id: string;
      order_number: string;
      payment_url?: string;
      redirect_url?: string;
      payment_intent?: { id: string; amount: string; status: string };
    }>(
      API_ENDPOINTS.ORDERS.CHECKOUT,
      {
        name: payload.delivery_address.fullName,
        phone: payload.delivery_address.phone,
        district: payload.delivery_address.district,
        thana: payload.delivery_address.thana,
        address: payload.delivery_address.fullAddress,
        paymentMethod: payload.payment_method === "cod" ? "cod" : "eps",
        platform: Platform.OS,
        transaction_type_id: Platform.OS === "android" ? 2 : Platform.OS === "ios" ? 3 : 1,
        items: payload.items || [],
        selected_courier: "pathao",
        delivery_option: payload.delivery_method === "home" ? "courier" : "pickup",
        voucher_code: payload.coupon_code || "",
      },
    ),

  cancelOrder: (id: string, reason = "buyer_cancelled") =>
    apiClient.post(API_ENDPOINTS.ORDERS.CANCEL(id), { reason }),

  // Borrow Cart (Mounted at /api/v1/me/borrow-cart/)
  getBorrowOrders: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BorrowOrder>>(API_ENDPOINTS.ME.BORROW_CART, {
      params,
    }),

  createBorrowOrder: (payload: CreateBorrowPayload) =>
    apiClient.post<{ id: string; deposit_required: number }>(
      API_ENDPOINTS.ME.BORROW_CART_ITEMS,
      {
        listing_id: payload.book_id,
        duration: payload.duration,
        delivery_preference: payload.delivery_preference,
        notes: payload.notes,
      },
    ),

  checkBorrowEligibility: (bookId: string) =>
    apiClient.post<{ eligible: boolean; reason?: string }>(
      API_ENDPOINTS.ME.BORROW_CART_ELIGIBILITY,
      { book_id: bookId },
    ),

  // Exchanges (Mounted at /api/v1/messages/exchange-proposals/)
  getExchanges: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<ExchangeOrder>>("/messages/conversations/", {
      params,
    }),

  createExchange: (payload: CreateExchangePayload) =>
    apiClient.post<{ id: string }>("/messages/exchange-proposals/", {
      requested_book_id: payload.requested_book_id,
      offered_book_id: payload.offered_book_id,
      note: payload.note,
    }),

  respondExchange: (id: string, action: "accept" | "reject") => {
    const act = action === "accept" ? "accept" : "decline";
    return apiClient.post(`/messages/exchange-proposals/${id}/${act}/`);
  },

  // Discounts / Vouchers (Mounted at /api/v1/discounts/public/validate/)
  validateCoupon: (code: string, subtotal = 0) =>
    apiClient.post<{ valid: boolean; discount_amount: number; message?: string }>(
      "/discounts/public/validate/",
      { code, subtotal: subtotal.toString() },
    ),

  // Courier delivery charge (Mounted at /api/v1/courier/calculate-delivery-charge/)
  calculateDeliveryCharge: (payload: { recipient_city: string; recipient_zone?: string; weight?: number }) =>
    apiClient.post<{ delivery_fee: number }>("/courier/calculate-delivery-charge/", payload),
};
