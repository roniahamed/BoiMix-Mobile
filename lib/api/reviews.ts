import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/constants/api";
import type { PaginatedResponse } from "@/lib/api/books";

export type BookReviewItem = {
  id: string;
  reviewer: {
    id: string;
    username: string;
    name?: string;
    fullName?: string;
    avatarUrl?: string | null;
  };
  rating: number;
  comment: string;
  likesCount?: number;
  dislikesCount?: number;
  userVote?: "upvote" | "downvote" | null;
  transaction_type?: string;
  created_at: string;
};

export type SubmitReviewPayload = {
  rating: number;
  comment: string;
};

export const reviewsApi = {
  getBookReviews: (slugOrId: string, params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookReviewItem>>(API_ENDPOINTS.REVIEWS.BOOK_REVIEWS(slugOrId), {
      params,
    }),

  submitBookReview: (slugOrId: string, data: SubmitReviewPayload) =>
    apiClient.post<BookReviewItem>(API_ENDPOINTS.REVIEWS.SUBMIT_BOOK_REVIEW(slugOrId), data),

  voteReview: (reviewId: string, vote: "upvote" | "downvote") =>
    apiClient.post(API_ENDPOINTS.REVIEWS.VOTE(reviewId), { vote }),

  getUserReviews: (username: string, params: { page?: number; page_size?: number } = {}) =>
    apiClient.get<PaginatedResponse<BookReviewItem>>(API_ENDPOINTS.REVIEWS.USER_REVIEWS(username), {
      params,
    }),

  submitUserReview: (username: string, data: SubmitReviewPayload) =>
    apiClient.post<BookReviewItem>(API_ENDPOINTS.REVIEWS.SUBMIT_USER_REVIEW(username), data),
};
