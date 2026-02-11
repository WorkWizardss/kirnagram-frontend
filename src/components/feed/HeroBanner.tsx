import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted via-card to-muted border border-border/50">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Cyber Renaissance"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-transparent" />
      </div>

      <div className="relative p-6 md:p-8 lg:p-10">
        <div className="max-w-lg">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse-soft" />
            PREMIUM DROP
          </span>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-3">
            The <span className="gradient-text">Cyber Renaissance</span>
            <br />
            Has Arrived
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md">
            Unlock exclusive AI-generated assets and collaborative tools designed for the next generation.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all hover:scale-105 active:scale-95"
            >
              Explore
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-border rounded-full font-medium text-sm hover:bg-muted/50 transition-all">
              <Play className="w-4 h-4" />
              Watch Trailer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
