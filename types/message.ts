export type ChatUser = {
  id: string;
  username: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  isOnline?: boolean;
  is_online?: boolean;
  lastSeenAt?: string | null;
  last_seen_at?: string | null;
};

export type ChatAttachment = {
  id: string;
  originalUrl: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
};

export type ChatExchangeProposal = {
  id: string;
  exchangeOrderId?: string | null;
  offeringListing: {
    id: string;
    title: string;
    author: string;
    coverImage?: string | null;
    price?: string | null;
  };
  requestingListing: {
    id: string;
    title: string;
    author: string;
    coverImage?: string | null;
    price?: string | null;
  };
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId?: string;
  conversation_id?: string;
  sender?: ChatUser;
  body: string;
  previewText?: string;
  preview_text?: string;
  messageType?: "text" | "image" | "exchange_proposal" | "system";
  message_type?: "text" | "image" | "exchange_proposal" | "system";
  createdAt?: string;
  created_at?: string;
  isRead?: boolean;
  is_read?: boolean;
  attachments?: ChatAttachment[];
  exchangeProposal?: ChatExchangeProposal | null;
  exchange_proposal?: ChatExchangeProposal | null;
};

export type Conversation = {
  id: string;
  contextType?:
    | "direct"
    | "support"
    | "listing"
    | "order"
    | "borrow"
    | "exchange"
    | string;
  context_type?: string;
  contextId?: string | null;
  context_id?: string | null;
  contextPreview?: any;
  context_preview?: any;
  participants?: ChatUser[];
  otherParticipant?: ChatUser | null;
  other_participant?: ChatUser | null;
  lastMessage?: ChatMessage | null;
  last_message?: ChatMessage | null;
  unreadCount?: number;
  unread_count?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type CreateConversationPayload = {
  recipient_id?: string;
  recipient_username?: string;
  context_type?: string;
  context_id?: string;
  initial_message?: string;
};

export type SendMessagePayload = {
  body: string;
  message_type?: "text" | "image" | "exchange_proposal";
  attachment_ids?: string[];
  reply_to_id?: string;
};
