import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Search, 
  Sparkles, 
  Flame, 
  Zap, 
  Palette, 
  Wand2, 
  Camera,
  Shuffle,
  ChevronRight,
  Heart,
  Eye,
  Crown,
  MessageCircle,
  UserPlus,
  UserCheck,
  Clock
} from "lucide-react";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase";
import cyberGirl from "@/assets/cyber-girl.jpg";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import heroBanner from "@/assets/hero-banner.jpg";
import profileIcon from "@/assets/profileicon.png";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
const styleCategories = [
  { id: "all", label: "For You", icon: Sparkles, gradient: "from-primary to-secondary" },
  { id: "trending", label: "Hot Now", icon: Flame, gradient: "from-orange-500 to-red-500" },
  { id: "neon", label: "Neon Glow", icon: Zap, gradient: "from-cyan-400 to-blue-500" },
  { id: "artistic", label: "Artistic", icon: Palette, gradient: "from-purple-500 to-pink-500" },
  { id: "fantasy", label: "Fantasy", icon: Wand2, gradient: "from-emerald-400 to-teal-500" },
  { id: "portrait", label: "Portraits", icon: Camera, gradient: "from-amber-400 to-orange-500" },
];

const spotlightArt = {
  image: cyberGirl,
  title: "Ethereal Dreams",
  creator: "NeonMaster",
  creatorAvatar: avatar1,
  views: "24.5K",
  likes: "8.2K",
  style: "Cyberpunk Noir",
};

const featuredStyles = [
  { id: 1, name: "Neon Cyberpunk", image: cyberGirl, uses: "12.4K", color: "from-cyan-500/20 to-purple-500/20" },
  { id: 2, name: "Soft Dreamy", image: avatar2, uses: "8.9K", color: "from-pink-500/20 to-rose-500/20" },
  { id: 3, name: "Dark Fantasy", image: heroBanner, uses: "15.2K", color: "from-emerald-500/20 to-teal-500/20" },
];

const discoveryGrid = [
  { id: 1, image: cyberGirl, creator: "NeonDreamer", style: "Cyber Noir", likes: 2400, size: "large" },
  { id: 2, image: avatar1, creator: "SynthArt", style: "Neon Portrait", likes: 1800, size: "small" },
  { id: 3, image: avatar2, creator: "PixelMist", style: "Soft Glow", likes: 3200, size: "small" },
  { id: 4, image: heroBanner, creator: "CyberScape", style: "Future City", likes: 4100, size: "medium" },
  { id: 5, image: avatar3, creator: "CodexAI", style: "Digital Soul", likes: 1500, size: "small" },
  { id: 6, image: cyberGirl, creator: "SynthWave", style: "Retro Future", likes: 2800, size: "medium" },
  { id: 7, image: avatar1, creator: "GlowArtist", style: "Neon Dreams", likes: 890, size: "small" },
  { id: 8, image: avatar2, creator: "DigitalMuse", style: "Ethereal", likes: 5600, size: "small" },
];

