import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCheck, Mail } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import type { NotificationItem } from "../../types/api";

const formatAge = (timestamp: string) => {
  const delta = Date.now() - new Date(timestamp).getTime();

  if (delta < 60_000) {
    return "just now";
  }

  if (delta < 3_600_000) {
    return `${Math.floor(delta / 60_000)}m ago`;
  }

  if (delta < 86_400_000) {
    return `${Math.floor(delta / 3_600_000)}h ago`;
  }

  return `${Math.floor(delta / 86_400_000)}d ago`;
};

export const NotificationBell = () => {
  const { listNotifications, markNotificationRead, markAllNotificationsRead, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.isRead ? 0 : 1), 0),
    [notifications]
  );

  const isDarkMode =
    !document.documentElement.hasAttribute("data-theme") ||
    document.documentElement.getAttribute("data-theme") === "dark";

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const result = await listNotifications(30);

        if (!isMounted) {
          return;
        }

        setNotifications(result.notifications);
      } catch {
        if (!isMounted) {
          return;
        }

        setNotifications([]);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, listNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !isOpen) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const result = await listNotifications(30);

        if (!isMounted) {
          return;
        }

        setNotifications(result.notifications);
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadError("Could not load notifications.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isOpen, listNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const markAllAsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));

    try {
      await markAllNotificationsRead();
    } catch {
      // Keep optimistic state to avoid UI flicker.
    }
  };

  const markOneAsRead = async (item: NotificationItem) => {
    setNotifications((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, isRead: true, readAt: entry.readAt ?? new Date().toISOString() } : entry
      )
    );

    try {
      await markNotificationRead(item.id);
    } catch {
      // Keep optimistic state to avoid UI flicker.
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
          isDarkMode
            ? "border-white/12 bg-white/[0.04] text-slate-200 hover:bg-white/[0.09] hover:text-white"
            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
        aria-label="Open notifications"
      >
        <Mail className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-slate-950 bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 top-11 z-50 w-[22rem] overflow-hidden rounded-2xl border shadow-2xl ${
            isDarkMode
              ? "border-white/10 bg-slate-900 shadow-black/50"
              : "border-slate-200 bg-white shadow-slate-900/12"
          }`}
        >
          <div
            className={`flex items-center justify-between px-4 py-3 ${
              isDarkMode ? "border-b border-white/10" : "border-b border-slate-200"
            }`}
          >
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Notifications
              </p>
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {unreadCount} unread
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition ${
                isDarkMode
                  ? "text-sky-300 hover:bg-sky-400/10"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {isLoading ? <p className="px-2 py-2 text-xs text-slate-400">Loading notifications...</p> : null}
            {loadError ? <p className="px-2 py-2 text-xs text-rose-300">{loadError}</p> : null}

            {!isLoading && notifications.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs text-slate-400">
                No notifications yet.
              </p>
            ) : null}

            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void markOneAsRead(item)}
                className={`mb-1 w-full rounded-xl border px-3 py-2.5 text-left transition last:mb-0 ${
                  item.isRead
                    ? isDarkMode
                      ? "border-white/6 bg-white/[0.02]"
                      : "border-slate-200 bg-slate-50"
                    : isDarkMode
                      ? "border-sky-300/30 bg-sky-500/10"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {item.title}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] ${
                      isDarkMode ? "text-slate-500" : "text-slate-500"
                    }`}
                  >
                    {formatAge(item.createdAt)}
                  </span>
                </div>
                <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {item.body}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
