import { useState } from "react";
import { MoreHorizontal, Heart, MessageCircle, Share, Bookmark, BadgeCheck, TrendingUp, Sparkles, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

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
  tags?: string[];
  badge?: string;
  likes?: number;
  comments?: number;
}

export function FeedPost({ author, image, tags, badge, likes = 0, comments = 0 }: FeedPostProps) {
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="glass-card overflow-hidden animate-scale-in">
        {/* Author Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="story-ring">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{author.name}</span>
                {author.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {author.isPro && <span className="badge-pro text-[10px]">PRO</span>}
                {author.earnings && (
                  <span className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    {author.earnings}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
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

        {/* Image */}
        <div className="relative">
          <img
            src={image}
            alt="Post"
            className="w-full aspect-[4/5] object-cover"
          />
          {badge && (
            <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold bg-primary/90 text-primary-foreground rounded-full flex items-center gap-1">
              <span className="text-sm">🔥</span> {badge}
            </span>
          )}
          
          {/* Ethical AI Badge */}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 backdrop-blur-sm">
              ✨ Ethical AI
            </span>
          </div>
        </div>

        {/* Remix This Style Button */}
        <div className="px-4 py-3">
          <button
            onClick={() => setShowRemixModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-secondary to-accent text-secondary-foreground rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-secondary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            Remix This Style
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">4 Credits</span>
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors group">
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm">{likes > 0 ? likes : ""}</span>
            </button>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm">{comments > 0 ? comments : ""}</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Share className="w-5 h-5" />
            </button>
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Remix Modal */}
      {showRemixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">Remix This Style</h2>
              <button
                onClick={() => {
                  setShowRemixModal(false);
                  setUploadedImage(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Style Preview */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Original Style</p>
              <img
                src={image}
                alt="Original style"
                className="w-full h-32 object-cover rounded-xl"
              />
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Your Image</p>
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload your image</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Credits Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl mb-6">
              <span className="text-sm">Cost</span>
              <span className="font-semibold">4 Credits</span>
            </div>

            {/* Action Button */}
            <button
              disabled={!uploadedImage}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all",
                uploadedImage
                  ? "bg-gradient-to-r from-secondary to-accent text-secondary-foreground hover:shadow-lg hover:shadow-secondary/30 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Sparkles className="w-5 h-5" />
              Generate Remix
            </button>
          </div>
        </div>
      )}
    </>
  );
}
