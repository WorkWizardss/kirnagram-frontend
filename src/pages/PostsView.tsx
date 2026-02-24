import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { auth } from "@/firebase";
import { ArrowLeft, Eye, Heart, MessageCircle, MoreVertical, Send, Share2, Trash2, Plus, Sparkles } from "lucide-react";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import profileIcon from "@/assets/profileicon.png";
import { Volume2, VolumeX } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

type Post = {
  _id: string;
  user_id: string;
  image_url: string;
  video_url?: string;
  type?: "image" | "video";
  ratio?: string;
  caption?: string;
  tags?: string[];
  is_prompt_post?: boolean;
  prompt_badge?: string;
  prompt_id?: string;
  likes?: string[];
  comments?: any[];
  views?: string[];
  created_at?: string;
};

type Comment = {
  comment_id: string;
  user_id: string;
  username?: string;
  user_image?: string;
  text: string;
  created_at?: string;
};

type UserSummary = {
  firebase_uid: string;
  username?: string;
  full_name?: string;
  image_name?: string;
  gender?: string;
};

const PostsView = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryPostId = searchParams.get("postId") || undefined;
  const statePosts = (location.state as any)?.posts as Post[] | undefined;
  const startIndex = (location.state as any)?.startIndex as number | undefined;
  const initialPostId =
    ((location.state as any)?.initialPostId as string | undefined) || queryPostId;
  const showOnlyInitial = Boolean(queryPostId && !statePosts);
  const viewType = (location.state as any)?.viewType as "posts" | "prompts" | undefined;
  const fromProfile = Boolean((location.state as any)?.fromProfile);
  const openLikesPostId = (location.state as any)?.openLikesPostId as string | undefined;
  const openCommentsPostId = (location.state as any)?.openCommentsPostId as string | undefined;
  const [isMuted, setIsMuted] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserSummary>>({});
  const [initialOpenHandled, setInitialOpenHandled] = useState(false);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const viewTimers = useRef<Record<string, number>>({});
  const viewedPostIds = useRef<Set<string>>(new Set());
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const currentUserId = auth.currentUser?.uid;

  const isVideo = (url?: string) => typeof url === "string" && /\.(mp4|webm|ogg)$/i.test(url);

  const orderedPosts = useMemo(() => {
    if (typeof startIndex === "number" && posts.length > 0) {
      const normalized = Math.min(Math.max(startIndex, 0), posts.length - 1);
      return [posts[normalized], ...posts.slice(0, normalized), ...posts.slice(normalized + 1)];
    }
    if (!initialPostId) return posts;
    const index = posts.findIndex((post) => post._id === initialPostId);
    if (index <= 0) return posts;
    return [posts[index], ...posts.slice(0, index), ...posts.slice(index + 1)];
  }, [posts, initialPostId, startIndex]);


const toggleMute = () => {
  setIsMuted((prev) => {
    const newState = !prev;

    // Apply mute state to all videos
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        video.muted = newState;
      }
    });

    return newState;
  });
};

