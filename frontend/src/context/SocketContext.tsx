import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { chatService } from '@/services/chatService';
import { toast } from '@/hooks/useToast';
import type { ChatMessage, Conversation } from '@/types/chat.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: Set<string>;
  unreadMessageCount: number;
  activeChatConvId: string | null;
  setActiveChatConvId: (convId: string | null) => void;
  refreshUnreadCount: () => Promise<void>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendSocketMessage: (data: {
    senderId: string;
    receiverId: string;
    content: string;
    conversationId?: string;
  }) => Promise<{ message: ChatMessage; conversation: Conversation }>;
  emitTyping: (conversationId: string, userName?: string) => void;
  emitStopTyping: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [activeChatConvId, setActiveChatConvIdState] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const activeChatConvIdRef = useRef<string | null>(null);

  const setActiveChatConvId = useCallback((convId: string | null) => {
    activeChatConvIdRef.current = convId;
    setActiveChatConvIdState(convId);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await chatService.getUnreadCount(user.id);
      setUnreadMessageCount(count);
    } catch {
      // Ignored
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      refreshUnreadCount();
    } else {
      setUnreadMessageCount(0);
    }
  }, [user?.id, refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        userId: user.id,
      },
      query: {
        userId: user.id,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      refreshUnreadCount();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('user_status_changed', ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Global listener for incoming message notification
    newSocket.on(
      'message_notification',
      (data: { message: ChatMessage; conversation: Conversation; senderName?: string }) => {
        // If not actively looking at this conversation, bump unread count and show toast
        if (activeChatConvIdRef.current !== data.conversation.id) {
          setUnreadMessageCount((prev) => prev + 1);
          const sender = data.senderName || 'Someone';
          const snippet =
            data.message.content.length > 55
              ? `${data.message.content.slice(0, 52)}...`
              : data.message.content;
          toast.info(`Message from ${sender}`, snippet);
        }
      }
    );

    newSocket.on('messages_read', () => {
      refreshUnreadCount();
    });

    newSocket.on('visit_update', (visit: { date?: string; slotTime?: string; status?: string; suggestedDate?: string; suggestedSlotTime?: string }) => {
      if (visit?.status === 'confirmed') {
        toast.success('Visit Confirmed! ✅', `Scheduled for ${visit.date} at ${visit.slotTime}`);
      } else if (visit?.status === 'rescheduled') {
        toast.info('Visit Reschedule Proposed 🔄', `Proposed: ${visit.suggestedDate} at ${visit.suggestedSlotTime}`);
      } else if (visit?.status === 'pending') {
        toast.info('New Visit Request 📅', `Visit requested for ${visit.date} at ${visit.slotTime}`);
      } else if (visit?.status === 'rejected') {
        toast.info('Visit Declined ❌', `The scheduled visit was declined.`);
      } else if (visit?.status === 'cancelled') {
        toast.info('Visit Cancelled ❌', `The scheduled visit was cancelled.`);
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id, refreshUnreadCount]);

  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected && conversationId) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  }, []);

  const sendSocketMessage = useCallback((data: {
    senderId: string;
    receiverId: string;
    content: string;
    conversationId?: string;
  }): Promise<{ message: ChatMessage; conversation: Conversation }> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket is not connected'));
        return;
      }
      socketRef.current.emit(
        'send_message',
        data,
        (response: { success: boolean; data?: { message: ChatMessage; conversation: Conversation }; error?: string }) => {
          if (response?.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'Failed to send message'));
          }
        }
      );
    });
  }, []);

  const emitTyping = useCallback((conversationId: string, userName?: string) => {
    if (socketRef.current?.connected && user?.id && conversationId) {
      socketRef.current.emit('typing', {
        conversationId,
        userId: user.id,
        userName: userName || user.firstName,
      });
    }
  }, [user?.id, user?.firstName]);

  const emitStopTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected && user?.id && conversationId) {
      socketRef.current.emit('stop_typing', {
        conversationId,
        userId: user.id,
      });
    }
  }, [user?.id]);

  const markConversationAsRead = useCallback((conversationId: string) => {
    if (socketRef.current?.connected && user?.id && conversationId) {
      socketRef.current.emit('mark_read', {
        conversationId,
        userId: user.id,
      });
    }
  }, [user?.id]);

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUserIds,
    unreadMessageCount,
    activeChatConvId,
    setActiveChatConvId,
    refreshUnreadCount,
    joinConversation,
    leaveConversation,
    sendSocketMessage,
    emitTyping,
    emitStopTyping,
    markConversationAsRead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
