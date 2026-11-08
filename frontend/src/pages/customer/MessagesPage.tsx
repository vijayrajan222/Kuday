import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Send,
  Check,
  CheckCheck,
  MessageSquare,
  CheckCircle2,
  User,
  ArrowLeft,
  Circle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/context/SocketContext';
import { chatService } from '@/services/chatService';
import { ROUTES } from '@/constants/routes';
import { toast } from '@/hooks/useToast';
import type { ChatMessage, Conversation } from '@/types/chat.types';

export default function MessagesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    socket,
    joinConversation,
    leaveConversation,
    sendSocketMessage,
    emitTyping,
    emitStopTyping,
    markConversationAsRead,
    onlineUserIds,
    setActiveChatConvId,
    refreshUnreadCount,
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Recipient details in active conversation
  const recipient = useMemo(() => {
    if (!activeConversation || !user?.id) return null;
    return (
      activeConversation.participantDetails?.find((p) => p.id !== user.id) || null
    );
  }, [activeConversation, user?.id]);

  // Check if recipient is online
  const isRecipientOnline = useMemo(() => {
    if (!recipient) return false;
    return onlineUserIds.has(recipient.id) || Boolean(activeConversation?.isOnline);
  }, [recipient, onlineUserIds, activeConversation?.isOnline]);

  // 1. Load Conversations on Mount
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingConversations(true);
      const data = await chatService.getConversations(user.id);
      setConversations(data || []);
      return data;
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConversations().then((convList) => {
      // Check if routed with a specific recipientId (e.g. from Matched page)
      const state = location.state as { recipientId?: string; recipientName?: string } | undefined;
      if (state?.recipientId && user?.id) {
        // Find existing conversation with recipient
        const existing = convList?.find((c) => c.participants.includes(state.recipientId!));
        if (existing) {
          setActiveConversationId(existing.id);
        } else {
          // Start a new conversation safely
          chatService
            .startConversation(user.id, state.recipientId)
            .then((newConv) => {
              setConversations((prev) => {
                const alreadyExists = prev.some(
                  (c) => c.id === newConv.id || c.participants.includes(state.recipientId!)
                );
                if (alreadyExists) return prev;
                return [newConv, ...prev];
              });
              setActiveConversationId(newConv.id);
            })
            .catch(() => {
              toast.error('Unable to initiate conversation with user');
            });
        }
      } else if (convList && convList.length > 0 && !activeConversationId) {
        // Select first conversation by default on desktop
        setActiveConversationId(convList[0].id);
      }
    });
  }, [user?.id, location.state, fetchConversations]);

  // Track active chat in global context
  useEffect(() => {
    setActiveChatConvId(activeConversationId);
    return () => {
      setActiveChatConvId(null);
    };
  }, [activeConversationId, setActiveChatConvId]);

  // 2. Fetch Messages and Join Room when activeConversation changes
  useEffect(() => {
    if (!activeConversationId || !user?.id) return;

    let isMounted = true;
    setLoadingMessages(true);

    joinConversation(activeConversationId);
    markConversationAsRead(activeConversationId);
    chatService.markAsRead(activeConversationId, user.id).then(() => {
      refreshUnreadCount();
    }).catch(() => {});

    // REST fetch historical messages
    chatService
      .getMessages(activeConversationId, user.id)
      .then((data) => {
        if (isMounted) {
          setMessages(data || []);
          setLoadingMessages(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessages([]);
          setLoadingMessages(false);
        }
      });

    // Mark conversation unread count as 0 locally
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
    );

    return () => {
      isMounted = false;
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, user?.id, joinConversation, leaveConversation, markConversationAsRead, refreshUnreadCount]);

  // 3. Socket Event Listeners (new_message, typing, messages_read)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: ChatMessage) => {
      // If message belongs to active conversation, add to state
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (user?.id && msg.receiverId === user.id) {
          markConversationAsRead(msg.conversationId);
        }
      }

      // Update lastMessage in conversation list
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === msg.conversationId) {
            const isCurrentActive = c.id === activeConversationId;
            return {
              ...c,
              lastMessage: {
                content: msg.content,
                senderId: msg.senderId,
                createdAt: msg.createdAt,
              },
              unreadCount:
                isCurrentActive || msg.senderId === user?.id
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
      });
    };

    const handleMessageNotification = ({
      message,
      conversation,
    }: {
      message: ChatMessage;
      conversation: Conversation;
    }) => {
      setConversations((prev) => {
        const otherParticipantId = conversation.participants.find((p) => p !== user?.id);
        const exists = prev.some(
          (c) => c.id === conversation.id || (otherParticipantId && c.participants.includes(otherParticipantId))
        );
        if (exists) {
          return prev.map((c) =>
            c.id === conversation.id || (otherParticipantId && c.participants.includes(otherParticipantId))
              ? {
                  ...c,
                  id: conversation.id,
                  lastMessage: {
                    content: message.content,
                    senderId: message.senderId,
                    createdAt: message.createdAt,
                  },
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c
          );
        }
        fetchConversations();
        return prev;
      });
    };

    const handleUserTyping = (data: { conversationId: string; userId: string; userName?: string }) => {
      if (data.conversationId === activeConversationId && data.userId !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userName || 'Roommate'));
      }
    };

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readBy: string }) => {
      if (data.conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId !== data.readBy ? { ...m, isRead: true } : m))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_notification', handleMessageNotification);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_notification', handleMessageNotification);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, activeConversationId, user?.id, markConversationAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle Input Typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversationId) return;

    emitTyping(activeConversationId, user?.firstName);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversationId) emitStopTyping(activeConversationId);
    }, 2000);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !user?.id || !recipient?.id || !activeConversationId) return;

    const currentUserId = user.id;
    const currentRecipientId = recipient.id;
    const currentConvId = activeConversationId;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitStopTyping(currentConvId);

    setInputText('');

    try {
      // Send via socket.io for instant real-time delivery
      const res = await sendSocketMessage({
        senderId: currentUserId,
        receiverId: currentRecipientId,
        content,
        conversationId: currentConvId,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvId
            ? {
                ...c,
                lastMessage: {
                  content,
                  senderId: currentUserId,
                  createdAt: new Date().toISOString(),
                },
              }
            : c
        )
      );
    } catch {
      // Fallback: REST send
      try {
        const res = await chatService.sendMessage({
          senderId: currentUserId,
          receiverId: currentRecipientId,
          content,
          conversationId: currentConvId,
        });
        setMessages((prev) => [...prev, res.message]);
      } catch {
        toast.error('Failed to send message');
      }
    }
  };

  // Filtered & deduplicated conversations
  const filteredConversations = useMemo(() => {
    // Deduplicate conversations by other participant id
    const seenParticipants = new Set<string>();
    const deduplicated: Conversation[] = [];

    for (const c of conversations) {
      const other = c.participantDetails?.find((p) => p.id !== user?.id) ||
                    c.participants.find((p) => p !== user?.id);
      const otherKey = typeof other === 'string' ? other : other?.id || c.id;
      if (!seenParticipants.has(otherKey)) {
        seenParticipants.add(otherKey);
        deduplicated.push(c);
      }
    }

    if (!searchQuery.trim()) return deduplicated;
    const q = searchQuery.toLowerCase();
    return deduplicated.filter((c) => {
      const other = c.participantDetails?.find((p) => p.id !== user?.id);
      const name = `${other?.firstName || ''} ${other?.lastName || ''}`.toLowerCase();
      const snippet = c.lastMessage?.content?.toLowerCase() || '';
      return name.includes(q) || snippet.includes(q);
    });
  }, [conversations, searchQuery, user?.id]);

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Container Box */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:flex-row">
        {/* LEFT COLUMN: Conversation List */}
        <aside
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 flex flex-col bg-slate-50/50 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200/80 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-slate-900" /> Messages
              </h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredConversations.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mx-auto" />
                <p>Loading messages...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No conversations yet</p>
                <p className="text-[11px] text-slate-400">
                  Connect with verified roommates or hosts in Matched to start chatting.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participantDetails?.find((p) => p.id !== user?.id);
                const otherName = other
                  ? `${other.firstName} ${other.lastName || ''}`.trim()
                  : 'Roommate';
                const isSelected = conv.id === activeConversationId;
                const isOnline = other ? onlineUserIds.has(other.id) : false;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100/90 border-l-4 border-slate-900'
                        : 'hover:bg-slate-100/50'
                    }`}
                  >
                    {/* Avatar with Online Dot */}
                    <div className="relative shrink-0">
                      {other?.selfieUrl ? (
                        <img
                          src={other.selfieUrl}
                          alt={otherName}
                          className="h-11 w-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                          {otherName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isOnline && (
                        <span
                          title="Online"
                          className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {otherName}
                        </span>
                        {conv.lastMessage?.createdAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.senderId === user?.id && (
                          <span className="font-semibold text-slate-700">You: </span>
                        )}
                        {conv.lastMessage?.content || 'Started a conversation'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                      <span className="shrink-0 bg-slate-900 text-white text-[10px] font-black h-4 min-w-[1rem] px-1 rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Active Chat View */}
        <main
          className={`flex-1 flex flex-col bg-white ${
            activeConversationId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation && recipient ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-black rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    {recipient.selfieUrl ? (
                      <img
                        src={recipient.selfieUrl}
                        alt={recipient.firstName}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                        {recipient.firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isRecipientOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{recipient.firstName} {recipient.lastName || ''}</span>
                      {recipient.identityVerified && (
                        <span title="Verified Identity">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      {isRecipientOnline ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" /> Online
                        </span>
                      ) : (
                        <span>Offline</span>
                      )}
                      <span>•</span>
                      <span className="capitalize">{recipient.role || 'Roommate'}</span>
                    </p>
                  </div>
                </div>

                {/* View Profile Action */}
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.USER_PROFILE.replace(':userId', recipient.id))}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors border border-slate-200"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View Profile</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </button>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading conversation history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-700">No messages yet</p>
                    <p>Send a message below to start coordinating details.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isMine
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div
                          className={`flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span>{formatMessageTime(msg.createdAt)}</span>
                          {isMine && (
                            msg.isRead ? (
                              <span title="Read">
                                <CheckCheck className="h-3 w-3 text-sky-500" />
                              </span>
                            ) : (
                              <span title="Sent">
                                <Check className="h-3 w-3 text-slate-400" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                    <div className="flex gap-1 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{Array.from(typingUsers).join(', ')} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-slate-200/80 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message ${recipient.firstName}...`}
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Your Messages</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a conversation from the left to start coordinating with verified hosts or roommates in real-time.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
