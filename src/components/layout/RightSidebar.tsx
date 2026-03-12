import { useEffect, useMemo, useState } from "react";
import { Settings, Globe, ChevronDown, Bell, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";

type ApprovedPrompt = {
  tags?: string[];
  remixes_count?: number;
};

const API_BASE = "http://127.0.0.1:8000";

export function RightSidebar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme ? useTheme() : { theme: "dark", setTheme: () => {} };
  const [approvedPrompts, setApprovedPrompts] = useState<ApprovedPrompt[]>([]);

  useEffect(() => {
    const fetchApprovedPrompts = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai-creator/prompts/approved?limit=200&skip=0`);
        if (!res.ok) throw new Error("Failed to load prompts");
        const data = await res.json();
        setApprovedPrompts(Array.isArray(data) ? data : []);
      } catch {
        setApprovedPrompts([]);
      }
    };

    fetchApprovedPrompts();
  }, []);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();

    approvedPrompts.forEach((prompt) => {
      const weight = Math.max(1, Number(prompt.remixes_count || 0));
      (prompt.tags || []).forEach((rawTag) => {
          const normalized = String(rawTag || "")
            .trim()
            .replace(/^#+/, "")
            .toLowerCase();

          if (!normalized) return;
          counts.set(normalized, (counts.get(normalized) || 0) + weight);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => `#${tag}`);
  }, [approvedPrompts]);

  return (
    <aside className="w-full space-y-4 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">

      {/* Settings, Credits, Notifications */}
      <div className="glass-card p-4">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
          aria-label="Open settings"
        >
          <h3 className="font-display font-semibold text-sm">Settings</h3>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
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
        </div>
      </div>

      {/* Trending */}
      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-sm mb-3">Trending Now</h3>
        <p className="text-xs text-muted-foreground mb-2">Technology • Trending</p>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(`/explore?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`)}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
          {trendingTags.length === 0 && (
            <span className="text-xs text-muted-foreground">No trending tags yet</span>
          )}
        </div>
      </div>
    </aside>
  );
}
