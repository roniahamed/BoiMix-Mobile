import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook, BookCategory } from "@/types/book";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type BookListParams = {
  type?: string;
  category?: string;
  condition?: string;
  price_min?: number;
  price_max?: number;
  ordering?: string;
  q?: string;
  page?: number;
  page_size?: number;
  radius?: number;
  lat?: number;
  lng?: number;
  provider_type?: "library" | "user";
  seller_id?: string;
};

export const booksApi = {
  getBooks: (params: BookListParams = {}) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.BOOKS.LIST, {
      params,
    }),

  searchBooks: (params: BookListParams & { q: string }) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.SEARCH.BOOKS, {
      params,
    }),

  getBookDetail: (slug: string) =>
    apiClient.get<BookCardBook>(API_ENDPOINTS.BOOKS.DETAIL(slug)),

  getCategories: () =>
    apiClient.get<BookCategory[]>(API_ENDPOINTS.BOOKS.CATEGORIES),

  getNearbyBooks: (lat: number, lng: number, radius = 10) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.BOOKS.NEARBY, {
      params: { lat, lng, radius },
    }),

  getByISBN: (isbn: string) =>
    apiClient.get<Partial<BookCardBook>>(API_ENDPOINTS.BOOKS.ISBN(isbn)),

  uploadBook: (formData: FormData) =>
    apiClient.post<BookCardBook>(API_ENDPOINTS.BOOKS.CREATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateBook: (id: string, data: Partial<BookCardBook>) =>
    apiClient.patch<BookCardBook>(API_ENDPOINTS.BOOKS.UPDATE(id), data),

  deleteBook: (id: string) =>
    apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(id)),
};
