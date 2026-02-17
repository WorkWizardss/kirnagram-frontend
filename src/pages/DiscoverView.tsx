import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, ChevronLeft } from "lucide-react";
import profileIcon from "@/assets/profileicon.png";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import { BottomNav } from "@/components/layout/BottomNav";
import { auth } from "@/firebase";

const API_BASE = "http://127.0.0.1:8000";

/* ================= TYPES ================= */

interface Post {
  _id: string;
  user_id: string;
  image_url?: string;
  video_url?: string;
  caption?: string;
  likes?: string[];
  comments?: any[];
  created_at?: string;
}

interface UserProfile {
  firebase_uid: string;
  username?: string;
  image_name?: string;
  gender?: string;
}

/* ================= COMPONENT ================= */

const DiscoverView: React.FC = () => {
  const navigate = useNavigate();


  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showHeart, setShowHeart] = useState<number | null>(null);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeComments, setActiveComments] = useState<any[]>([]);

  // Infinite scroll states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  /* ================= FETCH POSTS ================= */


  // 🔥 Load Posts Function
  const loadPosts = async (pageNumber = 1, replace = false) => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const res = await fetch(
      `${API_BASE}/posts/feed?page=${pageNumber}&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    const filtered = (data || [])
      .filter((p: any) => !p.is_prompt_post)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

    if (filtered.length < 5) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    if (replace) {
      setPosts(filtered);
      setPage(1);
      // 🔥 After refresh, scroll to top and set currentIndex
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: "auto" });
        }
        setCurrentIndex(0);
      }, 0);
    } else {
      setPosts((prev) => [...prev, ...filtered]);
    }
  };

  // 🔥 Initial Load
  useEffect(() => {
    loadPosts(1, true);
    // eslint-disable-next-line
  }, []);

  /* ================= LOAD PROFILES ================= */

  useEffect(() => {
    const loadProfiles = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const ids = Array.from(new Set(posts.map((p) => p.user_id)));

      for (const id of ids) {
        if (!profiles[id]) {
          const res = await fetch(`${API_BASE}/profile/user/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setProfiles((prev) => ({ ...prev, [id]: data }));
        }
      }
    };

    if (posts.length) loadProfiles();
  }, [posts]);

  /* ================= SCROLL SNAP ================= */


  // 🔥 Infinite Scroll & Pull to Refresh
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    setCurrentIndex(index);

    // 🔥 Load more when near bottom
    if (
      scrollTop + clientHeight >= scrollHeight - 200 &&
      hasMore &&
      !loadingMore
    ) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
      setLoadingMore(false);
    }

    // 🔥 Pull to refresh (when scroll top)
    if (scrollTop === 0) {
      loadPosts(1, true);
    }
    // No restriction on scroll direction: user can scroll up and down freely
  };

  /* ================= AUTO PLAY ================= */

  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;

      if (idx === currentIndex) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex]);

  // 🔥 FIX 3 — Scroll to Clicked Post Correctly
  // If navigated with postId param, scroll to that post
  // (Assumes you use useParams for postId)
  // If not already present, add:
  // import { useParams } from "react-router-dom";
  // const { postId } = useParams();
  // ...
  // Add this effect:
  // (If useParams is not imported, add it at the top)
  //
  // (Below is the effect)
  //
  // @ts-ignore
  const postId = (window.location.pathname.match(/discoverview\/(\w+)/)?.[1]) || null;
  useEffect(() => {
    if (!postId || posts.length === 0) return;
    const index = posts.findIndex((p) => p._id === postId);
    if (index !== -1 && containerRef.current) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: "auto",
      });
      setCurrentIndex(index);
    }
  }, [postId, posts]);

  /* ================= PROFILE IMAGE ================= */

  const getProfileImage = (user?: UserProfile) => {
    if (!user) return profileIcon;
    if (user.image_name?.startsWith("http")) return user.image_name;
    if (user.gender === "male") return maleIcon;
    if (user.gender === "female") return femaleIcon;
    return profileIcon;
  };

  /* ================= LIKE ================= */

  const handleLike = async (postId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    await fetch(`${API_BASE}/posts/like/${postId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likes: p.likes?.includes(user.uid)
                ? p.likes.filter((id) => id !== user.uid)
                : [...(p.likes || []), user.uid],
            }
          : p
      )
    );
  };

  /* ================= DOUBLE TAP ================= */

  const handleDoubleTap = (post: Post, index: number) => {
    handleLike(post._id);
    setShowHeart(index);
    setTimeout(() => setShowHeart(null), 600);
  };

  /* ================= COMMENTS ================= */

  const openComments = async (postId: string) => {
    const res = await fetch(`${API_BASE}/posts/comments/${postId}`);
    const data = await res.json();
    setActiveComments(data.comments || []);
    setCommentsOpen(true);
  };

  /* ================= SHARE ================= */

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/discoverview/${post._id}`;

    if (navigator.share) {
      await navigator.share({ url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="h-screen bg-black relative overflow-hidden">

      {/* Back Button */}
      <div className="absolute top-5 left-4 z-30">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="text-white w-7 h-7" />
        </button>
      </div>

      {/* REELS CONTAINER */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-28"
      >
        {posts.map((post, idx) => {
          const isLiked = post.likes?.includes(auth.currentUser?.uid || "");

          return (
            <div
              key={post._id}
              className="snap-start relative h-screen flex items-center justify-center"
            >
              {/* MEDIA */}
              <div
                className="absolute inset-0 flex items-center justify-center bg-black"
                onDoubleClick={() => handleDoubleTap(post, idx)}
              >
                {post.video_url ? (
                  <video
                    ref={(el) => (videoRefs.current[idx] = el)}
                    src={post.video_url}
                    muted={muted}
                    playsInline
                    loop
                    className="max-h-full max-w-full object-contain"
                    onClick={() => setMuted((m) => !m)}
                  />
                ) : (
                  <img
                    src={post.image_url}
                    className="max-h-full max-w-full object-contain"
                  />
                )}

                {showHeart === idx && (
                  <Heart className="absolute w-32 h-32 text-white fill-white animate-ping" />
                )}
              </div>

              {/* RIGHT ACTIONS */}
              <div className="absolute right-4 bottom-36 flex flex-col gap-7 z-20 items-center">
                <button onClick={() => handleLike(post._id)}>
                  <Heart
                    className={`w-7 h-7 transition ${
                      isLiked
                        ? "text-red-500 fill-red-500"
                        : "text-white"
                    }`}
                  />
                  <p className="text-white text-xs text-center mt-1">
                    {post.likes?.length || 0}
                  </p>
                </button>

                <button onClick={() => openComments(post._id)}>
                  <MessageCircle className="text-white w-7 h-7" />
                  <p className="text-white text-xs text-center mt-1">
                    {post.comments?.length || 0}
                  </p>
                </button>

                <button onClick={() => handleShare(post)}>
                  <Share2 className="text-white w-7 h-7" />
                </button>
              </div>

              {/* USER INFO */}
              <div className="absolute bottom-28 left-4 text-white z-20">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/user/${post.user_id}`)}
                >
                  <img
                    src={getProfileImage(profiles[post.user_id])}
                    className="w-11 h-11 rounded-full border-2 border-white object-cover"
                  />
                  <span className="font-semibold">
                    {profiles[post.user_id]?.username || "User"}
                  </span>
                </div>

                <p className="text-sm mt-2 max-w-xs">
                  {post.caption}
                </p>
              </div>
            </div>
          );
        })}
        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4 text-white">Loading...</div>
        )}
        {!hasMore && (
          <div className="flex justify-center py-4 text-gray-400 text-xs">No more posts</div>
        )}
      </div>

      {/* COMMENTS MODAL */}
      {commentsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 max-h-[70vh] overflow-y-auto shadow-xl relative">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">Comments</h3>
              <button onClick={() => setCommentsOpen(false)} className="text-2xl font-bold text-gray-400 absolute right-6 top-4">✕</button>
            </div>

            {activeComments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet
              </p>
            ) : (
              <div className="space-y-4">
                {activeComments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 border-b pb-3">
                    <img
                      src={c.avatar || profileIcon}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-sm">{c.username || "User"}</p>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default DiscoverView;
