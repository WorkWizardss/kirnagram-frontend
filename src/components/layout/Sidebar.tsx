import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Plus, Sparkles, User, Menu, X, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase";
import avatar2 from "@/assets/avatar-2.jpg";
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
  { icon: User, label: "Profile", path: "/profile" },
];

const publisherItem: NavItem = { 
  icon: UserPlus, 
  label: "Become a Publisher", 
  path: "/become-publisher", 
  isPublisher: true 
};


interface SidebarProps {
  fromProfile?: boolean;
}

export function Sidebar({ fromProfile }: SidebarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [myStories, setMyStories] = useState<any[]>([]);

  // Fetch my stories to determine if story ring should show
  useEffect(() => {
    const fetchMyStories = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const response = await fetch("http://localhost:8000/stories/my-stories", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const stories = await response.json();
          setMyStories(Array.isArray(stories) ? stories : []);
        }
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      }
    };

    fetchMyStories();

    // Refresh stories when location changes (e.g., after uploading a story)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchMyStories();
    });

    return () => unsubscribe();
  }, [location]);

  // Highlight parent menu for subpages (e.g., /ai-creator/earnings highlights AI Creator)
  const isActive = (path: string) => {
    if (path === "/profile") {
      // Only active if on /profile or posts from profile
      return location.pathname === "/profile" || (fromProfile && location.pathname === "/posts");
    }
    if (path === "/") {
      // Feeds is active for / or /posts unless fromProfile is true
      if (fromProfile && location.pathname === "/posts") return false;
      return location.pathname === "/" || location.pathname === "/posts";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-card/80 backdrop-blur-xl border-r border-border z-40 flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              kirnagram
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
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

      
        <div className="p-4 border-t border-border shrink-0 flex items-center">
          <button
            onClick={async () => {
              await auth.signOut();
                navigate("/login");
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-300 w-full"
              >
              <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
