export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'admin_verification' | 'interest_request' | 'system' | 'chat_message';
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}
