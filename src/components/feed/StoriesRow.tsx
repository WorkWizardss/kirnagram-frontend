import { Plus, Heart, MessageCircle, Share2, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import profileIcon from "@/assets/profileicon.png";

interface Story {
  story_id: string;
  user_id: string;
  username: string;
  user_image?: string;
  media_url: string;
  media_type: string;
  duration: number;
  created_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  viewed_by_user: boolean;
  liked_by_user: boolean;
}

interface StoryUser {
  user_id: string;
  username: string;
  user_image?: string;
  gender?: string;
  account_type?: string;
  stories: Story[];
  unviewed_count: number;
}

export function StoriesRow() {
  const navigate = useNavigate();
  const location = useLocation();
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [friendsStories, setFriendsStories] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidRemoteImage = (url?: string) => {
    if (!url) return false;
    const normalized = url.trim().toLowerCase();
    if (!normalized || normalized === "null" || normalized === "undefined") return false;
    if (normalized.includes("placeholder") || normalized.includes("default")) return false;
    if (normalized.includes("ui-avatars.com")) return false;
    return true;
  };

  const getAuthProfileImage = () => {
    const photoUrl = auth.currentUser?.photoURL || undefined;
    return isValidRemoteImage(photoUrl) ? photoUrl : profileIcon;
  };

  const getUserProfileImage = (user?: StoryUser) => {
    if (isValidRemoteImage(user?.user_image)) {
      return user?.user_image as string;
    }
    if (user?.gender === "male") return maleIcon;
    if (user?.gender === "female") return femaleIcon;
    return profileIcon;
  };

  // Fetch stories feed (includes both my stories and friends' stories)
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const user = auth.currentUser;
        
        if (!user) {
          console.warn("No authenticated user found");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        
        // Fetch my stories separately for better control
        const myStoriesResponse = await fetch("http://localhost:8000/stories/my-stories", {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (myStoriesResponse.ok) {
          const myData = await myStoriesResponse.json();
          if (Array.isArray(myData)) {
            setMyStories(myData);
            console.log("✅ My stories loaded:", myData.length);
          }
        }

        // Fetch friends' stories feed (backend now includes own stories too)
        const feedResponse = await fetch("http://localhost:8000/stories/feed", {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (feedResponse.ok) {
          const feedData = await feedResponse.json();
          console.log("✅ Feed data received:", feedData);
          if (Array.isArray(feedData)) {
            // Filter out my own stories from feed (they're already in myStories)
            const friendsOnly = feedData.filter((storyUser: StoryUser) => storyUser.user_id !== user.uid);
            setFriendsStories(friendsOnly);
            console.log("✅ Friends stories:", friendsOnly.length);
          }
        } else {
          console.error("❌ Feed fetch failed:", feedResponse.status);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [location]);

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm("Delete this story?")) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Not authenticated");
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/stories/delete/${storyId}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Delete error:", errorData);
        alert("Failed to delete story");
        return;
      }

      setMyStories(myStories.filter((s) => s.story_id !== storyId));
      alert("Story deleted ✓");
    } catch (error) {
      console.error("Error deleting story:", error);
      alert("Failed to delete story");
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide md:gap-4 -mx-4 px-4 lg:mx-0 lg:px-0">
      {/* Add Story Button */}
      <button
        onClick={() => navigate("/story/upload")}
        className="flex-shrink-0 w-[72px] h-28 sm:w-20 sm:h-28 md:w-24 md:h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:shadow-2xl hover:shadow-purple-500/50 transition group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"></div>
        <div className="bg-white/20 group-hover:bg-white/30 p-2 md:p-3 rounded-full mb-1 md:mb-2 transition relative z-10">
          <Plus size={20} className="text-white md:w-6 md:h-6" />
        </div>
        <span className="text-white text-[10px] sm:text-xs font-bold text-center px-1 relative z-10 truncate">
          Add Story
        </span>
      </button>

      {/* My Stories - Only show if I have stories */}
      {myStories.length > 0 && (
        <div
          onClick={() => navigate(`/story/view/${myStories[0].story_id}`)}
          className="flex-shrink-0 w-[90px] h-[120px] sm:w-[100px] sm:h-[133px] md:w-[110px] md:h-[147px] p-1 rounded-[20px] cursor-pointer hover:opacity-90 transition relative group"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
          }}
        >
          <div className="w-full h-full bg-white rounded-[16px] overflow-hidden relative">
            <img
              src={myStories[0].media_url}
              alt="My story"
              className="w-full h-full object-cover"
            />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50" />

            {/* Profile Picture at Top Left */}
            <div className="absolute top-2 left-2 z-10">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-[2px]" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
              }}>
                <img
                  src={getAuthProfileImage()}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              </div>
            </div>

            {/* "Your Story" Text at Bottom */}
            <div className="absolute bottom-2 left-0 right-0 px-2 z-10">
              <p className="text-white text-[11px] sm:text-xs font-semibold truncate text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Your Story
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Friends' Stories - Grouped by user */}
      {friendsStories.map((userGroup) => {
        const firstStory = userGroup.stories[0];
        
        return (
          <div
            key={userGroup.user_id}
            onClick={() => navigate(`/story/view/${firstStory.story_id}`)}
            className="flex-shrink-0 w-[90px] h-[120px] sm:w-[100px] sm:h-[133px] md:w-[110px] md:h-[147px] p-1 rounded-[20px] cursor-pointer hover:opacity-90 transition relative group"
            style={{
              background: userGroup.unviewed_count > 0 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                : '#9ca3af'
            }}
          >
            <div className="w-full h-full bg-white rounded-[16px] overflow-hidden relative">
              {/* Story Thumbnail */}
              {firstStory.media_type === "image" ? (
                <img
                  src={firstStory.media_url}
                  alt={`${userGroup.username}'s story`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={firstStory.media_url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50" />

              {/* Profile Picture at Top Left */}
              <div className="absolute top-2 left-2 z-10">
                <div 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-[2px]"
                  style={{
                    background: userGroup.unviewed_count > 0 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
                      : '#9ca3af'
                  }}
                >
                  <img
                    src={getUserProfileImage(userGroup)}
                    alt={userGroup.username}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
              </div>

              {/* Username at Bottom */}
              <div className="absolute bottom-2 left-0 right-0 px-2 z-10">
                <p className="text-white text-[11px] sm:text-xs font-semibold truncate text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {userGroup.username}
                </p>
              </div>
            </div>

            </div>
          );
        })}
      </div>
  );
}
