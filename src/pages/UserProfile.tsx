import { MainLayout } from "@/components/layout/MainLayout";
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Grid,
  Bookmark,
  Heart,
  MapPin,
  Calendar,
  BadgeCheck,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
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

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followStatus, setFollowStatus] = useState<"following" | "requested" | "pending" | "none">("none");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load current user and target profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user && userId && userId !== "undefined") {
        try {
          const token = await user.getIdToken();
          
          // Fetch target user profile
          const res = await fetch(`http://127.0.0.1:8000/follow/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) {
            throw new Error(`Profile fetch failed: ${res.status}`);
          }

          const data = await res.json();
          setProfile(data);
          setFollowStatus((data.follow_status || "none") as any);
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFollowAction = async () => {
    if (!currentUser || !profile || isActionLoading) return;

    setIsActionLoading(true);
    try {
      const token = await currentUser.getIdToken();
      
      if (followStatus === "following" || followStatus === "requested") {
        // Unfollow
        const res = await fetch(`http://127.0.0.1:8000/follow/unfollow/${profile.firebase_uid}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setFollowStatus("none");
        }
      } else if (followStatus === "pending") {
        // Follow back
        const res = await fetch(`http://127.0.0.1:8000/follow/follow-back/${profile.firebase_uid}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFollowStatus(data.follow_status as any);
        }
      } else {
        // Send follow request
        const res = await fetch(`http://127.0.0.1:8000/follow/send-request/${profile.firebase_uid}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setFollowStatus(data.follow_status as any);
        }
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

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
          <p className="text-muted-foreground">User not found</p>
        </div>
      </MainLayout>
    );
  }

  // Check if private account
  const isPrivateAccount = profile.account_type === "private";
  const isFollowing = followStatus === "following";
  const canViewFullProfile = !isPrivateAccount || isFollowing || currentUser?.uid === profile.firebase_uid;
  const canMessage = canViewFullProfile || currentUser?.uid === profile.firebase_uid;

  const fallbackAvatar = profile.image_name && 
    profile.image_name.trim() !== "" && 
    !profile.image_name.includes("default") &&
    !profile.image_name.includes("placeholder") &&
    !profile.image_name.startsWith("blob:")
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
    !profile.cover_image.startsWith("blob:")
    ? `${profile.cover_image}?t=${Date.now()}`
    : heroBanner;

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0 overflow-x-hidden">
        {/* Cover Photo with Back Button */}
        <div className="relative h-32 sm:h-48 md:h-64 rounded-none sm:rounded-2xl overflow-hidden">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="relative px-4 -mt-16 sm:-mt-20">
          <div className="flex gap-4 mb-4">
            {/* Avatar on left */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-r from-primary to-secondary">
                <img
                  src={fallbackAvatar}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-background"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-background" />
            </div>

            {/* Stats on right (Instagram mobile style) */}
            <div className="flex-1 flex items-center justify-around pt-8">
              <div className="text-center">
                <p className="text-lg font-display font-bold">
                  {profile.posts_count || 0}
                </p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>

              {canViewFullProfile ? (
                <Link to={`/user/${userId}/followers`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="text-lg font-display font-bold">
                    {profile.followers_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-display font-bold">
                    {profile.followers_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              )}

              {canViewFullProfile ? (
                <Link to={`/user/${userId}/following`} className="text-center hover:opacity-80 transition-opacity">
                  <p className="text-lg font-display font-bold">
                    {profile.following_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </Link>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-display font-bold">
                    {profile.following_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              )}
            </div>
          </div>

          {/* Name and Badge */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-base sm:text-lg font-display font-bold">{profile.full_name}</h1>
              {profile.account_type === "private" && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">PRIVATE</span>
              )}
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary fill-primary/20" />
            </div>
            
            {/* Username */}
            <p className="text-muted-foreground text-sm">@{profile.username || profile.full_name?.toLowerCase().replace(" ", "")}</p>
          </div>

          {/* Action Buttons - Instagram Style */}
          <div className="flex gap-2 mb-4">
            {followStatus === "following" ? (
              <>
                <button
                  onClick={handleFollowAction}
                  disabled={isActionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-all disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Following</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-all">
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </>
            ) : followStatus === "requested" ? (
              <button
                onClick={handleFollowAction}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-all disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>Requested</span>
              </button>
            ) : followStatus === "pending" ? (
              <>
                <button
                  onClick={handleFollowAction}
                  disabled={isActionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Follow Back</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-all">
                  <MessageCircle className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleFollowAction}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-semibold text-xs hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>Follow</span>
              </button>
            )}
          </div>

          {/* Bio and extras only when allowed */}
          {canViewFullProfile && (
            <div className="mt-4 space-y-3">
              <p className="text-foreground text-sm sm:text-base">{profile.bio || "No bio added yet"}</p>

              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <span className="flex items-center gap-1">
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  </span>
                )}
                {profile.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Private Account Message */}
          {!canViewFullProfile && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">This is a private account</p>
              <p className="text-sm text-muted-foreground">
                {followStatus === "requested" 
                  ? "Follow request pending approval"
                  : "Follow to see posts and more"}
              </p>
            </div>
          )}
        </div>

        {/* Tabs and Content */}
        {canViewFullProfile && (
          <>
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
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default UserProfile;
