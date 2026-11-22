// Query key factory — single source of truth for all React Query keys
export const queryKeys = {
  // Auth / Profile
  me: {
    all: ["me"] as const,
    profile: () => ["me", "profile"] as const,
    library: (page?: number) => ["me", "library", page] as const,
    wishlist: () => ["me", "wishlist"] as const,
    cart: () => ["me", "cart"] as const,
    borrowCart: () => ["me", "borrow-cart"] as const,
    orders: (page?: number) => ["me", "orders", page] as const,
    borrowOrders: (page?: number) => ["me", "borrow-orders", page] as const,
    exchanges: (page?: number) => ["me", "exchanges", page] as const,
    notifications: (page?: number) => ["me", "notifications", page] as const,
    conversations: () => ["me", "conversations"] as const,
    messages: (conversationId: string) =>
      ["me", "conversations", conversationId, "messages"] as const,
  },

  // Books
  books: {
    all: ["books"] as const,
    list: (params?: Record<string, unknown>) => ["books", "list", params] as const,
    detail: (slug: string) => ["books", "detail", slug] as const,
    trending: () => ["books", "trending"] as const,
    newArrivals: () => ["books", "new-arrivals"] as const,
    nearby: (lat: number, lng: number, radius: number) =>
      ["books", "nearby", lat, lng, radius] as const,
    categories: () => ["books", "categories"] as const,
    reviews: (slug: string, page?: number) =>
      ["books", "reviews", slug, page] as const,
    questions: (slug: string) => ["books", "questions", slug] as const,
    isbn: (isbn: string) => ["books", "isbn", isbn] as const,
    byUser: (userId: string) => ["books", "by-user", userId] as const,
  },

  // Search
  search: {
    books: (query: string, params?: Record<string, unknown>) =>
      ["search", "books", query, params] as const,
    suggestions: (query: string) => ["search", "suggestions", query] as const,
    users: (query: string) => ["search", "users", query] as const,
  },

  // Users (public profiles)
  users: {
    profile: (username: string) => ["users", "profile", username] as const,
  },

  // Locations
  locations: {
    search: (query: string) => ["locations", "search", query] as const,
  },
} as const;
