import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { HeroBanner } from "@/components/feed/HeroBanner";
import { FeedPost } from "@/components/feed/FeedPost";
import { auth } from "@/firebase";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
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
  prompt_id?: string;
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

type Comment = {
  comment_id: string;
  user_id: string;
  username?: string;
  user_image?: string;
  text: string;
  created_at?: string;
};

const Index = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserSummary>>({});
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewTimers = useRef<Record<string, number>>({});
  const viewedPostIds = useRef<Set<string>>(new Set());

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

  const getUserAvatar = (user?: {
    image_name?: string;
    image?: string;
    user_image?: string;
    gender?: string;
  }) => {
    const direct = user?.image_name || user?.image || user?.user_image;
    if (direct && isValidRemoteImage(direct)) return direct;
    if (user?.gender === "male") return maleIcon;
    if (user?.gender === "female") return femaleIcon;
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
    const shareUrl = `${window.location.origin}/posts/view/${post.user_id}?postId=${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.caption || "kirnagram Post",
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

  const openProfile = (id?: string) => {
    if (!id) return;
    navigate(auth.currentUser?.uid === id ? "/profile" : `/user/${id}`);
  };

  const openLikes = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setActivePostId(postId);
    setShowLikes(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/posts/likes/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load likes");
      const data = await res.json();
      setLikeUsers(data.likes || []);
    } catch {
      setLikeUsers([]);
    }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setShowComments(true);
    try {
      const res = await fetch(`${API_BASE}/posts/comments/${postId}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    }
  };

  const handleAddView = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || viewedPostIds.current.has(postId)) return;
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/posts/view/${postId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to add view");
      viewedPostIds.current.add(postId);
      updatePost(postId, (post) => {
        const views = new Set(post.views || []);
        views.add(currentUser.uid);
        return { ...post, views: Array.from(views) };
      });
    } catch {
      // ignore view errors
    }
  };

  const handleAddComment = async () => {
    if (!activePostId || !commentInput.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append("text", commentInput.trim());
      const res = await fetch(`${API_BASE}/posts/comment/${activePostId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Failed to add comment");
      const newComment: Comment = {
        comment_id: `${Date.now()}`,
        user_id: currentUser.uid,
        username: currentUser.displayName || "You",
        user_image: currentUser.photoURL || undefined,
        text: commentInput.trim(),
      };
      setComments((prev) => [newComment, ...prev]);
      updatePost(activePostId, (post) => ({
        ...post,
        comments: [newComment, ...(post.comments || [])],
      }));
      setCommentInput("");
    } catch (error) {
      toast({
        title: "Comment failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (posts.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;
          if (entry.isIntersecting) {
            if (viewTimers.current[postId]) return;
            viewTimers.current[postId] = window.setTimeout(() => {
              delete viewTimers.current[postId];
              handleAddView(postId);
            }, 2000);
          } else if (viewTimers.current[postId]) {
            clearTimeout(viewTimers.current[postId]);
            delete viewTimers.current[postId];
          }
        });
      },
      { threshold: 0.6 }
    );

    posts.forEach((post) => {
      const node = postRefs.current[post._id];
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
      Object.values(viewTimers.current).forEach((timerId) => clearTimeout(timerId));
      viewTimers.current = {};
    };
  }, [posts]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6 overflow-x-hidden">
        

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
                <div
                  key={post._id}
                  data-post-id={post._id}
                  ref={(node) => {
                    postRefs.current[post._id] = node;
                  }}
                >
                  <FeedPost
                    author={{
                      name: author?.full_name || author?.username || "User",
                      username: author?.username ? `@${author.username}` : "@user",
                      avatar: getProfileImage(author),
                      isVerified: author?.is_creator,
                    }}
                    image={post.image_url}
                    ratio={post.ratio}
                    caption={post.caption}
                    tags={showRemix ? post.tags || [] : []}
                    badge={showRemix ? post.prompt_badge || "Creator" : undefined}
                    likes={post.likes?.length ?? 0}
                    comments={post.comments?.length ?? 0}
                    views={post.views?.length ?? 0}
                    isLiked={Boolean(isLiked)}
                    showRemix={showRemix}
                    onRemix={() => {
                      if (!post.prompt_id) {
                        toast({
                          title: "Remix unavailable",
                          description: "This prompt is missing an ID.",
                          variant: "destructive",
                        });
                        return;
                      }
                      navigate(`/remix/${post.prompt_id}`);
                    }}
                    onAuthorClick={() =>
                      navigate(post.user_id === auth.currentUser?.uid ? "/profile" : `/user/${post.user_id}`)
                    }
                    onPostClick={undefined}
                    onLike={() => handleLike(post._id)}
                    onOpenLikes={() => openLikes(post._id)}
                    onOpenComments={() => openComments(post._id)}
                    onOpenViews={undefined}
                    onShare={() => handleShare(post)}
                    onAddToStory={() => navigate("/story/upload", { state: { imageUrl: post.image_url } })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showLikes} onOpenChange={setShowLikes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Likes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {likeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No likes yet.</p>
            ) : (
              likeUsers.map((user) => {
                const userId = user.firebase_uid || user.user_id;
                return (
                  <button
                    key={userId}
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => openProfile(userId)}
                  >
                    <img
                      src={getUserAvatar(user)}
                      alt={user.username || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.username || user.full_name || "User"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <button
                  key={comment.comment_id}
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => openProfile(comment.user_id)}
                >
                  <img
                    src={getUserAvatar({ user_image: comment.user_image })}
                    alt={comment.username || "User"}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{comment.username || "User"}</p>
                    <p className="text-sm text-muted-foreground break-words">{comment.text}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(event) => setCommentInput(event.target.value)}
            />
            <Button onClick={handleAddComment} disabled={isSubmitting} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default Index;
