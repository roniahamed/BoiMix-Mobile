import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { UserProfile } from "@/types/user";
import type { BookCardBook } from "@/types/book";
import type { PaginatedResponse } from "@/lib/api/books";

export type UpdateProfilePayload = {
  name?: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  district?: string;
  area?: string;
  readingInterests?: string[];
  avatar?: any;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
};

export const usersApi = {
  getMyProfile: () =>
    apiClient.get<UserProfile>(API_ENDPOINTS.PROFILES.ME),

  updateProfile: (data: UpdateProfilePayload | FormData) => {
    if (data instanceof FormData) {
      return apiClient.patch<UserProfile>(API_ENDPOINTS.PROFILES.ME, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return apiClient.patch<UserProfile>(API_ENDPOINTS.PROFILES.ME, {
      full_name: data.full_name || data.name,
      name: data.name || data.full_name,
      bio: data.bio,
      location_city: data.district,
      location_street: data.area,
      reading_interests: Array.isArray(data.readingInterests)
        ? data.readingInterests.join(", ")
        : data.readingInterests,
    });
  },

  uploadAvatar: (formData: FormData) =>
    apiClient.post<{ avatar_url: string }>(`${API_ENDPOINTS.MEDIA.UPLOAD}avatar/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getUserProfile: (username: string) =>
    apiClient.get<UserProfile>(API_ENDPOINTS.PROFILES.PUBLIC(username)),

  followUser: (username: string) =>
    apiClient.post<{ following: boolean }>(API_ENDPOINTS.PROFILES.FOLLOW(username)),

  getMyLibrary: (params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.ME.LIBRARY, {
      params,
    }),

  getUserBooks: (username: string, params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookCardBook>>(API_ENDPOINTS.BOOKS.LIST, {
      params: { owner: username, ...params },
    }),
};
