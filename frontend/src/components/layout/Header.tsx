import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { LogOut, Menu, Bell, ShieldCheck, Heart, Check, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification.types';

interface HeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export const Header = memo(function Header({ onMenuClick, onLogout }: HeaderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-8">
      <button type="button" onClick={onMenuClick} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {isOpen && (
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
                        className={`p-3.5 transition-colors flex items-start gap-3 ${
                          n.isRead ? 'bg-white text-slate-600' : 'bg-emerald-50/40 text-slate-900 font-medium'
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

        {user && (
          <Link
            to={ROUTES.PROFILE}
            className="flex items-center gap-2 rounded-full p-1.5 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-all cursor-pointer"
            title="View Profile"
          >
            <Avatar name={user.firstName || 'User'} size="sm" />
            <span className="hidden text-sm font-semibold sm:block">{user.firstName}</span>
          </Link>
        )}
        <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
});
