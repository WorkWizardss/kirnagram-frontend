import { Sun, Moon, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { useNotificationStore } from "@/store/notificationStore";
import avatar2 from "@/assets/avatar-2.jpg";

const API_BASE = "http://127.0.0.1:8000";

export function Header() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount, setNotifications, notifications } = useNotificationStore();
  const [loading, setLoading] = useState(false);

  // Function to fetch notifications and preserve read status
  const fetchNotifications = async (user: any) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/notifications/recent?hours=24&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Get current notifications to preserve read status
        const currentNotifs = notifications;
        const notificationMap = new Map(currentNotifs.map(n => [n.id, n]));

        const fetchedNotifications = (data.notifications || []).map((n: any) => {
          const existing = notificationMap.get(n._id);
          return {
            id: n._id,
            user_id: n.user_id,
            user_name: n.user_name,
            user_image: n.user_image,
            action: n.action,
            description: n.description,
            timestamp: n.timestamp,
            // Preserve read status if notification already exists
            read: existing ? existing.read : false,
          };
        });
        setNotifications(fetchedNotifications);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Load notifications on mount and set up polling
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setNotifications([]);
        return;
      }

      // Initial fetch only (no polling to avoid flickering)
      await fetchNotifications(user);
    });

    return () => unsubscribe();
  }, [setNotifications]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border w-full">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 w-full">
        {/* Mobile Logo */}
        <Link to="/" className="lg:hidden flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">K</span>
          </div>
          <span className="font-display font-bold text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Kiranagram</span>
        </Link>

        {/* Desktop Logo - Shows KIRANAGRAM */}
        <Link to="/" className="hidden lg:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">K</span>
          </div>
          <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">KIRANAGRAM</span>
        </Link>

        {/* Spacer for desktop layout */}
        <div className="hidden lg:flex flex-1" />

        {/* Right Actions - Visible on all screens */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Theme toggle - visible on all screens */}
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Moon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {/* Notifications - visible on all screens */}
          <button 
            onClick={() => navigate("/notifications")}
            className="relative p-2 hover:bg-muted rounded-lg transition-colors group flex items-center justify-center"
            title="View notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-destructive rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
              </div>
            )}
          </button>
          
          {/* Profile - only on desktop */}
          <Link to="/profile" className="hidden lg:block">
            <img
              src={avatar2}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/50"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