useEffect(() => {
    if (statePosts && Array.isArray(statePosts)) {
      setPosts(statePosts);
      const targetId = userId || auth.currentUser?.uid;
      if (targetId) {
        sessionStorage.setItem(`posts:${targetId}`, JSON.stringify(statePosts));
      }
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      const currentUser = auth.currentUser;
      const targetId = userId || currentUser?.uid;
      if (targetId && !showOnlyInitial) {
        const cached = sessionStorage.getItem(`posts:${targetId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setPosts(parsed);
              setLoading(false);
            }
          } catch {
            // ignore cache errors
          }
        }
      }
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const targetId = userId || currentUser.uid;
        const res = await fetch(`${API_BASE}/posts/user/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load posts");
        const data = await res.json();
        const nextPosts = Array.isArray(data) ? data : [];
        if (showOnlyInitial && initialPostId) {
          const selected = nextPosts.find((post) => post._id === initialPostId);
          setPosts(selected ? [selected] : []);
        } else {
          setPosts(nextPosts);
          sessionStorage.setItem(`posts:${targetId}`, JSON.stringify(nextPosts));
        }
      } catch (error) {
        toast({
          title: "Failed to load posts",
          description: error instanceof Error ? error.message : "Try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, statePosts, showOnlyInitial, initialPostId]);

  useEffect(() => {
    const loadProfiles = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const token = await currentUser.getIdToken();

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

  useEffect(() => {
    if (loading || initialOpenHandled) return;
    if (openLikesPostId) {
      setInitialOpenHandled(true);
      openLikes(openLikesPostId);
      return;
    }
    if (openCommentsPostId) {
      setInitialOpenHandled(true);
      openComments(openCommentsPostId);
      return;
    }
  }, [loading, initialOpenHandled, openLikesPostId, openCommentsPostId]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
  
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
  
            // Pause ALL other videos
            Object.values(videoRefs.current).forEach((v) => {
              if (v && v !== video) {
                v.pause();
                v.currentTime = 0; // RESET other videos
              }
            });
  
            // Start from beginning
            video.currentTime = 0;
            video.play().catch(() => {});
  
          } else {
            video.pause();
            video.currentTime = 0; // IMPORTANT: reset when leaving screen
          }
        });
      },
      { threshold: 0.7 }
    );
  
    const timer = setTimeout(() => {
      Object.values(videoRefs.current).forEach((video) => {
        if (video) observer.observe(video);
      });
    }, 200);
  
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Checks if a string is a valid remote image URL (http/https and ends with image extension)
  const isValidRemoteImage = (url: string) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
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

  const openProfile = (id?: string) => {
    if (!id) return;
    navigate(currentUserId === id ? "/profile" : `/user/${id}`);
  };

  const formatCount = (value: number) => {
    if (value < 1000) return `${value}`;
    if (value < 1_000_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  };

  const updatePost = (postId: string, updater: (post: Post) => Post) => {
    setPosts((prev) => prev.map((post) => (post._id === postId ? updater(post) : post)));
  };

  const removePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    const targetId = userId || auth.currentUser?.uid;
    if (targetId) {
      const cached = sessionStorage.getItem(`posts:${targetId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            sessionStorage.setItem(
              `posts:${targetId}`,
              JSON.stringify(parsed.filter((post: Post) => post._id !== postId)),
            );
          }
        } catch {
          // ignore cache errors
        }
      }
    }
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

  const openLikes = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setActivePostId(postId);
    setShowLikes(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/posts/likes/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load likes");
      const data = await res.json();
      setLikeUsers(data.likes || []);
    } catch (error) {
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
    } catch (error) {
      setComments([]);
    }
  };

  const handleAddView = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || viewedPostIds.current.has(postId)) return;
    try {
      const token = await currentUser.getIdToken();
      viewedPostIds.current.add(postId);
      updatePost(postId, (post) => {
        const views = new Set(post.views || []);
        views.add(currentUser.uid);
        return { ...post, views: Array.from(views) };
      });
      // Send to backend but update UI immediately
      fetch(`${API_BASE}/posts/view/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
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
      const res = await fetch(`${API_BASE}/posts/comment/${activePostId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
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

  // STEP 2 — ADD THIS NEW CLEAN VERSION
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          // Pause all other videos
          Object.values(videoRefs.current).forEach((v) => {
            if (v && v !== video) {
              v.pause();
              v.currentTime = 0;
            }
          });

          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.6 }
  );

  // IMPORTANT: observe after small delay
  const timer = setTimeout(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (video) observer.observe(video);
    });
  }, 300);

  return () => {
    clearTimeout(timer);
    observer.disconnect();
  };
}, [posts]);

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

  const handleDelete = async (postId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/posts/delete/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");
      removePost(postId);
      toast({ title: "Post deleted" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const handleAddToStory = (post: Post) => {
    navigate("/story/upload", { state: { imageUrl: post.image_url } });
  };

  return (
    <MainLayout showRightSidebar={true} fromProfile={fromProfile}>

      <div className="mx-auto w-full max-w-[900px] space-y-6 pb-20 flex flex-col items-center">
        {/* Back arrow like screenshot: left, small, no text, vertically centered with title */}
        <div className="w-full flex items-center mb-2">
          <button
            className="flex items-center text-foreground focus:outline-none bg-transparent border-none shadow-none px-0 py-0 hover:bg-transparent hover:shadow-none text-xl"
            aria-label="Back"
            onClick={() => navigate(-1)}
            style={{ height: 36, width: 36, justifyContent: "center" }}
          >
            <span className="text-2xl" style={{ lineHeight: 1 }}>&larr;</span>
          </button>
          <div className="ml-2">
            <span className="text-2xl font-bold leading-tight">{viewType === "prompts" ? "Prompts" : "Posts"}</span>
            {/* Optionally, add a subtitle here if needed, e.g. <div className="text-sm text-muted-foreground">Track your creator revenue</div> */}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading posts...</div>
        ) : orderedPosts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No posts yet.</div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="bg-card rounded-3xl shadow-xl border border-border max-w-[600px] w-full mx-auto p-0 overflow-hidden flex flex-col items-center">
              <div className="space-y-8 w-full">
                {orderedPosts.map((post) => {
                  const isLiked = currentUserId ? post.likes?.includes(currentUserId) : false;
                  return (
                    <div
                      key={post._id}
                      className="bg-background"
                      data-post-id={post._id}
                      ref={(node) => {
                        postRefs.current[post._id] = node;
                      }}
                    >
                      {/* ...existing post content (user info, image/video, actions, etc.)... */}
                      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2">
                        <button
                          className="flex items-center gap-3 min-w-0 flex-1"
                          onClick={() =>
                            navigate(currentUserId === post.user_id ? "/profile" : `/user/${post.user_id}`)
                          }
                        >
                          <img
                            src={getUserAvatar(userProfiles[post.user_id])}
                            alt={userProfiles[post.user_id]?.username || "User"}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/40"
                          />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {userProfiles[post.user_id]?.username || "User"}
                            </p>
                            {userProfiles[post.user_id]?.full_name && (
                              <p className="text-xs text-muted-foreground truncate">
                                {userProfiles[post.user_id]?.full_name}
                              </p>
                            )}
                          </div>
                        </button>
                        <div className="relative shrink-0">
                          <button
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuPostId((prev) => (prev === post._id ? null : post._id));
                            }}
                            aria-label="Post actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuPostId === post._id && (
                            <div className="absolute top-9 right-0 w-44 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-10">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  setMenuPostId(null);
                                  handleShare(post);
                                }}
                              >
                                <Share2 className="w-4 h-4" />
                                Share
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                onClick={() => {
                                  setMenuPostId(null);
                                  handleAddToStory(post);
                                }}
                              >
                                <Plus className="w-4 h-4" />
                                Add to Story
                              </button>
                              {currentUserId === post.user_id && (
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                                  onClick={() => {
                                    setMenuPostId(null);
                                    handleDelete(post._id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="relative w-full overflow-hidden bg-black">
                        {post.type === "video" ? (
                          <>
                            <video
                              ref={(el) => {
                                if (el) videoRefs.current[post._id] = el;
                              }}
                              src={post.video_url}
                              className="w-full object-cover"
                              style={{ aspectRatio: post.ratio?.replace(":", "/") || "9 / 16" }}
                              loop
                              muted={isMuted}
                              playsInline
                              preload="metadata"
                            />
                            <button
                              onClick={toggleMute}
                              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white rounded-full p-3 transition active:scale-90"
                            >
                              {isMuted ? "🔇" : "🔊"}
                            </button>
                          </>
                        ) : (
                          <img
                            src={post.image_url}
                            alt={post.caption || "Post"}
                            className="w-full object-cover"
                            style={{ aspectRatio: post.ratio?.replace(":", "/") || "1 / 1" }}
                          />
                        )}
                        {post.is_prompt_post && (
                          <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold bg-primary/90 text-primary-foreground rounded-full flex items-center gap-1">
                            <span className="text-sm">🔥</span> {post.prompt_badge || "Prompt"}
                          </span>
                        )}
                      </div>
                      {post.is_prompt_post && post.tags && post.tags.length > 0 && (
                        <div className="px-3 pt-3 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {post.is_prompt_post && (
                        <div className="px-3 pt-3">
                          <button
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-secondary to-accent text-secondary-foreground rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-secondary/30 transition-all"
                            onClick={() => {
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
                          >
                            <Sparkles className="w-5 h-5" />
                            Remix This Style
                          </button>
                        </div>
                      )}
                      <div className="px-3 py-4 space-y-3">
                        <div className="flex items-center gap-6 text-sm">
                          <button
                            className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-foreground"}`}
                            onClick={() => handleLike(post._id)}
                          >
                            <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                            <span onClick={(event) => {
                              event.stopPropagation();
                              openLikes(post._id);
                            }}>
                              {post.likes?.length ?? 0}
                            </span>
                          </button>
                          <button
                            className="flex items-center gap-2 text-foreground"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span onClick={(event) => {
                              event.stopPropagation();
                              openComments(post._id);
                            }}>
                              {post.comments?.length ?? 0}
                            </span>
                          </button>
                          <span className="flex items-center gap-1 text-foreground">
                            <Eye className="w-5 h-5" />
                            {post.views?.length ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

export default PostsView;
