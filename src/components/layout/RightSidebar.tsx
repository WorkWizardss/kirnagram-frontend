import { Plus, Settings, Globe, ChevronDown, Bell, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

const stories = [
  { id: 1, name: "Add Story", isAdd: true },
  { id: 2, name: "NeonDrmr", image: avatar1, isLive: true, activity: "Playing VR Chat..." },
  { id: 3, name: "SynthArt", image: avatar2, time: "2h ago" },
  { id: 4, name: "PixelMst", image: avatar3, time: "5h ago" },
];



const trending = [
  "#NeuralLinkUpdate",
  "#CyberArt2024",
  "#AICreators",
];

export function RightSidebar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme ? useTheme() : { theme: "dark", setTheme: () => {} };

  return (
    <aside className="w-full space-y-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">

      {/* Settings, Credits, Notifications */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm">Settings</h3>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              English (US)
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dark Mode</span>
            <div
              className="w-11 h-6 bg-primary rounded-full relative cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle dark mode"
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-primary-foreground rounded-full transition-all ${theme === "dark" ? "right-1" : "left-1"}`}
              />
            </div>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition cursor-pointer"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Notifications</span>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition cursor-pointer"
            onClick={() => navigate("/credits")}
          >
            <Coins className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Credits</span>
          </div>
          <div
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition cursor-pointer"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Settings</span>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-sm mb-3">Trending Now</h3>
        <p className="text-xs text-muted-foreground mb-2">Technology • Trending</p>
        <div className="flex flex-wrap gap-2">
          {trending.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
