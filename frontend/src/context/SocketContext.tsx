import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage, Conversation } from '@/types/chat.types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: Set<string>;
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

  const socketRef = useRef<Socket | null>(null);

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

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

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
