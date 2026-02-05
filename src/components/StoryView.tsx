import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, Eye, MessageCircle, X, Trash2, Plus, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
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
  text?: string;
  emoji_stickers?: Array<{ emoji: string; x: number; y: number }>;
  created_at: string;
  expires_at: string;
  views_count: number;
  likes_count: number;
  liked_by_user: boolean;
  viewed_by_user: boolean;
}

interface StoryUser {
  user_id: string;
  username: string;
  user_image?: string;
  gender?: string;
  stories: Story[];
  unviewed_count: number;
}

const StoryView: React.FC = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId?: string }>();
  const { toast } = useToast();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [likers, setLikers] = useState<any[]>([]);
  const [showingLikes, setShowingLikes] = useState(false);
  const [message, setMessage] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progressStartTime, setProgressStartTime] = useState<number>(Date.now());
  const [timeString, setTimeString] = useState<string>('Just now');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = storyUsers[currentUserIdx];
  const currentStory = currentUser?.stories[currentStoryIdx];

  // Helper function to check if image URL is valid
  const isValidRemoteImage = (url?: string) => {
    if (!url) return false;
    const normalized = url.trim().toLowerCase();
    if (!normalized || normalized === "null" || normalized === "undefined") return false;
    if (normalized.includes("placeholder") || normalized.includes("default")) return false;
    if (normalized.includes("ui-avatars.com")) return false;
    return true;
  };

  // Get profile image with gender fallback
  const getProfileImage = () => {
    if (isValidRemoteImage(currentUser?.user_image)) {
      return currentUser.user_image;
    }
    
    // Fallback to gender-based icon
    if (currentUser?.gender === "male") return maleIcon;
    if (currentUser?.gender === "female") return femaleIcon;
    return profileIcon;
  };

  const getUserAvatar = (user?: { image?: string; user_image?: string; gender?: string }) => {
    const imageUrl = user?.image || user?.user_image;
    if (isValidRemoteImage(imageUrl)) {
      return imageUrl as string;
    }
    if (user?.gender === "male") return maleIcon;
    if (user?.gender === "female") return femaleIcon;
    return profileIcon;
  };

  // Fetch stories feed
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('Not authenticated');
          setLoading(false);
          return;
        }
        const token = await user.getIdToken();
        
        const response = await fetch('http://localhost:8000/stories/feed', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Feed fetch failed ${response.status}:`, errorData);
          return;
        }
        
        const data = await response.json();
        setStoryUsers(data);
        
        // If viewing a specific story by ID, find it
        if (storyId) {
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].stories.length; j++) {
              if (data[i].stories[j].story_id === storyId) {
                setCurrentUserIdx(i);
                setCurrentStoryIdx(j);
                setIsOwnStory(data[i].user_id === user.uid);
                setIsLiked(data[i].stories[j].liked_by_user || false);
                setLoading(false);
                return;
              }
            }
          }
        }
        
        setIsLiked(data[0]?.stories[0]?.liked_by_user || false);
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [storyId]);

  // Track story view
  useEffect(() => {
    if (currentStory && !currentStory.viewed_by_user) {
      const viewStory = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          
          const response = await fetch(`http://localhost:8000/stories/view/${currentStory.story_id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (response.status === 403) {
            // Privacy violation - not allowed to view this story
            const errorData = await response.json().catch(() => ({}));
            console.warn('🔒 Privacy restriction:', errorData.detail || 'Cannot view this story');
            toast({
              title: "Cannot view story",
              description: "This story is only visible to followers",
              variant: "destructive"
            });
            navigate('/');
            return;
          }
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`View tracking failed ${response.status}:`, errorData);
          }
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      };
      viewStory();
    }
  }, [currentStory, navigate, toast]);

  // Fetch viewers/likers - only for own stories
  useEffect(() => {
    if (currentStory && currentUser) {
      const isCurrentUserOwner = currentUser.user_id === storyUsers[0]?.user_id && currentStoryIdx === 0;
      
      const fetchStats = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          
          // Double-check that this is the current user's story
          if (user.uid !== currentUser.user_id) {
            setViewers([]);
            setLikers([]);
            return;
          }
          
          const token = await user.getIdToken();
          
          const response = await fetch(`http://localhost:8000/stories/stats/${currentStory.story_id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (response.status === 403) {
            // Not allowed to view stats for this story - clear the data
            setViewers([]);
            setLikers([]);
            return;
          }
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Stats fetch failed ${response.status}:`, errorData);
            return;
          }
          
          const data = await response.json();
          setViewers(data.viewers);
          setLikers(data.likers || []);
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      };
      
      if (isOwnStory) {
        fetchStats();
      } else {
        // For other people's stories, clear the stats
        setViewers([]);
        setLikers([]);
      }
    }
  }, [currentStory, currentUser, isOwnStory]);

  // Auto-progress stories with smooth progress bar
  useEffect(() => {
    if (!currentStory || isPaused) return;

    const duration = currentStory.media_type === 'video' && videoRef.current
      ? Math.ceil(videoRef.current.duration * 1000) || currentStory.duration * 1000
      : currentStory.duration * 1000;

    const startTime = Date.now();
    setProgressStartTime(startTime);

    // Smooth progress bar animation
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        handleNextStory();
      }
    }, 16); // 60fps

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStoryIdx, currentUserIdx, currentStory, isPaused]);

  // Update like state when story changes
  useEffect(() => {
    if (currentStory) {
      setIsLiked(currentStory.liked_by_user || false);
    }
  }, [currentStory]);

  // Update isOwnStory when user changes
  useEffect(() => {
    const checkOwnership = async () => {
      if (currentUser) {
        const user = auth.currentUser;
        if (user) {
          setIsOwnStory(currentUser.user_id === user.uid);
        }
      }
    };
    checkOwnership();
  }, [currentUser, currentUserIdx]);

  // Update time string when story changes and every minute
  useEffect(() => {
    if (!currentStory) return;

    const updateTimeString = () => {
      setTimeString(getRelativeTime(currentStory.created_at));
    };

    // Update immediately
    updateTimeString();

    // Update every minute
    const interval = setInterval(updateTimeString, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentStory]);

  const handleLike = async () => {
    if (!currentStory) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      
      const response = await fetch(`http://localhost:8000/stories/like/${currentStory.story_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 403) {
        // Privacy violation - not allowed to like this story
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Cannot like story",
          description: "You must be a follower to like this story",
          variant: "destructive"
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Like failed ${response.status}:`, errorData);
        toast({
          title: "Error",
          description: "Failed to like this story",
          variant: "destructive"
        });
        return;
      }

      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      // UI-only state update; no toast notification
    } catch (error) {
      console.error('Error liking story:', error);
      toast({
        title: "Error",
        description: "Something went wrong while liking",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    
    setShowDeleteConfirm(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to delete stories",
          variant: "destructive"
        });
        return;
      }
      const token = await user.getIdToken();
      
      const response = await fetch(`http://localhost:8000/stories/delete/${currentStory.story_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Delete failed ${response.status}:`, errorData);
        toast({
          title: "Delete failed",
          description: "Could not delete your story. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Story deleted ✓",
        description: "Your story has been removed",
      });
      
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting",
        variant: "destructive"
      });
    }
  };

  const handleNextStory = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Reset progress bar to 0%
    if (progressRef.current) {
      progressRef.current.style.width = '0%';
    }
    
    // Reset video to beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log('Video play error:', err));
    }

    if (currentStoryIdx < currentUser.stories.length - 1) {
      setCurrentStoryIdx(currentStoryIdx + 1);
    } else if (currentUserIdx < storyUsers.length - 1) {
      setCurrentUserIdx(currentUserIdx + 1);
      setCurrentStoryIdx(0);
    } else {
      navigate('/explore');
    }
  };

  const handlePrevStory = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Reset progress bar to 0%
    if (progressRef.current) {
      progressRef.current.style.width = '0%';
    }
    
    // Reset video to beginning
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log('Video play error:', err));
    }

    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(currentStoryIdx - 1);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(currentUserIdx - 1);
      const prevUser = storyUsers[currentUserIdx - 1];
      setCurrentStoryIdx(prevUser.stories.length - 1);
    }
  };

  // Calculate relative time (e.g., "2h ago", "5m ago")
  const getRelativeTime = (dateString: string): string => {
    try {
      const now = new Date();
      
      // Handle ISO 8601 format and other formats
      let past = new Date(dateString);
      
      // If the date parsing failed, try parsing as ISO string
      if (isNaN(past.getTime())) {
        past = new Date(dateString.replace(/\.\d+Z?$/, 'Z'));
      }
      
      // Ensure we have a valid date
      if (isNaN(past.getTime())) {
        return 'Just now';
      }
      
      const diffMs = now.getTime() - past.getTime();
      
      // If time difference is negative (story from future), treat as "Just now"
      if (diffMs < 0) {
        return 'Just now';
      }
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 size={48} className="animate-spin mb-4 mx-auto text-purple-500" />
          <p>Loading stories...</p>
        </div>
      </div>
    );
  }

  if (!currentStory) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No stories to show</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col relative">
      {/* Progress Bars */}
      <div className="flex gap-1 px-2 pt-2 pb-1 absolute top-0 left-0 right-0 z-40">
        {currentUser?.stories.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            {idx < currentStoryIdx ? (
              // Completed stories - fully filled
              <div className="w-full h-full bg-white transition-all duration-200"></div>
            ) : idx === currentStoryIdx ? (
              // Current story - filling progressively
              <div
                ref={progressRef}
                className="h-full bg-white transition-all"
                style={{ width: '0%' }}
              ></div>
            ) : (
              // Upcoming stories - empty
              <div className="w-0 h-full bg-white"></div>
            )}
          </div>
        ))}
      </div>

      {/* Header with User Info */}
      <div className="flex justify-between items-center px-4 py-3 absolute top-3 left-0 right-0 z-30 bg-gradient-to-b from-black/60 to-transparent">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          onClick={() => {
            if (currentUser?.user_id) {
              navigate(`/user/${currentUser.user_id}`);
            }
          }}
        >
          <img
            src={getProfileImage()}
            alt={currentUser?.username}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div className="text-white">
            <p className="font-semibold text-sm">{currentUser?.username}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/explore')}
          className="text-white hover:bg-white/20 p-2 rounded-full transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Story Media */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Left tap area - Previous story */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer active:bg-white/5"
          onClick={handlePrevStory}
        />

        {/* Right tap area - Next story */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer active:bg-white/5"
          onClick={handleNextStory}
        />

        {/* Media content */}
        <div className="w-full h-full relative">
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              onEnded={handleNextStory}
            />
          )}
          
          {/* Text Overlay */}
          {currentStory.text && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl md:text-3xl font-bold text-center px-4 text-shadow-lg pointer-events-none z-10"
              style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {currentStory.text}
            </div>
          )}
          
          {/* Emoji Stickers Overlay */}
          {currentStory.emoji_stickers && currentStory.emoji_stickers.length > 0 && (
            <>
              {currentStory.emoji_stickers.map((sticker, idx) => (
                <div
                  key={idx}
                  className="absolute text-4xl pointer-events-none z-10"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Navigation Arrow Hints (optional) */}
        {(currentStoryIdx > 0 || currentUserIdx > 0) && (
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition z-20 opacity-0 hover:opacity-100"
            onClick={handlePrevStory}
          >
            <ChevronLeft size={36} />
          </button>
        )}

        {(currentStoryIdx < currentUser.stories.length - 1 || currentUserIdx < storyUsers.length - 1) && (
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition z-20 opacity-0 hover:opacity-100"
            onClick={handleNextStory}
          >
            <ChevronRight size={36} />
          </button>
        )}
      </div>

{/* Bottom Controls - Facebook Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-6 pb-8 z-30">
        {isOwnStory ? (
          // Own Story Controls - Pink Box
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3 rounded-full shadow-lg">
            {/* Views Count */}
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition font-semibold text-sm"
            >
              <Eye size={18} />
              <span>{currentStory.views_count}</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition font-semibold text-sm"
              title="Delete story"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>

            {/* Add Story Button */}
            <button
              onClick={() => navigate("/story/upload")}
              className="flex items-center gap-2 text-white hover:text-white/80 transition font-semibold text-sm"
              title="Add new story"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        ) : (
          // Other User's Story - Like Button with Liker Images
          <div className="flex items-center justify-end gap-4">
            {/* Liker Profile Images */}
            {likers.length > 0 && (
              <div className="flex items-center -space-x-2">
                {likers.slice(0, 3).map((liker, idx) => (
                  <img
                    key={liker.user_id}
                    src={getUserAvatar(liker)}
                    alt={liker.username}
                    className="w-8 h-8 rounded-full border-2 border-black object-cover cursor-pointer hover:scale-110 transition"
                    onClick={() => {
                      if (liker.user_id) {
                        navigate(`/user/${liker.user_id}`);
                      }
                    }}
                    title={liker.username}
                    style={{ zIndex: 3 - idx }}
                  />
                ))}
                {likers.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-700 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:scale-110 transition"
                    onClick={() => {
                      setShowingLikes(true);
                      setShowViewers(true);
                    }}
                  >
                    +{likers.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Heart Button */}
            <button
              onClick={handleLike}
              className={`transition transform hover:scale-110 active:scale-95 ${
                isLiked ? 'text-red-500' : 'text-white hover:text-red-400'
              }`}
            >
              <Heart size={32} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Viewers/Likers Modal - Clean Modal Overlay */}
      {showViewers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">
                {showingLikes ? `${likers.length} Likes` : 'Who viewed your story'}
              </h3>
              <button
                onClick={() => {
                  setShowViewers(false);
                  setShowingLikes(false);
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {showingLikes ? (
              // Show likers
              likers.length > 0 ? (
                <div className="space-y-3">
                  {likers.map((liker) => (
                    <div 
                      key={liker.user_id}
                      className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-lg transition cursor-pointer"
                      onClick={() => {
                        if (liker.user_id) {
                          navigate(`/user/${liker.user_id}`);
                          setShowViewers(false);
                        }
                      }}
                    >
                      <img
                        src={getUserAvatar(liker)}
                        alt={liker.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{liker.username}</p>
                        <p className="text-white/50 text-xs">Liked your story</p>
                      </div>
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No likes yet</p>
              )
            ) : (
              // Show viewers
              viewers.length > 0 ? (
                <div className="space-y-3">
                  {viewers.map((viewer) => (
                    <div 
                      key={viewer.user_id}
                      className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-lg transition cursor-pointer"
                      onClick={() => {
                        if (viewer.user_id) {
                          navigate(`/user/${viewer.user_id}`);
                          setShowViewers(false);
                        }
                      }}
                    >
                      <img
                        src={getUserAvatar(viewer)}
                        alt={viewer.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{viewer.username}</p>
                        <p className="text-white/50 text-xs">Viewed your story</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No one has viewed your story yet</p>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Delete Story?</h3>
              <p className="text-gray-400 text-sm mb-6">This story will be permanently deleted and removed from your profile.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStory}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;