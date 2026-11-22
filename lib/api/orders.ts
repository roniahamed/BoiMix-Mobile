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
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  paymentMethod: "cod" | "bkash" | "nagad" | "card";
  createdAt: string;
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
  cart_item_ids: string[];
  delivery_address: DeliveryAddress;
  payment_method: "cod" | "bkash" | "nagad" | "card";
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
  // Purchases
  getOrders: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<Order>>(API_ENDPOINTS.ME.ORDERS, { params }),

  createOrder: (payload: CreateOrderPayload) =>
    apiClient.post<{ id: string; order_number: string; payment_url?: string }>(
      API_ENDPOINTS.ORDERS.CREATE,
      payload,
    ),

  // Borrows
  getBorrowOrders: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BorrowOrder>>(API_ENDPOINTS.ME.BORROW_ORDERS, {
      params,
    }),

  createBorrowOrder: (payload: CreateBorrowPayload) =>
    apiClient.post<{ id: string; deposit_required: number }>(
      API_ENDPOINTS.ORDERS.BORROW_CREATE,
      payload,
    ),

  checkBorrowEligibility: (bookId: string) =>
    apiClient.post<{ eligible: boolean; reason?: string }>(
      API_ENDPOINTS.ME.BORROW_CART_ELIGIBILITY,
      { book_id: bookId },
    ),

  // Exchanges
  getExchanges: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<ExchangeOrder>>(API_ENDPOINTS.ME.EXCHANGES, {
      params,
    }),

  createExchange: (payload: CreateExchangePayload) =>
    apiClient.post<{ id: string }>(API_ENDPOINTS.ORDERS.EXCHANGE_CREATE, payload),

  respondExchange: (id: string, action: "accept" | "reject") =>
    apiClient.post(`/exchanges/${id}/${action}/`),

  // Coupons
  validateCoupon: (code: string) =>
    apiClient.post<{ valid: boolean; discount_amount: number; message?: string }>(
      "/coupons/validate/",
      { code },
    ),
};
