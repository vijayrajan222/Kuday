import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { chatService } from '@/services/chatService';
import type { ChatMessage } from '@/types/chat.types';

interface UseChatProps {
  socket: Socket | null;
  currentUserId?: string;
  conversationId?: string | null;
  otherUserId?: string | null;
}

export function useChat({ socket, currentUserId, conversationId, otherUserId }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConvIdRef = useRef<string | null>(conversationId || null);
  const otherUserIdRef = useRef<string | null>(otherUserId || null);

  useEffect(() => {
    activeConvIdRef.current = conversationId || null;
  }, [conversationId]);

  useEffect(() => {
    otherUserIdRef.current = otherUserId || null;
  }, [otherUserId]);

  // Load message history
  const loadHistory = useCallback(async () => {
    if (!currentUserId || (!conversationId && !otherUserId)) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let fetched: ChatMessage[] = [];
      if (otherUserId) {
        fetched = await chatService.getMessagesByOtherUser(otherUserId);
      } else if (conversationId) {
        fetched = await chatService.getMessages(conversationId, currentUserId);
      }
      setMessages(fetched);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, otherUserId, currentUserId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Listen to message:new on the socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: ChatMessage) => {
      // Verify if the message belongs to this active conversation or between these two users
      const isRelevant =
        (activeConvIdRef.current && newMsg.conversationId === activeConvIdRef.current) ||
        (otherUserIdRef.current &&
          ((newMsg.senderId === otherUserIdRef.current && newMsg.receiverId === currentUserId) ||
            (newMsg.senderId === currentUserId && newMsg.receiverId === otherUserIdRef.current)));

      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    // Also listen to legacy 'new_message' for fallback
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, currentUserId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!content.trim() || !currentUserId || !otherUserId) return false;

      return new Promise<boolean>((resolve) => {
        if (!socket || !socket.connected) {
          // REST fallback
          chatService
            .sendMessage({
              senderId: currentUserId,
              receiverId: otherUserId,
              content: content.trim(),
              ...(conversationId ? { conversationId } : {}),
            })
            .then((res) => {
              setMessages((prev) => {
                if (prev.some((m) => m.id === res.message.id)) return prev;
                return [...prev, res.message];
              });
              resolve(true);
            })
            .catch((err) => {
              console.error('Failed to send message via REST:', err);
              resolve(false);
            });
          return;
        }

        socket.emit(
          'message:send',
          {
            receiverId: otherUserId,
            content: content.trim(),
            ...(conversationId ? { conversationId } : {}),
          },
          (res: { success: boolean; message?: ChatMessage; error?: string }) => {
            if (res && res.success && res.message) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === res.message?.id)) return prev;
                return [...prev, res.message!];
              });
              resolve(true);
            } else {
              console.error('Socket message:send failed:', res?.error);
              resolve(false);
            }
          }
        );
      });
    },
    [socket, currentUserId, otherUserId, conversationId]
  );

  return {
    messages,
    setMessages,
    loading,
    error,
    sendMessage,
    reloadMessages: loadHistory,
  };
}
