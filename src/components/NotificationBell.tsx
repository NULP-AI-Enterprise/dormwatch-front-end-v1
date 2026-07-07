import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BellIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchComplaintDetail,
} from "@/services/problemsApi";
import type { Complaint } from "@/lib/types";

interface NotificationBellProps {
  onSelectComplaint?: (complaint: Complaint) => void;
}

interface NotificationItem {
  notification_id: number;
  user: number;
  title: string;
  message: string;
  complaint: number | null;
  is_read: boolean;
  created_at: string;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "щойно";
  if (diffMins < 60) return `${diffMins} хв. тому`;
  if (diffHours < 24) return `${diffHours} год. тому`;

  return date.toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ onSelectComplaint }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (e) {
      console.warn("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Poll for notifications every 20 seconds
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    // Optimistically mark as read
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === item.notification_id ? { ...n, is_read: true } : n
      )
    );

    // Call API to mark as read
    await markNotificationRead(item.notification_id);

    // If complaint is linked, load its details and open details panel
    if (item.complaint && onSelectComplaint) {
      try {
        const detail = await fetchComplaintDetail(item.complaint);
        if (detail) {
          onSelectComplaint(detail);
        }
      } catch (err) {
        console.warn("Failed to fetch complaint details (probably deleted):", err);
      }
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistically mark all as read
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    
    await markAllNotificationsRead();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground cursor-pointer outline-none"
        >
          <HugeiconsIcon icon={BellIcon} className="size-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-card animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 flex flex-col bg-card border border-border p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-bold text-foreground">Сповіщення</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 cursor-pointer"
            >
              Позначити все як прочитане
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto max-h-72 divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <span className="text-xs text-muted-foreground">Немає сповіщень</span>
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.notification_id}
                onSelect={() => handleNotificationClick(item)}
                className={`flex flex-col items-start gap-1 p-4 cursor-pointer outline-none border-l-2 transition-colors ${
                  item.is_read
                    ? "border-l-transparent hover:bg-muted/30"
                    : "border-l-blue-500 bg-blue-500/5 hover:bg-blue-500/10"
                }`}
              >
                <div className="flex justify-between items-start w-full gap-2">
                  <span className={`text-xs font-semibold leading-tight ${item.is_read ? "text-foreground" : "text-foreground font-bold"}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  {item.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
