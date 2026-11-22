export const API_ENDPOINTS = {
  // Auth (Mounted at /api/v1/auth/)
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/auth/otp/verify",
    SEND_OTP: "/auth/otp/send",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GOOGLE: "/auth/google",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  // Profiles (Mounted at /api/v1/profiles/)
  PROFILES: {
    ME: "/profiles/me/",
    PREFERENCES: "/profiles/me/preferences/",
    FOLLOWERS: "/profiles/me/followers/",
    FOLLOWING: "/profiles/me/following/",
    CHECK_USERNAME: "/profiles/check-username/",
    READING_INTERESTS: "/profiles/reading-interests/",
    PUBLIC: (username: string) => `/profiles/${username}/`,
    FOLLOW: (username: string) => `/profiles/${username}/follow/`,
  },
  // Me / Cart & Wishlist & Library
  ME: {
    PROFILE: "/profiles/me/",
    LIBRARY: "/books/me/library/",
    LIBRARY_STATS: "/books/me/library/stats/",
    WISHLIST: "/me/wishlist/",
    WISHLIST_ITEMS: "/me/wishlist/items/",
    WISHLIST_ITEM: (listingId: string) => `/me/wishlist/items/${listingId}/`,
    WISHLIST_TOGGLE: "/me/wishlist/toggle/",
    CART: "/me/cart/",
    CART_ITEMS: "/me/cart/items/",
    CART_ITEM: (id: string) => `/me/cart/items/${id}/`,
    BORROW_CART: "/me/borrow-cart/",
    BORROW_CART_ITEMS: "/me/borrow-cart/items/",
    BORROW_CART_ITEM: (bookId: string) => `/me/borrow-cart/items/${bookId}/`,
    BORROW_CART_ELIGIBILITY: "/me/borrow-cart/check-eligibility/",
    ORDERS: "/me/orders/",
    SALES: "/me/sales/",
  },
  // Books (Mounted at /api/v1/books/)
  BOOKS: {
    LIST: "/books/",
    DETAIL: (slugOrId: string) => `/books/${slugOrId}/`,
    CREATE: "/books/",
    UPDATE: (id: string) => `/books/${id}/`,
    DELETE: (id: string) => `/books/${id}/`,
    ISBN: (isbn: string) => `/books/isbn/${isbn}/`,
    CATEGORIES: "/books/categories/",
    CATEGORY_DETAIL: (slugOrId: string) => `/books/categories/${slugOrId}/`,
    NEARBY: "/books/nearby/",
    TRENDING: "/books/trending/",
    NEW: "/books/new/",
    TOP_DEALS: "/books/top-deals/",
    TOP_RATED: "/books/top-rated/",
    FOR_YOU: "/books/for-you/",
    FILTERS: "/books/filters/",
    STATISTICS: "/books/statistics/",
    QUESTIONS: (slugOrId: string) => `/books/${slugOrId}/questions/`,
  },
  // Search (Mounted at /api/v1/search/)
  SEARCH: {
    BOOKS: "/search/books/",
    SUGGESTIONS: "/search/suggestions/",
    USERS: "/search/users/",
  },
  // Location (Mounted at /api/v1/locations/)
  LOCATIONS: {
    SEARCH: "/locations/search/",
    REVERSE: "/locations/reverse/",
  },
  // Media (Mounted at /api/v1/media/)
  MEDIA: {
    UPLOAD: "/media/uploads/",
  },
  // Orders (Mounted at /api/v1/orders/)
  ORDERS: {
    CHECKOUT: "/orders/checkout/",
    DETAIL: (id: string) => `/orders/${id}/`,
    TRACKING: (id: string) => `/orders/${id}/tracking/`,
    INVOICE: (id: string) => `/orders/${id}/invoice/`,
    CONFIRM: (id: string) => `/orders/${id}/confirm/`,
    CANCEL: (id: string) => `/orders/${id}/cancel/`,
    CANCELLATION_REASONS: "/orders/cancellation-reasons/",
    DELIVER: (id: string) => `/orders/${id}/deliver/`,
    RETURN: (id: string) => `/orders/${id}/return/`,
    COMPLETE: (id: string) => `/orders/${id}/complete/`,
    CONFIRM_RECEIPT: (id: string) => `/orders/${id}/confirm-receipt/`,
  },
  // Notifications (Mounted at /api/v1/notifications/)
  NOTIFICATIONS: {
    LIST: "/notifications/",
    DETAIL: (id: string) => `/notifications/${id}/`,
    MARK_READ: (id: string) => `/notifications/${id}/read/`,
    READ_ALL: "/notifications/read-all/",
    SUMMARY: "/notifications/summary/",
    DEVICES: "/notifications/devices/",
  },
  // Chat & Messaging (Mounted at /api/v1/chat/)
  CHAT: {
    CONVERSATIONS: "/conversations/",
    CONVERSATION: (id: string) => `/conversations/${id}/`,
    MESSAGES: (id: string) => `/conversations/${id}/messages/`,
    MARK_READ: (id: string) => `/conversations/${id}/read/`,
    UNREAD_COUNT: "/unread-count/",
    SUPPORT: "/support/",
  },
  // Reviews (Mounted at /api/v1/reviews/)
  REVIEWS: {
    BOOK_REVIEWS: (slugOrId: string) => `/reviews/books/${slugOrId}/`,
    SUBMIT_BOOK_REVIEW: (slugOrId: string) => `/reviews/books/${slugOrId}/submit/`,
    VOTE: (reviewId: string) => `/reviews/${reviewId}/vote/`,
    USER_REVIEWS: (username: string) => `/reviews/users/${username}/`,
    SUBMIT_USER_REVIEW: (username: string) => `/reviews/users/${username}/submit/`,
  },
} as const;
