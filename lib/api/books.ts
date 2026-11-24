import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { BookCardBook, BookCategory } from "@/types/book";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type NearbyBooksResponse = { count: number; page: number; page_size: number; results: BookCardBook[] };

export type BookListParams = {
  type?: string;
  category?: string;
  author?: string;
  publisher?: string;
  location?: string;
  language?: string;
  search?: string;
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

export type BookDetailResponse = {
  book: BookCardBook;
  owner?: any;
  questions?: any[];
  qa?: any[];
  recommended?: BookCardBook[];
  reviews?: any[];
};

export const booksApi = {
  getBooks: (params: BookListParams = {}) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.BOOKS.LIST, {
      params,
    }),

  searchBooks: async (params: BookListParams & { q: string }) => {
    try {
      const res = await apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.SEARCH.BOOKS, {
        params,
      });
      if (res.data?.results && res.data.results.length > 0) {
        return res;
      }
    } catch {
      // Continue to catalog search fallback
    }
    // High-resilience catalog search fallback supporting Bengali & English queries
    return apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.BOOKS.LIST, {
      params: { ...params, search: params.q },
    });
  },

  getBookDetail: (slug: string) =>
    apiClient.get<BookDetailResponse | BookCardBook>(API_ENDPOINTS.BOOKS.DETAIL(slug)),

  getFilterFacet: (facet: string, params: { search?: string; page?: number; page_size?: number } = {}) =>
    apiClient.get<{ results: { label: string; value: string; count?: number }[]; next: string | null }>(`${API_ENDPOINTS.BOOKS.FILTERS}${facet}/`, { params }),

  getCategories: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookCategory>>(API_ENDPOINTS.BOOKS.CATEGORIES, { params }),

  getAllCategories: async () => {
    const categories: BookCategory[] = [];
    let page = 1;
    while (true) {
      const response = await apiClient.get<PaginatedResponse<BookCategory> | BookCategory[]>(API_ENDPOINTS.BOOKS.CATEGORIES, { params: { page, page_size: 100 } });
      if (Array.isArray(response.data)) return response.data;
      categories.push(...response.data.results);
      if (!response.data.next || response.data.results.length === 0) return categories;
      page += 1;
    }
  },

  getNearbyBooks: (lat: number, lng: number, radius = 10, page = 1, pageSize = 20) =>
    apiClient.get<NearbyBooksResponse>(API_ENDPOINTS.BOOKS.NEARBY, {
      params: { lat, lng, radius_km: radius, page, page_size: pageSize },
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
