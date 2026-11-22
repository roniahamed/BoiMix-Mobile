// Migrated from web frontend types/notification.ts
export type NotificationType =
  | "system"
  | "message"
  | "borrow_request"
  | "borrow_approved"
  | "borrow_returned"
  | "exchange_offer"
  | "exchange_accepted"
  | "review"
  | "order"
  | "question"
  | "wallet"
  | "membership"
  | "pass_expiry";

export interface NotificationActor {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  description: string;
  createdAt: string;
  created_at?: string;
  isRead: boolean;
  is_read?: boolean;
  actionUrl?: string;
  action_url?: string;
  target_url?: string;
  actorId?: string;
  actor_id?: string;
  actorName?: string;
  actor_name?: string;
  actorAvatar?: string;
  actor_avatar?: string;
  actor?: NotificationActor | null;
}

export interface NotificationSummary {
  seller_action_count: number;
  buyer_action_count: number;
  unread_notifications_count: number;
}

// Bangla labels for notification types
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  system: "সিস্টেম",
  message: "বার্তা",
  borrow_request: "ধার চাওয়া হয়েছে",
  borrow_approved: "ধার অনুমোদিত",
  borrow_returned: "বই ফেরত দেওয়া হয়েছে",
  exchange_offer: "বিনিময়ের প্রস্তাব",
  exchange_accepted: "বিনিময় গৃহীত",
  review: "নতুন রিভিউ",
  order: "অর্ডার আপডেট",
  question: "নতুন প্রশ্ন",
  wallet: "ওয়ালেট আপডেট",
  membership: "মেম্বারশিপ",
  pass_expiry: "পাসের মেয়াদ শেষ",
};
