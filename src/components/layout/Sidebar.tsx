import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Plus, Sparkles, User, Menu, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import avatar2 from "@/assets/avatar-2.jpg";

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
  { icon: Plus, label: "Create New", path: "/create", isCreate: true },
  { icon: Sparkles, label: "AI Creator", path: "/ai-creator" },
  { icon: User, label: "Profile", path: "/profile" },
];

const publisherItem: NavItem = { 
  icon: UserPlus, 
  label: "Become a Publisher", 
  path: "/become-publisher", 
  isPublisher: true 
};

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className="hidden lg:flex fixed lg:sticky top-0 left-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border z-50 flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              KIRANAGRAM
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                item.isCreate
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                  : isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {!item.isCreate && isActive(item.path) && (
                <span className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
              )}
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* Become a Publisher - Desktop Only */}
          <div className="pt-4 mt-4 border-t border-border">
            <Link
              to={publisherItem.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive(publisherItem.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-dashed border-primary/30 hover:border-primary/60"
              )}
            >
              <publisherItem.icon className="w-5 h-5" />
              <span className="font-medium">{publisherItem.label}</span>
            </Link>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="p-[2px] rounded-full bg-gradient-to-r from-primary to-primary/70">
              <img
                src={avatar2}
                alt="User"
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-foreground">Elara Vance</p>
              <p className="text-xs text-muted-foreground truncate">@elaravance</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