const topCreators = [
  { id: 1, name: "NeonMaster", avatar: avatar1, followers: "45.2K", artworks: 234 },
  { id: 2, name: "CyberQueen", avatar: avatar2, followers: "38.9K", artworks: 189 },
  { id: 3, name: "PixelWizard", avatar: avatar3, followers: "32.1K", artworks: 156 },
];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isShuffling, setIsShuffling] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || !currentUser) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://127.0.0.1:8000/follow/search/${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 500);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return count.toString();
  };

  const getProfileImage = (user: any) => {
    const img = user.image_name as string | undefined;
    const hasCustomImage = img && img.trim() !== "" && !img.includes("default") && !img.includes("placeholder") && !img.startsWith("blob:");

    if (hasCustomImage) {
      const cacheBuster = img.includes("?") ? "&" : "?";
      return `${img}${cacheBuster}t=${Date.now()}`;
    }

    if (user.gender === "male") return maleIcon;
    if (user.gender === "female") return femaleIcon;
    return profileIcon;
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="w-full min-h-screen pb-24 md:pb-8 bg-background overflow-x-hidden">
        <div className="max-w-2xl md:max-w-6xl mx-auto">
        
        {/* Header with Search & Shuffle */}
        <div className="sticky md:relative top-0 md:top-auto z-50 md:z-10 bg-background/95 backdrop-blur-sm py-3 sm:py-4 px-3 sm:px-4 md:px-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2.5 sm:py-3 bg-card border border-border rounded-2xl text-sm sm:text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            <button 
              onClick={handleShuffle}
              className={cn(
                "p-2.5 sm:p-3 rounded-lg sm:rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground transition-all hover:scale-105 active:scale-95 flex-shrink-0",
                isShuffling && "animate-spin"
              )}
              title="Shuffle"
            >
              <Shuffle className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </div>
        </div>
        

        {/* Search Results Section */}
        {searchQuery.trim() && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-display font-semibold mb-4">
              {searchResults.length === 0 ? "No users found" : `Found ${searchResults.length} user${searchResults.length !== 1 ? 's' : ''}`}
            </h3>
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const handleFollowClick = async (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const currentUser = auth.currentUser;
                    if (!currentUser || actionLoading) return;

                    setActionLoading(user.firebase_uid);
                    try {
                      const token = await currentUser.getIdToken();
                      
                      if (user.follow_status === "following" || user.follow_status === "requested") {
                        // Unfollow
                        const res = await fetch(`http://127.0.0.1:8000/follow/unfollow/${user.firebase_uid}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          user.follow_status = "none";
                          setSearchResults([...searchResults]);
                        }
                      } else {
                        // Follow
                        const res = await fetch(`http://127.0.0.1:8000/follow/send-request/${user.firebase_uid}`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (res.ok) {
                          const data = await res.json();
                          user.follow_status = data.follow_status;
                          setSearchResults([...searchResults]);
                        }
                      }
                    } catch (error) {
                      console.error("Follow action failed:", error);
                    } finally {
                      setActionLoading(null);
                    }
                  };
                  

                  return (
                    
                    
                    <div
                      key={user.firebase_uid}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group gap-2"
                    >
                      <Link to={`/user/${user.firebase_uid}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={getProfileImage(user)}
                          alt={user.full_name}
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{user.full_name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">@{user.username || user.full_name?.toLowerCase().replace(" ", "")}</p>
                          {user.account_type === "private" && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                              Private
                            </p>
                          )}
                        </div>
                      </Link>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {user.follow_status === "following" ? (
                          <button
                            onClick={handleFollowClick}
                            disabled={actionLoading === user.firebase_uid}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-xs sm:text-sm whitespace-nowrap hover:bg-muted/80 transition-all disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Following</span>
                          </button>
                        ) : user.follow_status === "requested" ? (
                          <button
                            onClick={handleFollowClick}
                            disabled={actionLoading === user.firebase_uid}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-muted text-foreground font-semibold text-xs sm:text-sm whitespace-nowrap hover:bg-muted/80 transition-all disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Requested</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleFollowClick}
                            disabled={actionLoading === user.firebase_uid}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm whitespace-nowrap hover:bg-primary/90 transition-all disabled:opacity-50"
                          >
                            <UserPlus className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Follow</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!searchQuery.trim() && (
          <>
          <div className="sticky md:relative top-16 md:top-auto z-40 md:z-auto bg-background/95 backdrop-blur-sm py-2 sm:py-3 px-3 sm:px-4 md:px-6 mb-6 sm:mb-8">
         <StoriesRow />
          </div>
        {/* Spotlight Section */}
        <div className="relative mb-8 rounded-3xl overflow-hidden group cursor-pointer">
          <div className="aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] w-full">
            <img 
              src={spotlightArt.image} 
              alt={spotlightArt.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          
          {/* Spotlight Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
          
          {/* Spotlight Badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold backdrop-blur-sm">
            <Crown className="w-4 sm:w-4 h-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Today's Spotlight</span>
            <span className="sm:hidden">Spotlight</span>
          </div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-primary font-medium mb-1 truncate">{spotlightArt.style}</p>
                <h2 className="text-base sm:text-2xl font-display font-bold mb-2 line-clamp-2 sm:line-clamp-none">{spotlightArt.title}</h2>
                <div className="flex items-center gap-2 sm:gap-3">
                  <img 
                    src={spotlightArt.creatorAvatar} 
                    alt={spotlightArt.creator}
                    className="w-7 sm:w-8 h-7 sm:h-8 rounded-full border-2 border-primary flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium truncate">{spotlightArt.creator}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{spotlightArt.views}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{spotlightArt.likes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Styles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-display font-semibold min-w-0">Trending Styles</h3>
            <button className="flex items-center gap-1 text-sm text-primary hover:underline flex-shrink-0">
              <span className="hidden sm:inline">See all</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredStyles.map((style) => (
              <div 
                key={style.id}
                className={cn(
                  "relative rounded-2xl overflow-hidden cursor-pointer group h-40",
                  "bg-gradient-to-br",
                  style.color
                )}
              >
                <img 
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3">
                  <p className="font-semibold text-sm truncate">{style.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{style.uses} uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Creators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-display font-semibold">Top Creators</h3>
            <button className="flex items-center gap-1 text-sm text-primary hover:underline flex-shrink-0">
              <span className="hidden sm:inline">See all</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {topCreators.map((creator, index) => (
              <div 
                key={creator.id}
                className="flex-shrink-0 w-28 flex flex-col items-center p-3 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="relative mb-2">
                  <div className={cn(
                    "w-16 h-16 rounded-full p-0.5",
                    index === 0 ? "bg-gradient-to-r from-primary to-secondary" : "bg-gradient-to-r from-muted to-muted-foreground/30"
                  )}>
                    <img 
                      src={creator.avatar} 
                      alt={creator.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Crown className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold truncate w-full text-center">{creator.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 w-full text-center">{creator.followers}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Style Categories - Horizontal Scroll */}
        <div className="sticky md:relative top-16 md:top-auto z-40 md:z-auto bg-background/95 backdrop-blur-sm py-2 sm:py-3 px-3 sm:px-4 md:px-6 mb-6 sm:mb-8">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {styleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full sm:rounded-2xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0",
                  activeCategory === cat.id
                    ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                )}
              >
                <cat.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden text-xs">{cat.label === "For You" ? "For" : cat.label === "Neon Glow" ? "Neon" : cat.label === "Artistic" ? "Art" : cat.label === "Fantasy" ? "Fancy" : cat.label === "Hot Now" ? "Hot" : "Port"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Grid */}
        <div className="mb-8">
          <h3 className="text-lg sm:text-xl font-display font-semibold mb-4">Discover Art</h3>
          <div
            className={cn(
              "grid grid-cols-2 sm:grid-cols-3 gap-3 transition-opacity duration-300 w-full",
              isShuffling && "opacity-50"
            )}
            style={{
              gridAutoRows: "120px"
            }}
          >
            {discoveryGrid.map((item, index) => {
              const sizeClasses = {
                large: "col-span-2 row-span-2",
                medium: "col-span-1 row-span-2",
                small: "col-span-1 row-span-1"
              };
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative rounded-2xl overflow-hidden cursor-pointer group",
                    sizeClasses[item.size as keyof typeof sizeClasses]
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <img
                    src={item.image}
                    alt={item.style}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs text-primary font-medium">{item.style}</p>
                    <p className="text-sm font-semibold truncate">{item.creator}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{formatCount(item.likes)}</span>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/50 transition-all duration-300" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Load More */}
        <div className="flex justify-center py-8">
          <button className="px-8 py-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all font-medium text-base">
            Explore More
          </button>
        </div>
          </>
        )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Explore;
