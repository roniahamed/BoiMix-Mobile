// Migrated from web frontend types/user.ts
export type UserBadgeTone = "default" | "success" | "warning" | "info";

export type UserBadge = {
  label: string;
  tone?: UserBadgeTone;
  icon?: string;
  badgeColor?: "red" | "blue" | "green" | "purple" | "orange" | string;
};

export type UserSummary = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  location?: string;
  reputation?: number;
  rating?: number;
  badges?: UserBadge[];
};

export type UserProfileStats = {
  booksInLibrary: number;
  successfulExchanges: number;
  booksBorrowed: number;
  booksSold: number;
  followers: number;
  following: number;
};

export type UserProfileBadge = UserBadge & {
  description: string;
  earnedAt?: string;
  isEarned: boolean;
  progress?: {
    current: number;
    required: number;
    label: string;
  };
};

export type UserProfile = UserSummary & {
  username: string;
  coverUrl: string;
  bio: string;
  role?: string;
  isAdmin?: boolean;
  systemRole?: string;
  verifiedBadge?: boolean;
  isVerified?: boolean;
  joinedAt: string;
  responseRate: number;
  responseTime: string;
  stats: UserProfileStats;
  profileBadges: UserProfileBadge[];
  locationDetails?: {
    district: string;
    area: string;
    serviceArea: string[];
    meetingPreference: string;
    privacyNote: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  readingInterests?: string[];
  isFollowing?: boolean;
  verification?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    trustedSeller: boolean;
    premium: boolean;
  };
};

// Auth user (stored in auth store)
export type AuthUser = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  roles: string[];
  isOnboarded?: boolean;
  hasPassword?: boolean;
  hasAcceptedTerms?: boolean;
  emailVerified?: boolean;
};
