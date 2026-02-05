import { MainLayout } from "@/components/layout/MainLayout";
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Grid,
  Award,
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
  { id: "prompts", label: "Prompts", icon: Award },
];

const emptyMessages: Record<string, string> = {
  posts: "No posts yet",
  prompts: "No prompts yet",
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
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userPromptPosts, setUserPromptPosts] = useState<any[]>([]);

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

          if (data.account_type === "private" && data.follow_status !== "following" && data.is_creator) {
            setActiveTab("prompts");
          }

          const postsRes = await fetch(`http://127.0.0.1:8000/posts/user/${data.firebase_uid}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (postsRes.ok) {
            const postsData = await postsRes.json();
            const posts = Array.isArray(postsData) ? postsData : [];
            const promptPosts = posts.filter((p: any) => p.is_prompt_post);
            const normalPosts = posts.filter((p: any) => !p.is_prompt_post);
            setUserPosts(normalPosts);
            setUserPromptPosts(promptPosts);
          } else {
            setUserPosts([]);
            setUserPromptPosts([]);
          }

          // Fetch user's stories if allowed
          const isFollowing = data.follow_status === "following";
          const isPublic = data.account_type !== "private";
          const canViewStories = isPublic || isFollowing;

          // Only fetch and show stories if user can view them
          if (canViewStories) {
            const storiesRes = await fetch("http://localhost:8000/stories/feed", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (storiesRes.ok) {
              const storiesData = await storiesRes.json();
              // Find this user's stories from the feed
              const thisUserStories = storiesData.find((u: any) => u.user_id === userId);
              const stories = thisUserStories?.stories || [];
              
              // Only set stories if they actually exist
              if (stories.length > 0) {
                setUserStories(stories);
                console.log("✅ User has stories:", stories.length);
              } else {
                setUserStories([]);
                console.log("❌ User has no stories");
              }
            }
          } else {
            // Private account, not following - don't show stories
            setUserStories([]);
            console.log("🔒 Private account - stories hidden");
          }
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

  const openPost = (index: number) => {
    navigate("/posts", {
      state: {
        posts: userPosts,
        startIndex: index,
        initialPostId: userPosts[index]?._id,
        viewType: "posts",
      },
    });
  };

  const openPromptPost = (index: number) => {
    navigate("/posts", {
      state: {
        posts: userPromptPosts,
        startIndex: index,
        initialPostId: userPromptPosts[index]?._id,
        viewType: "prompts",
      },
    });
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
  const canViewPromptPosts = Boolean(profile.is_creator);
  const canMessage = canViewFullProfile || currentUser?.uid === profile.firebase_uid;

  const isValidRemoteImage = (url?: string) =>
    typeof url === "string" &&
    url.trim() !== "" &&
    url.startsWith("http") &&
    !url.includes("default") &&
    !url.includes("placeholder") &&
    !url.startsWith("blob:");

  const withCacheBust = (url: string) =>
    `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

  const fallbackAvatar = isValidRemoteImage(profile.image_name)
    ? withCacheBust(profile.image_name)
    : profile.gender === "male"
      ? maleIcon
      : profile.gender === "female"
        ? femaleIcon
        : profileIcon;

  const coverImage = isValidRemoteImage(profile.cover_image)
    ? withCacheBust(profile.cover_image)
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
              <div 
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1",
                  userStories.length > 0
                    ? "bg-gradient-to-tr from-orange-500 via-pink-500 to-yellow-400 cursor-pointer hover:scale-105 transition-transform"
                    : "bg-gradient-to-r from-primary to-secondary"
                )}
                onClick={() => {
                  if (userStories.length > 0 && userStories[0]?.story_id) {
                    navigate(`/story/view/${userStories[0].story_id}`);
                  }
                }}
              >
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
                  {profile.posts_count ?? userPosts.length}
                </p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>

              {Boolean(profile.is_creator) && (
                <div className="text-center">
                  <p className="text-lg font-display font-bold">
                    {profile.prompts_count ?? userPromptPosts.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Prompts</p>
                </div>
              )}

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

          {/* Name, Badge, and Social Icons (conditional) */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-base sm:text-lg font-display font-bold">{profile.full_name}</h1>
              {profile.account_type === "private" && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">PRIVATE</span>
              )}
              {Boolean(profile.is_creator) && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs font-bold rounded-full">
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                </span>
              )}
            </div>
            {/* Username */}
            <p className="text-muted-foreground text-sm">@{profile.username || profile.full_name?.toLowerCase().replace(" ", "")}</p>

            {/* Social Media Icons for Creator (only if public or following) */}
            {Boolean(profile.is_creator) && canViewFullProfile && (
              <div className="flex gap-3 mt-2">
  {profile.instagram && (
    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" alt="Instagram" className="w-5 h-5" style={{ fill: "#E4405F" }} />
    </a>
  )}
  {profile.youtube && (
    <a href={profile.youtube} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" alt="YouTube" className="w-5 h-5" style={{ fill: "#FF0000" }} />
    </a>
  )}
  {profile.x && (
    <a href={profile.x} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" alt="X" className="w-5 h-5" style={{ fill: "#000000" }} />
    </a>
  )}
  {profile.facebook && (
    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" alt="Facebook" className="w-5 h-5" style={{ fill: "#1877F3" }} />
    </a>
  )}
  {profile.website && (
    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/link.svg" alt="Website" className="w-5 h-5" style={{ fill: '#6366F1' }} />
    </a>
  )}
</div>
            )}
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
          {!canViewFullProfile && activeTab !== "prompts" && (
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
        {(canViewFullProfile || canViewPromptPosts) && (
          <>
            {/* Tabs */}
            <div className="mt-6 border-b border-border">
              <div className="flex gap-1 px-4">
                {tabs
                  .filter((tab) => {
                    if (tab.id === "posts") return canViewFullProfile;
                    if (tab.id === "prompts") return canViewPromptPosts;
                    return true;
                  })
                  .map((tab) => (
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

            {activeTab === "posts" && canViewFullProfile ? (
              userPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2">
                  {userPosts.map((post: any, index: number) => (
                    <button
                      key={post._id}
                      type="button"
                      className="group relative aspect-square overflow-hidden bg-muted"
                      onClick={() => openPost(index)}
                    >
                      <img
                        src={post.image_url}
                        alt={post.caption || "Post"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes?.length ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments?.length ?? 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <p className="text-sm sm:text-base font-medium">
                    {emptyMessages[activeTab]}
                  </p>
                  <p className="text-xs sm:text-sm">Check back later.</p>
                </div>
              )
            ) : activeTab === "prompts" && canViewPromptPosts ? (
              userPromptPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-2">
                  {userPromptPosts.map((post: any, index: number) => (
                    <button
                      key={post._id}
                      type="button"
                      className="group relative aspect-square overflow-hidden bg-muted"
                      onClick={() => openPromptPost(index)}
                    >
                      <span className="absolute top-2 right-2 z-10 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {post.prompt_badge || "Prompt"}
                      </span>
                      <img
                        src={post.image_url}
                        alt={post.caption || "Prompt"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes?.length ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments?.length ?? 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <p className="text-sm sm:text-base font-medium">
                    {emptyMessages[activeTab]}
                  </p>
                  <p className="text-xs sm:text-sm">Check back later.</p>
                </div>
              )
            ) : null}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default UserProfile;
