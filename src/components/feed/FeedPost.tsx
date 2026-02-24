import { useState, useRef } from "react";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import profileIcon from "@/assets/profileicon.png";
import { MoreHorizontal, Heart, MessageCircle, Eye, BadgeCheck, TrendingUp, Sparkles, Share2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useVideoSound } from "@/context/VideoSoundContext";
interface FeedPostProps {
  author: {
    name: string;
    username: string;
    avatar: string;
    isPro?: boolean;
    earnings?: string;
    isVerified?: boolean;
  };
  image: string;
  mediaType?: "image" | "video";
  ratio?: string;
  tags?: string[];
  badge?: string;
  caption?: string;
  likes?: number;
  comments?: number;
  views?: number;
  isLiked?: boolean;
  showRemix?: boolean;
  onRemix?: () => void;
  onAuthorClick?: () => void;
  onPostClick?: () => void;
  onLike?: () => void;
  onOpenLikes?: () => void;
  onOpenComments?: () => void;
  onOpenViews?: () => void;
  onShare?: () => void;
  onAddToStory?: () => void;
}

export function FeedPost({
  author,
  image,
  mediaType,
  ratio,
  tags,
  badge,
  caption,
  likes = 0,
  comments = 0,
  views = 0,
  isLiked = false,
  showRemix = false,
  onRemix,
  onAuthorClick,
  onPostClick,
  onLike,
  onOpenLikes,
  onOpenComments,
  onOpenViews,
  onShare,
  onAddToStory,
}: FeedPostProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const { isMuted, toggleMute } = useVideoSound();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Format large numbers for likes/views
  const formatCount = (value: number) => {
    if (value < 1000) return `${value}`;
    if (value < 1000000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  };

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!video) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        // Pause all other videos
        document.querySelectorAll("video").forEach((v) => {
          if (v !== video) {
            v.pause();
          }
        });

        // Restart from beginning (Reels behavior)
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    },
    { threshold: 0.6 }
  );

  observer.observe(video);

  return () => observer.disconnect();
}, []);

// Helper to get user avatar for comments
function getUserAvatar(user?: { image_name?: string; user_image?: string; gender?: string }) {
  const url = user?.image_name || user?.user_image;
  if (url && typeof url === "string" && url.startsWith("http") && !url.includes("default") && !url.includes("placeholder") && !url.startsWith("blob:")) {
    return url;
  }
  if (user?.gender === "male") return maleIcon;
  if (user?.gender === "female") return femaleIcon;
  return profileIcon;
}


  // Default Add to Story handler
  async function handleAddToStory() {
    try {
      // Show loading (optional: replace with toast/modal)
      // Prepare form data
      const formData = new FormData();
      formData.append("media_type", mediaType || "image");
      formData.append("duration", mediaType === "video" ? "15" : "7");
      formData.append("file", await fetch(image).then(r => r.blob()), "story-media" + (mediaType === "video" ? ".mp4" : ".jpg"));
      // TODO: Add auth token logic here
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to add a story.");
        return;
      }
      const res = await fetch("/api/stories/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to add story");
      }
      alert("Story added!");
    } catch (e: any) {
      alert(e.message || "Failed to add story");
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[600px] transition-all duration-300 hover:scale-[1.01]">
        <div className="rounded-2xl overflow-hidden shadow-lg border bg-white border-zinc-200 text-zinc-800 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-black dark:border-zinc-800 dark:text-white">
        {/* Author Header */}
        <div className="flex items-center justify-between p-4">
          <button className="flex items-center gap-3 text-left" onClick={onAuthorClick}>
            <div className="story-ring">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-800 dark:text-white">{author.name}</span>
                {author.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-muted-foreground">
                {author.isPro && <span className="badge-pro text-[10px]">PRO</span>}
                {author.earnings && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    {author.earnings}
                  </span>
                )}
              </div>
            </div>
          </button>
          <div className="relative">
            <button
              className="p-2 hover:bg-zinc-100 dark:hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Post options"
            >
              <MoreHorizontal className="w-5 h-5 text-zinc-500 dark:text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 rounded-xl border border-zinc-200 dark:border-border bg-white dark:bg-background shadow-lg overflow-hidden z-10">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    setMenuOpen(false);
                    onShare?.();
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-muted flex items-center gap-2"
                  onClick={async () => {
                    setMenuOpen(false);
                    if (onAddToStory) {
                      onAddToStory();
                    } else {
                      await handleAddToStory();
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add to Story
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {showRemix && tags && tags.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  tag === "DESIGN" && "bg-pink-500/20 text-pink-400",
                  tag === "MKT" && "bg-blue-500/20 text-blue-400",
                  tag === "DEV" && "bg-green-500/20 text-green-400",
                  !["DESIGN", "MKT", "DEV"].includes(tag) && "bg-muted text-muted-foreground"
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

{mediaType === "video" ? (
  <div className="relative w-full">
    <video
      ref={videoRef}
      src={image}
      className="w-full object-cover"
      style={{ aspectRatio: ratio?.replace(":", "/") || "9 / 16" }}
      loop
      playsInline
      muted={isMuted}
      controls={false}
      preload="metadata"
    />
    {/* Mute / Unmute Button */}
    <button
      onClick={toggleMute}
      className="
        absolute bottom-5 right-5
        bg-black/60 backdrop-blur-md
        text-white
        rounded-full
        p-3
        transition
        duration-200
        active:scale-90
      "
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  </div>
) : (
  <button className="relative w-full" onClick={onPostClick}>
    <img
      src={image}
      alt="Post"
      className="w-full object-cover"
      style={{ aspectRatio: ratio?.replace(":", "/") || "4 / 5" }}
    />
  </button>
)}

        {/* Remix This Style Button */}
        {showRemix && (
          <div className="px-4 py-3">
            <button
              onClick={onRemix}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-secondary to-accent text-secondary-foreground rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-secondary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              Remix This Style
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pt-3 pb-4 flex items-center gap-6 text-sm">
          <button
            className={cn(
              "flex items-center gap-1.5 min-w-[56px]",
              isLiked ? "text-red-500" : "text-zinc-700 dark:text-foreground"
            )}
            onClick={onLike}
          >
            <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
            <span
              onClick={(event) => {
                event.stopPropagation();
                onOpenLikes?.();
              }}
            >
              {likes}
            </span>
          </button>
          <button
            className="flex items-center gap-1.5 min-w-[56px] text-zinc-700 dark:text-foreground"
            onClick={onOpenComments}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{comments}</span>
          </button>
          <button
            className="flex items-center gap-1.5 min-w-[56px] text-zinc-700 dark:text-foreground"
            onClick={onOpenViews}
          >
            <Eye className="w-5 h-5" />
            <span>{formatCount(views)}</span>
          </button>
        </div>
        {caption && (
          <div className="px-4 pb-4">
            <p className={cn("text-sm text-zinc-700 dark:text-muted-foreground", !captionExpanded && "line-clamp-2")}> 
              {caption}
            </p>
            {caption.length > 80 && (
              <button
                className="mt-1 text-xs text-orange-600 hover:underline dark:text-primary"
                onClick={() => setCaptionExpanded((prev) => !prev)}
              >
                {captionExpanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}
      </div>
        </div>
    </div>
  );
}
export default FeedPost;
