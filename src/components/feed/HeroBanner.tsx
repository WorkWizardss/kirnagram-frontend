import { ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const API_BASE = "http://127.0.0.1:8000";

type HomeAd = {
  _id: string;
  publisher_id: string;
  ad_name: string;
  business_name?: string;
  description?: string;
  photo_preview_url?: string;
  video_preview_url?: string;
  website_url?: string;
};

export function HeroBanner() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<HomeAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaPhase, setMediaPhase] = useState<"image" | "video">("image");

  useEffect(() => {
    const loadHomeAds = async () => {
      try {
        const res = await fetch(`${API_BASE}/ads/public/placement-ads?placement=home_banner&limit=20`);
        if (!res.ok) return;
        const data = await res.json();
        const items: HomeAd[] = Array.isArray(data?.items) ? data.items : [];
        setAds(items);
        if (items.length > 1) {
          setCurrentIndex(Math.floor(Math.random() * items.length));
        }
      } catch {
        setAds([]);
      }
    };

    loadHomeAds();
  }, []);

  const currentAd = useMemo(() => {
    if (ads.length === 0) return null;
    return ads[currentIndex % ads.length] || null;
  }, [ads, currentIndex]);

  useEffect(() => {
    setMediaPhase("image");
  }, [currentAd?._id]);

  useEffect(() => {
    if (ads.length <= 1 && !currentAd) return;

    const hasImage = Boolean(currentAd?.photo_preview_url);
    const hasVideo = Boolean(currentAd?.video_preview_url);

    let timerId: number;

    if (currentAd && hasImage && hasVideo && mediaPhase === "image") {
      timerId = window.setTimeout(() => {
        setMediaPhase("video");
      }, 2000);
    } else {
      const nextDelay = currentAd && hasImage && hasVideo ? 4000 : 6000;
      timerId = window.setTimeout(() => {
        if (ads.length > 0) {
          setCurrentIndex((prev) => (prev + 1) % ads.length);
        }
      }, nextDelay);
    }

    return () => window.clearTimeout(timerId);
  }, [ads.length, currentAd, mediaPhase]);

  useEffect(() => {
    if (!currentAd?._id) return;
    fetch(`${API_BASE}/ads/campaigns/${currentAd._id}/track-view`, { method: "POST" }).catch(() => undefined);
  }, [currentAd?._id]);

  const handleViewDetails = () => {
    if (!currentAd) return;
    navigate(`/publisher/business-profile/${currentAd.publisher_id}`);
  };

  const showVideo = Boolean(currentAd?.video_preview_url) && (!currentAd?.photo_preview_url || mediaPhase === "video");
  const bgImage = currentAd?.photo_preview_url || heroBanner;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleViewDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleViewDetails();
        }
      }}
      className="relative block w-full overflow-hidden rounded-2xl border border-border/50 bg-black text-left"
    >
      <div className="absolute inset-0">
        {showVideo ? (
          <video
            key={`${currentAd?._id}-video`}
            src={currentAd?.video_preview_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={bgImage}
            alt={currentAd?.ad_name || "Cyber Renaissance"}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="relative h-[360px] md:h-[380px] lg:h-[400px] p-5 md:p-7 lg:p-8 flex items-end">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse-soft" />
            {currentAd ? "SPONSORED AD" : "PREMIUM DROP"}
          </span>

          <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold mb-3 text-white" style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}>
            {currentAd ? (
              <>
                {currentAd.business_name ? <span className="gradient-text">{currentAd.business_name}</span> : "Featured Brand"}
                <br />
                {currentAd.ad_name}
              </>
            ) : (
              <>
                The <span className="gradient-text">Cyber Renaissance</span>
                <br />
                Has Arrived
              </>
            )}
          </h2>

          <p className="text-white/95 text-sm md:text-base mb-6 max-w-lg" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {currentAd?.description || "Unlock exclusive AI-generated assets and collaborative tools designed for the next generation."}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleViewDetails();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95"
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/discoverview");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-border rounded-full font-medium text-sm hover:bg-muted/50 transition-all"
            >
              Explore Feed
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {ads.length > 0 && currentAd && (
            <p className="text-xs text-white/85 mt-3" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              {currentAd.photo_preview_url && currentAd.video_preview_url
                ? mediaPhase === "image"
                  ? "Preview image showing for 2 seconds"
                  : "Preview video showing for 4 seconds"
                : "Auto rotating sponsored ads"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
