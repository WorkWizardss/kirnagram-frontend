import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import cyberGirl from "@/assets/cyber-girl.jpg";

const stories = [
  { id: 1, name: "Add Story", isAdd: true },
  { id: 2, name: "NeonDrmr", image: avatar1, isLive: true },
  { id: 3, name: "SynthArt", image: avatar2 },
  { id: 4, name: "PixelMist", image: avatar3 },
  { id: 5, name: "Alex", image: cyberGirl },
];

export function StoriesRow() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:hidden">
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
          {story.isAdd ? (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
          ) : (
            <div className={cn(story.isLive ? "story-ring-live" : "story-ring")}>
              <img
                src={story.image}
                alt={story.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground truncate max-w-[64px]">
            {story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
