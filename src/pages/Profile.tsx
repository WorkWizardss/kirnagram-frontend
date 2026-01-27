import { MainLayout } from "@/components/layout/MainLayout";
import {
  Settings,
  Share2,
  Edit,
  Grid,
  Bookmark,
  Heart,
  Award,
  Link as LinkIcon,
  MapPin,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import avatar2 from "@/assets/avatar-2.jpg";
import profileIcon from "@/assets/profileicon.png";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import heroBanner from "@/assets/hero-banner.jpg";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";

const tabs = [
  { id: "posts", label: "Posts", icon: Grid },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "liked", label: "Liked", icon: Heart },
];

const emptyMessages: Record<string, string> = {
  posts: "No posts yet",
  saved: "No saved items yet",
  liked: "No liked posts yet",
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  

  const [stats, setStats] = useState({
  posts: 0,
  followers: 0,
  following: 0,
});

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();

      // Fetch profile
      const res = await fetch("http://127.0.0.1:8000/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Profile fetch failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setProfile(data);

      // Fetch stats
      const statsRes = await fetch("http://127.0.0.1:8000/profile/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsRes.ok) {
        throw new Error(`Stats fetch failed: ${statsRes.status} ${statsRes.statusText}`);
      }

      const statsData = await statsRes.json();
      setStats(statsData);

    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, []);

  // Show loading state
  if (loading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto pb-20 md:pb-0 flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  // Handle missing profile
  if (!profile) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto pb-20 md:pb-0 flex items-center justify-center h-96">
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </MainLayout>
    );
  }

  const fallbackAvatar = profile.image_name && 
    profile.image_name.trim() !== "" && 
    !profile.image_name.includes("default") &&
    !profile.image_name.includes("placeholder") &&
    !profile.image_name.startsWith("blob:")  // ✅ Filter out blob URLs
    ? `${profile.image_name}?t=${Date.now()}`
    : profile.gender === "male"
      ? maleIcon
      : profile.gender === "female"
        ? femaleIcon
        : profileIcon;

  const coverImage = profile.cover_image && 
    profile.cover_image.trim() !== "" &&
    !profile.cover_image.includes("default") &&
    !profile.cover_image.includes("placeholder") &&
    !profile.cover_image.startsWith("blob:")  // ✅ Filter out blob URLs
    ? `${profile.cover_image}?t=${Date.now()}`
    : heroBanner;

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0 overflow-x-hidden">
        {/* Cover Photo */}
        <div className="relative h-32 sm:h-48 md:h-64 rounded-none sm:rounded-2xl overflow-hidden">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="relative px-4 -mt-16 sm:-mt-20">
          {/* Avatar and Actions Row */}
          <div className="flex items-end justify-between mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-r from-primary to-secondary">
                 <img
                   src={(fallbackAvatar && typeof fallbackAvatar === 'string' && fallbackAvatar.startsWith('http') ? `${fallbackAvatar}?t=${Date.now()}` : (fallbackAvatar || avatar2))}
                   alt="Profile"
                    className="w-full h-full rounded-full object-cover border-4 border-background"
                    />

              </div>
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-background" />
            </div>

            {/* Action Buttons - Right side on mobile */}
            <div className="flex gap-2 mb-2">
              <Link
                to="/edit-profile"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Link>
              <button className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-muted/50 rounded-xl font-medium text-sm transition-all">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Link
                to="/settings"
                className="p-2 glass-card hover:bg-muted/50 rounded-xl transition-all"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Name and Username */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-display font-bold">{profile.full_name}</h1>
              <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-pro">PRO</span>
              <p className="text-muted-foreground text-sm">@{profile.username || profile.full_name?.toLowerCase().replace(" ", "")}</p>
            </div>
          </div>

          {/* Stats */}
         <div className="flex gap-6 py-4 border-y border-border">
  <div className="text-center">
    <p className="text-lg sm:text-xl md:text-2xl font-display font-bold">
      {stats.posts}
    </p>
    <p className="text-xs sm:text-sm text-muted-foreground">Posts</p>
  </div>

  <Link to={`/user/${profile.firebase_uid}/followers`} className="text-center hover:opacity-80 transition-opacity">
    <p className="text-lg sm:text-xl md:text-2xl font-display font-bold">
      {stats.followers}
    </p>
    <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
  </Link>

  <Link to={`/user/${profile.firebase_uid}/following`} className="text-center hover:opacity-80 transition-opacity">
    <p className="text-lg sm:text-xl md:text-2xl font-display font-bold">
      {stats.following}
    </p>
    <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
  </Link>
</div>
          {/* Bio */}
          <div className="mt-4 space-y-3">
            <p className="text-foreground text-sm sm:text-base">{profile.bio || "No bio added yet"}</p>


            <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location || "Location not set"}
              </span>
              <span className="flex items-center gap-1">
              <LinkIcon className="w-4 h-4" />
               {profile.website ? (
               <a
               href={profile.website}
               target="_blank"
               className="text-primary hover:underline"
               >
               {profile.website}
                </a>
              ) : (
              "No website"
             )}
            </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-primary" />
                Top 1% Creator
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-border">
          <div className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
          <p className="text-sm sm:text-base font-medium">
            {emptyMessages[activeTab]}
          </p>
          <p className="text-xs sm:text-sm">Check back later.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
