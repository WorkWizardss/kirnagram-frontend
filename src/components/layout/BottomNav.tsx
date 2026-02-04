import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Plus, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  isCreate?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Feeds", path: "/" },
  { icon: Compass, label: "Discover", path: "/explore" },
  { icon: Plus, label: "Add Post", path: "/create", isCreate: true },
  { icon: Sparkles, label: "AI Creator", path: "/ai-creator" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300",
              item.isCreate
                ? "relative -mt-5"
                : isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.isCreate ? (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
            ) : (
              <item.icon className="w-5 h-5" />
            )}
            <span className={cn(
              "text-[10px] font-medium",
              item.isCreate && "mt-1"
            )}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
