import { Plus, Settings, Globe, ChevronDown } from "lucide-react";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

const stories = [
  { id: 1, name: "Add Story", isAdd: true },
  { id: 2, name: "NeonDrmr", image: avatar1, isLive: true, activity: "Playing VR Chat..." },
  { id: 3, name: "SynthArt", image: avatar2, time: "2h ago" },
  { id: 4, name: "PixelMst", image: avatar3, time: "5h ago" },
];

const liveActivity = [
  { id: 1, name: "sarasedai", action: "generated", time: "Just now", avatar: avatar1 },
  { id: 2, name: "max_flow", action: "generated", time: "2m ago", avatar: avatar2 },
  { id: 3, name: "ella.ai", action: "went Live in", time: "5m ago", avatar: avatar3 },
];

const trending = [
  "#NeuralLinkUpdate",
  "#CyberArt2024",
  "#AICreators",
];

export function RightSidebar() {
  return (
    <aside className="hidden xl:block w-80 space-y-4 sticky top-20 h-fit">
      {/* Stories */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">STORIES</h3>
          <span className="badge-live">LIVE</span>
        </div>

        <div className="space-y-3">
          {stories.map((story) => (
            <div key={story.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              {story.isAdd ? (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <div className={story.isLive ? "story-ring-live" : "story-ring"}>
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{story.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {story.isAdd ? "Share your moment" : story.isLive ? story.activity : story.time}
                </p>
              </div>
              {story.isLive && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-destructive/20 text-destructive rounded">
                  LIVE
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm">LIVE ACTIVITY</h3>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Globe className="w-3 h-3" />
            GLOBAL
          </span>
        </div>

        <div className="space-y-3">
          {liveActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <img
                src={activity.avatar}
                alt={activity.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
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
            <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-primary-foreground rounded-full transition-all" />
            </div>
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
