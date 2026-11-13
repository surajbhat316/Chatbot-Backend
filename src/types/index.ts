export interface CreateChatDTO {
  userAId: string;
  userBId: string;
}

export interface SendMessageDTO {
  senderId: string;
  text: string;
}

export interface EditMessageDTO {
  userId: string;
  text: string;
}

export interface MarkReadDTO {
  userId: string;
}

export interface UpdateLastSeenDTO {
  userId: string;
  messageId: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string | null;
  readBy: string[];
  isEdited?: boolean;
  editedAt?: string | null;
}

export interface LastSeenRecord {
  userId: string;
  messageId: string;
  updatedAt: string | null;
}

export interface ChatMemberInfo {
  id: string;
  name?: string;
  email?: string;
  joinedAt?: string;
}

export interface UserChatSummary {
  chatId: string;
  createdAt: string;
  members: ChatMemberInfo[];
}
