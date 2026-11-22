export type ChatUser = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
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
  conversationId: string;
  sender: ChatUser;
  body: string;
  previewText?: string;
  messageType: "text" | "image" | "exchange_proposal" | "system";
  createdAt: string;
  isRead?: boolean;
  attachments?: ChatAttachment[];
  exchangeProposal?: ChatExchangeProposal | null;
};

export type Conversation = {
  id: string;
  contextType:
    | "direct"
    | "support"
    | "listing"
    | "order"
    | "borrow"
    | "exchange";
  contextId?: string | null;
  contextPreview?: any;
  participants: ChatUser[];
  otherParticipant?: ChatUser | null;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateConversationPayload = {
  recipient_id: string;
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
