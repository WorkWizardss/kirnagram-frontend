import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { HeroBanner } from "@/components/feed/HeroBanner";
import { FeedPost } from "@/components/feed/FeedPost";
import { StoriesRow } from "@/components/feed/StoriesRow";
import { auth } from "@/firebase";
import { toast } from "@/components/ui/use-toast";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import profileIcon from "@/assets/profileicon.png";

const API_BASE = "http://127.0.0.1:8000";

type Post = {
  _id: string;
  user_id: string;
  image_url: string;
  ratio?: string;
  caption?: string;
  likes?: string[];
  comments?: any[];
  tags?: string[];
  is_prompt_post?: boolean;
  prompt_badge?: string;
  created_at?: string;
  views?: string[];
};

type UserSummary = {
  firebase_uid: string;
  username?: string;
  full_name?: string;
  image_name?: string;
  gender?: string;
  is_creator?: boolean;
};

const Index = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserSummary>>({});

  const isValidRemoteImage = (url?: string) =>
    typeof url === "string" &&
    url.trim() !== "" &&
    url.startsWith("http") &&
    !url.includes("default") &&
    !url.includes("placeholder") &&
    !url.startsWith("blob:");

  const getProfileImage = (profile?: UserSummary) => {
    if (profile?.image_name && isValidRemoteImage(profile.image_name)) return profile.image_name;
    if (profile?.gender === "male") return maleIcon;
    if (profile?.gender === "female") return femaleIcon;
    return profileIcon;
  };

  useEffect(() => {
    const fetchFeed = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/posts/feed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load feed");
        const data = await res.json();
        const nextPosts = Array.isArray(data) ? data : [];
        setPosts(nextPosts);
      } catch (error) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const uniqueIds = Array.from(new Set(posts.map((post) => post.user_id)));
      const missingIds = uniqueIds.filter((id) => !userProfiles[id]);
      if (missingIds.length === 0) return;

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await fetch(`${API_BASE}/profile/user/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to load user profile");
            const data = await res.json();
            setUserProfiles((prev) => ({ ...prev, [id]: data }));
          } catch {
            setUserProfiles((prev) => ({
              ...prev,
              [id]: { firebase_uid: id, username: "User" },
            }));
          }
        })
      );
    };

    loadProfiles();
  }, [posts, userProfiles]);

  const orderedPosts = useMemo(() => posts, [posts]);

  const updatePost = (postId: string, updater: (post: Post) => Post) => {
    setPosts((prev) => prev.map((post) => (post._id === postId ? updater(post) : post)));
  };

  const handleLike = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/posts/like/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      updatePost(postId, (post) => {
        const likes = new Set(post.likes || []);
        if (data.liked) {
          likes.add(currentUser.uid);
        } else {
          likes.delete(currentUser.uid);
        }
        return { ...post, likes: Array.from(likes) };
      });
    } catch (error) {
      toast({
        title: "Like failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (post: Post) => {
    const shareUrl = post.image_url;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.caption || "KiranaGram Post",
          text: post.caption || "",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied", description: shareUrl });
      }
    } catch {
      toast({ title: "Share failed", variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 overflow-x-hidden">
        {/* Mobile Stories */}
        <StoriesRow />

        {/* Feed Tabs */}
        <FeedTabs />

        {/* Hero Banner */}
        <HeroBanner />

        {/* Feed Posts */}
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Loading feed...</div>
        ) : orderedPosts.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No posts yet.</div>
        ) : (
          <div className="space-y-6">
            {orderedPosts.map((post, index) => {
              const author = userProfiles[post.user_id];
              const showRemix = Boolean(post.is_prompt_post);
              const isLiked = auth.currentUser?.uid ? post.likes?.includes(auth.currentUser.uid) : false;
              return (
                <FeedPost
                  key={post._id}
                  author={{
                    name: author?.full_name || author?.username || "User",
                    username: author?.username ? `@${author.username}` : "@user",
                    avatar: getProfileImage(author),
                    isVerified: author?.is_creator,
                  }}
                  image={post.image_url}
                  caption={post.caption}
                  tags={showRemix ? post.tags || [] : []}
                  badge={showRemix ? post.prompt_badge || "Creator" : undefined}
                  likes={post.likes?.length ?? 0}
                  comments={post.comments?.length ?? 0}
                  views={post.views?.length ?? 0}
                  isLiked={Boolean(isLiked)}
                  showRemix={showRemix}
                  onAuthorClick={() =>
                    navigate(post.user_id === auth.currentUser?.uid ? "/profile" : `/user/${post.user_id}`)
                  }
                  onPostClick={() =>
                    navigate("/posts", {
                      state: {
                        posts: orderedPosts,
                        startIndex: index,
                        initialPostId: post._id,
                      },
                    })
                  }
                  onLike={() => handleLike(post._id)}
                  onOpenLikes={() =>
                    navigate("/posts", {
                      state: {
                        posts: orderedPosts,
                        initialPostId: post._id,
                        openLikesPostId: post._id,
                      },
                    })
                  }
                  onOpenComments={() =>
                    navigate("/posts", {
                      state: {
                        posts: orderedPosts,
                        initialPostId: post._id,
                        openCommentsPostId: post._id,
                      },
                    })
                  }
                  onOpenViews={() =>
                    navigate("/posts", {
                      state: {
                        posts: orderedPosts,
                        initialPostId: post._id,
                        openViewsPostId: post._id,
                      },
                    })
                  }
                  onShare={() => handleShare(post)}
                  onAddToStory={() => navigate("/story/upload", { state: { imageUrl: post.image_url } })}
                />
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
