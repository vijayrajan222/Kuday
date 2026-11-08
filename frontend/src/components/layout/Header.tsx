import { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  ShieldCheck,
  Heart,
  Check,
  CheckCheck,
  CheckCircle2,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  MessageSquare,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/context/SocketContext';
import { ROUTES } from '@/constants/routes';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification.types';

interface HeaderProps {
  onMenuClick?: () => void;
  onLogout: () => void;
}

export const Header = memo(function Header({
  onMenuClick,
  onLogout,
}: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data || []);
    } catch {
      // Ignored
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  // Real-time notification updates via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev.filter((item) => item.id !== notif.id)]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignored
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    setIsNotifOpen(false);
    if (n.type === 'chat_message') {
      navigate(ROUTES.MESSAGES);
    } else if (n.type === 'interest_request') {
      navigate(ROUTES.MATCHED);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile menu toggle + Brand (mobile only) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to={ROUTES.DASHBOARD}
            className="text-xl font-black tracking-tight text-slate-900 lg:hidden"
          >
            kudai
          </Link>
        </div>

        {/* Right: Notifications + Settings + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
          {/* Notification Bell Dropdown */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden text-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer hover:bg-slate-50 ${
                            n.isRead
                              ? 'bg-white text-slate-600'
                              : 'bg-emerald-50/40 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'admin_verification' ? (
                              <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                            ) : n.type === 'interest_request' ? (
                              <div className="rounded-full bg-rose-100 p-1.5 text-rose-600">
                                <Heart className="h-4 w-4" />
                              </div>
                            ) : n.type === 'chat_message' ? (
                              <div className="rounded-full bg-sky-100 p-1.5 text-sky-600">
                                <MessageSquare className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="rounded-full bg-slate-100 p-1.5 text-slate-600">
                                <Bell className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                              {!n.isRead && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-[10px] text-slate-400 hover:text-emerald-600 p-1"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                            {n.createdAt && (
                              <span className="text-[10px] text-slate-400 block pt-0.5">
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Gear Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden"
              title="Settings & Account"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-slate-700" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 text-xs text-slate-700">
                <Link
                  to={ROUTES.PROFILE}
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                >
                  <UserIcon className="h-4 w-4 text-slate-500" />
                  Account Profile
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar Pill */}
          {user && (
            <Link
              to={ROUTES.PROFILE}
              className="flex items-center gap-2 rounded-full p-1 pl-1.5 pr-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 transition-all cursor-pointer shadow-2xs"
              title="View Profile & Preferences"
            >
              {user.selfieUrl ? (
                <img
                  src={user.selfieUrl}
                  alt={user.firstName || 'User'}
                  className="h-7 w-7 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <Avatar name={user.firstName || 'User'} size="sm" />
              )}
              <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {user.firstName || 'Profile'}
              </span>
              {user.identityVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
});
