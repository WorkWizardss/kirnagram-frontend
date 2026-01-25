import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, Clock, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useNotificationStore } from "@/store/notificationStore";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import profileIcon from "@/assets/profileicon.png";

const API_BASE = "http://127.0.0.1:8000";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAllAsRead, removeNotification } = useNotificationStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Mark all as read when viewing notifications page
    markAllAsRead();
  }, [markAllAsRead]);

  // Function to delete notification from database
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setDeleting(notificationId);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Remove from local store
        removeNotification(notificationId);
        toast({
          description: "Notification removed",
          duration: 1500,
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: "Could not delete notification",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setDeleting(null);
    }
  };

  const parseDateSafe = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const formatTime = (timestamp: string) => {
    const date = parseDateSafe(timestamp);
    if (!date) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // If timestamp is in the future, treat as just now
    if (diffMs < 0) return "Just now";

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  const formatFullTime = (timestamp: string) => {
    const date = parseDateSafe(timestamp);
    if (!date) return "Unknown time";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getFallbackAvatar = (userImage: string | null) => {
    if (userImage && userImage.trim() !== "" && !userImage.includes("default")) {
      return userImage;
    }
    return profileIcon;
  };

  if (!mounted) return null;

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-display font-bold flex items-center gap-2">
                <Bell className="w-6 h-6" />
                Notifications
              </h1>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  for (const n of notifications) {
                    await handleDeleteNotification(n.id);
                  }
                }}
                className="text-xs md:text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-lg hover:bg-muted/50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground mt-2">
              Updates from all users will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-2 md:px-4 py-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-muted/40 hover:bg-muted/60 rounded-lg p-3 md:p-4 transition-all border border-border/50 group active:scale-95 cursor-pointer"
                onClick={() => handleDeleteNotification(notif.id)}
              >
                <div className="flex gap-3 items-start">
                  {/* Avatar */}
                  <img
                    src={getFallbackAvatar(notif.user_image)}
                    alt={notif.user_name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm md:text-base">
                          {notif.user_name}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                          {notif.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1"
                          title={formatFullTime(notif.timestamp)}
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button - Always visible */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notif.id);
                    }}
                    disabled={deleting === notif.id}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
                    title="Remove notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
