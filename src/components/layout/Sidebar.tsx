import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Plus, Sparkles, User, Menu, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase";
import avatar2 from "@/assets/avatar-2.jpg";
import kirnagramLogo from "@/assets/kirnagramlogo.png";
import {
  LogOut,
} from "lucide-react";
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isCreate?: boolean;
  isPublisher?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Feeds", path: "/" },
  { icon: Compass, label: "Discover", path: "/explore" },
  { icon: Plus, label: "Add Post", path: "/create", isCreate: true },
  { icon: Sparkles, label: "AI Creator", path: "/ai-creator" },
  { icon: UserPlus, label: "Become a Publisher", path: "/become-publisher", isPublisher: true },
  { icon: User, label: "Profile", path: "/profile" },
];


interface SidebarProps {
  fromProfile?: boolean;
}

export function Sidebar({ fromProfile }: SidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Helper for active state
  const isActive = (path: string) => {
    if (path === "/profile") {
      return location.pathname === "/profile" || (fromProfile && location.pathname === "/posts");
    }
    if (path === "/") {
      // Home is active for /, /home, or /posts unless fromProfile is true
      if (fromProfile && location.pathname === "/posts") return false;
      return (
        location.pathname === "/" ||
        location.pathname === "/home" ||
        location.pathname === "/posts"
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Instagram-like sidebar layout
  return (
    <aside
      className={cn(
        "hidden lg:flex fixed top-0 left-0 h-screen w-64 z-40 flex-col justify-between",
        // Light mode: no border, bg-white; dark mode: border-white/10 and bg-transparent
        "bg-white text-zinc-800 dark:bg-transparent dark:border-white/10 dark:text-zinc-200"
      )}
      style={{ background: undefined }}
    >
      {/* Top: Logo */}
      <div className="flex flex-col items-start gap-2 p-6 pb-2 dark:border-b dark:border-zinc-800">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <img
            src={kirnagramLogo}
            alt="Kirnagram Logo"
            className="w-8 h-8 object-contain"
            style={{ filter: 'drop-shadow(0 0 0.5px #fff) drop-shadow(0 0 0.5px #000)' }}
          />
          <span className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-white">kirnagram</span>
        </Link>
      </div>

      {/* Middle: Navigation links (centered vertically) */}
      <nav className="flex-1 flex flex-col justify-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-150 font-medium text-base relative group",
              isActive(item.path)
                ? "bg-orange-100 text-orange-600 font-bold dark:bg-orange-900/40 dark:text-orange-500"
                : "text-zinc-700 hover:bg-orange-50 hover:text-orange-600 dark:text-zinc-200 dark:hover:bg-orange-900/30 dark:hover:text-orange-400"
            )}
            style={{ fontWeight: isActive(item.path) ? 700 : 500 }}
          >
            {/* Orange left outline for active/hover */}
            <span
              className={cn(
                "absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all",
                isActive(item.path)
                  ? "bg-orange-500"
                  : "group-hover:bg-orange-400 group-hover:opacity-80 bg-transparent"
              )}
            />
            <item.icon className={cn(
              "w-6 h-6 z-10",
              isActive(item.path)
                ? "text-orange-600 dark:text-orange-500"
                : "text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400"
            )}/>
            <span className="z-10">{item.label === "Feeds" ? "Home" : item.label === "Add Post" ? "Create" : item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom: Only Logout */}
      <div className="flex flex-col gap-1 pb-6 dark:border-t dark:border-white/10">
        <button
          onClick={async () => {
            await auth.signOut();
            navigate("/login");
          }}
          className="flex items-center gap-4 px-6 py-3 rounded-lg text-zinc-700 hover:bg-orange-50 hover:text-orange-600 dark:text-zinc-200 dark:hover:bg-orange-50/80 dark:hover:text-orange-600 transition-colors duration-150 font-medium text-base w-full"
        >
          <LogOut className="w-6 h-6 text-zinc-400 group-hover:text-orange-600 dark:text-zinc-400 dark:group-hover:text-orange-600" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
