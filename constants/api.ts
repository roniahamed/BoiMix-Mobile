export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login/",
    REGISTER: "/auth/register/",
    VERIFY_OTP: "/auth/verify-otp/",
    FORGOT_PASSWORD: "/auth/forgot-password/",
    RESET_PASSWORD: "/auth/reset-password/",
    GOOGLE: "/auth/google/",
    REFRESH: "/auth/token/refresh/",
    LOGOUT: "/auth/logout/",
  },
  // Profile / Me
  ME: {
    PROFILE: "/me/profile/",
    AVATAR: "/me/profile/avatar/",
    COVER: "/me/profile/cover/",
    LIBRARY: "/me/library/",
    WISHLIST: "/me/wishlist/",
    WISHLIST_ITEM: (bookId: string) => `/me/wishlist/items/${bookId}/`,
    CART: "/me/cart/",
    CART_ITEM: (id: string) => `/me/cart/items/${id}/`,
    BORROW_CART: "/me/borrow-cart/",
    BORROW_CART_ITEM: (bookId: string) => `/me/borrow-cart/items/${bookId}/`,
    BORROW_CART_ELIGIBILITY: "/me/borrow-cart/check-eligibility/",
    ORDERS: "/me/orders/",
    BORROW_ORDERS: "/me/borrow-orders/",
    EXCHANGES: "/me/exchanges/",
    NOTIFICATIONS: "/me/notifications/",
    NOTIFICATION_READ: (id: string) => `/me/notifications/${id}/read/`,
    NOTIFICATIONS_READ_ALL: "/me/notifications/read-all/",
    CONVERSATIONS: "/me/conversations/",
    CONVERSATION_MESSAGES: (id: string) => `/me/conversations/${id}/messages/`,
    FOLLOWERS: "/me/followers/",
    FOLLOWING: "/me/following/",
  },
  // Books
  BOOKS: {
    LIST: "/books/",
    DETAIL: (slug: string) => `/books/${slug}/`,
    CREATE: "/books/",
    UPDATE: (id: string) => `/books/${id}/`,
    DELETE: (id: string) => `/books/${id}/`,
    ISBN: (isbn: string) => `/books/isbn/${isbn}/`,
    CATEGORIES: "/books/categories/",
    NEARBY: "/books/nearby/",
    TRENDING: "/books/?ordering=-rating",
    NEW: "/books/?ordering=-created_at",
    REVIEWS: (slug: string) => `/books/${slug}/reviews/`,
    QUESTIONS: (slug: string) => `/books/${slug}/questions/`,
    QUESTION_ANSWERS: (questionId: string) => `/books/questions/${questionId}/answers/`,
  },
  // Search
  SEARCH: {
    BOOKS: "/search/books/",
    SUGGESTIONS: "/search/suggestions/",
    USERS: "/search/users/",
  },
  // Location
  LOCATIONS: {
    SEARCH: "/locations/search/",
    REVERSE: "/locations/reverse/",
  },
  // Media
  MEDIA: {
    UPLOAD: "/media/uploads/",
  },
  // Orders
  ORDERS: {
    CREATE: "/orders/",
    DETAIL: (id: string) => `/orders/${id}/`,
    BORROW_CREATE: "/borrow-orders/",
    EXCHANGE_CREATE: "/exchanges/",
    EXCHANGE_DETAIL: (id: string) => `/exchanges/${id}/`,
  },
  // Users (public profiles)
  USERS: {
    PROFILE: (username: string) => `/users/${username}/`,
    FOLLOW: (id: string) => `/users/${id}/follow/`,
  },
} as const;
