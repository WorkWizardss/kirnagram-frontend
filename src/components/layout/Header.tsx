import { Sun, Moon, Bell, Coins } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { useNotificationStore } from "@/store/notificationStore";
import avatar2 from "@/assets/avatar-2.jpg";
import kirnagramLogo from "@/assets/kirnagramlogo.png";
import { fetchCreditsSummary } from "@/lib/creditsApi";

const API_BASE = "http://127.0.0.1:8000";

export function Header() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount, setNotifications, notifications } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  // Function to fetch notifications and preserve read status
  const fetchNotifications = async (user: any) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/notifications/recent?hours=720&limit=100`, {
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
            user_id: n.from_user_id || n.user_id,
            user_name: n.from_user_name || n.user_name || "User",
            user_image: n.from_user_image || n.user_image || null,
            action: n.action || n.type || "notification",
            description: n.description || n.message || "",
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

  const loadCredits = async (user: any) => {
    if (!user) {
      setCreditsBalance(null);
      return;
    }
    try {
      const data = await fetchCreditsSummary();
      setCreditsBalance(data.balance ?? 0);
    } catch {
      setCreditsBalance(null);
    }
  };

  // Load notifications on mount and set up polling
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setNotifications([]);
        setCreditsBalance(null);
        return;
      }

      // Initial fetch only (no polling to avoid flickering)
      await fetchNotifications(user);
      await loadCredits(user);
    });

    return () => unsubscribe();
  }, [setNotifications]);


  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="glass-header w-full">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6 w-full">
        {/* Logo - Only one visible at a time */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={kirnagramLogo}
            alt="Kirnagram Logo"
            className="block lg:hidden w-8 h-8 object-contain"
          />
          <span className="font-display font-bold text-base lg:text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <span className="block lg:hidden">kirnagram</span>
          </span>
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
              <Sun className="w-5 h-5 icon-outline" style={{ color: '#fff' }} />
            ) : (
              <Moon className="w-5 h-5 icon-outline" style={{ color: '#111' }} />
            )}
          </button>
          
          {/* Notifications - visible on all screens */}
          <button 
            onClick={() => navigate("/notifications")}
            className="relative p-2 hover:bg-muted rounded-lg transition-colors group flex items-center justify-center"
            title="View notifications"
          >
            <Bell className="w-5 h-5 icon-outline" style={{ color: theme === 'dark' ? '#fff' : '#111' }} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-destructive rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</span>
              </div>
            )}
          </button>

          {/* Credits Wallet */}
          <button
            onClick={() => navigate("/credits")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/15 to-secondary/20 hover:from-primary/25 hover:to-secondary/30 transition-colors"
            title="Open credits wallet"
          >
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {creditsBalance ?? "--"}
            </span>
          </button>
          
          
        </div>
      </div>

    </header>
  );
}
