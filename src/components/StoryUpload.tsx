import React, { useState, useRef } from 'react';
import { X, Plus, Type, Smile, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface StoryFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const StoryUpload: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textOverlayRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [story, setStory] = useState<StoryFile | null>(null);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [emojiStickers, setEmojiStickers] = useState<Array<{ emoji: string; x: number; y: number }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 20 });
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingEmojiIndex, setDraggingEmojiIndex] = useState<number | null>(null);

  const emojis = ['❤️', '😂', '😍', '😘', '🔥', '✨', '😎', '🤩', '😭', '😱', '🎉', '🎊'];

  const handleMediaSelect = async (type: 'image' | 'video') => {
    setMediaType(type);
    // Trigger the appropriate file input
    setTimeout(() => {
      if (type === 'image' && imageInputRef.current) {
        imageInputRef.current.value = '';
        imageInputRef.current.click();
      } else if (type === 'video' && videoInputRef.current) {
        videoInputRef.current.value = '';
        videoInputRef.current.click();
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine which input was used based on the accept attribute
    const accept = e.target.accept;
    const isImageInput = accept.includes('image');
    const isVideoInput = accept.includes('video');

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm'];

    if (isImageInput && !validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid image format",
        description: "Please select JPG, PNG, WebP, or GIF",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    if (isVideoInput) {
      if (!validVideoTypes.includes(file.type)) {
        toast({
          title: "Invalid video format",
          description: "Please select MP4 or WebM",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      // Check video duration
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        if (video.duration > 30) {
          toast({
            title: "Video too long",
            description: "Video must be 30 seconds or less",
            variant: "destructive",
          });
          e.target.value = '';
          return;
        }
        // Video is valid, proceed with upload
        const preview = URL.createObjectURL(file);
        setStory({ file, preview, type: 'video' });
        setStep('edit');
      };
      video.onerror = () => {
        toast({
          title: "Unable to load video",
          description: "Please try another video file",
          variant: "destructive",
        });
        e.target.value = '';
      };
      video.src = URL.createObjectURL(file);
      return; // Exit here, let metadata handler continue
    }

    // For images, proceed immediately
    const preview = URL.createObjectURL(file);
    setStory({ file, preview, type: 'image' });
    setStep('edit');
  };

  const handleAddEmoji = (emoji: string) => {
    setEmojiStickers([
      ...emojiStickers,
      { emoji, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 }
    ]);
    setShowEmojiPicker(false);
  };

  const handleTextMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingText(true);
  };

  const handleTextTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingText(true);
  };

  const handleEmojiMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingEmojiIndex(index);
  };

  const handleEmojiTouchStart = (e: React.TouchEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation();
    setDraggingEmojiIndex(index);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    if (isDraggingText) {
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setTextPosition({ x, y });
    }

    if (draggingEmojiIndex !== null) {
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      
      setEmojiStickers(prev => 
        prev.map((sticker, idx) => 
          idx === draggingEmojiIndex ? { ...sticker, x, y } : sticker
        )
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const touch = e.touches[0];

    if (isDraggingText) {
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
      setTextPosition({ x, y });
    }

    if (draggingEmojiIndex !== null) {
      const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
      
      setEmojiStickers(prev => 
        prev.map((sticker, idx) => 
          idx === draggingEmojiIndex ? { ...sticker, x, y } : sticker
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDraggingText(false);
    setDraggingEmojiIndex(null);
  };

  const handleTouchEnd = () => {
    setIsDraggingText(false);
    setDraggingEmojiIndex(null);
  };

  const renderStoryToCanvas = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw text if present
        if (text && text.trim()) {
          const x = (textPosition.x / 100) * canvas.width;
          const y = (textPosition.y / 100) * canvas.height;

          // Calculate font size based on canvas size
          const fontSize = Math.max(32, canvas.width / 15);
          ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Add text background with rounded corners
          const metrics = ctx.measureText(text);
          const padding = fontSize * 0.6;
          const bgWidth = metrics.width + padding * 2;
          const bgHeight = fontSize * 1.5;
          const radius = fontSize * 0.4;

          // Draw rounded rectangle background
          const bgX = x - bgWidth / 2;
          const bgY = y - bgHeight / 2;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgWidth - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
          ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
          ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
          ctx.lineTo(bgX + radius, bgY + bgHeight);
          ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();

          // Draw text with shadow for better readability
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, y);
          ctx.shadowColor = 'transparent';
        }

        // Draw emoji stickers
        if (emojiStickers.length > 0) {
          emojiStickers.forEach((sticker) => {
            const x = (sticker.x / 100) * canvas.width;
            const y = (sticker.y / 100) * canvas.height;
            const emojiSize = Math.max(60, canvas.width / 8);

            ctx.font = `${emojiSize}px Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sticker.emoji, x, y);
          });
        }

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.95
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = story?.preview || '';
    });
  };

  const handleUpload = async () => {
    if (!story) return;

    setUploading(true);
    try {
      // Get Firebase token
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to post a story",
          variant: "destructive",
        });
        return;
      }
      const token = await user.getIdToken();

      let fileToUpload: File | Blob = story.file;

      // For images with text or emojis, render them onto the image
      if (story.type === 'image' && (text || emojiStickers.length > 0)) {
        const compositeBlob = await renderStoryToCanvas();
        fileToUpload = new File([compositeBlob], story.file.name, { type: 'image/jpeg' });
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('media_type', story.type);
      params.append('duration', story.type === 'image' ? '10' : '30');
      params.append('visibility', 'public');

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch(`http://localhost:8000/stories/create?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Upload failed ${response.status}:`, errorData);
        console.error('Full error response:', errorData);
        throw new Error(`Upload failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('Story uploaded successfully:', data);
      
      // Success notification
      toast({
        title: "Story posted! 🎉",
        description: "Your story is now live for your followers",
      });
      
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('Error uploading story:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload story",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center px-4">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 lg:top-6 lg:right-6 text-white hover:bg-white/10 p-2 rounded-full transition z-10"
          aria-label="Close"
        >
          <X size={28} />
        </button>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="text-white text-2xl lg:text-3xl font-bold mb-2">Create Story</h1>
            <p className="text-gray-400 text-sm lg:text-base">Share a moment with your followers</p>
          </div>

          {/* Media Selection */}
          <div className="space-y-4">
            {/* Image Option */}
            <button
              onClick={() => handleMediaSelect('image')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition transform hover:scale-105 active:scale-95"
            >
              <span className="text-2xl">🖼️</span>
              <div className="text-left">
                <div className="text-base lg:text-lg">Photo Story</div>
                <div className="text-xs lg:text-sm font-normal opacity-80">Play for 10 seconds</div>
              </div>
            </button>

            {/* Video Option */}
            <button
              onClick={() => handleMediaSelect('video')}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition transform hover:scale-105 active:scale-95"
            >
              <span className="text-2xl">🎥</span>
              <div className="text-left">
                <div className="text-base lg:text-lg">Video Story</div>
                <div className="text-xs lg:text-sm font-normal opacity-80">Max 30 seconds</div>
              </div>
            </button>
          </div>

          {/* Hidden file inputs - separate for image and video */}
          <input
            ref={imageInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            onChange={handleFileChange}
            accept="video/mp4,video/webm"
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col lg:flex-row">
      {/* Header - Mobile only */}
      <div className="flex lg:hidden justify-between items-center px-4 py-3 bg-gray-900 border-b border-gray-800 w-full">
        <button
          onClick={() => {
            setStep('select');
            setStory(null);
            setText('');
            setEmojiStickers([]);
          }}
          className="text-white hover:bg-gray-800 p-2 rounded-full transition"
          title="Back to options"
        >
          <X size={24} />
        </button>
        <h2 className="text-white font-semibold">Edit Story</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:bg-gray-800 p-2 rounded-full transition"
          title="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Desktop Header - Only on desktop */}
      <div className="hidden lg:flex absolute top-0 left-0 right-0 justify-between items-center px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-50">
        <h2 className="text-white font-semibold">Edit Story</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10 p-2 rounded-full transition"
          title="Close"
        >
          <X size={28} />
        </button>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex items-center justify-center p-0 lg:p-8"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Story Preview Container - Desktop: 9:16 aspect ratio, Mobile: full screen */}
        <div className="relative w-full h-full lg:h-full lg:max-w-md lg:aspect-[9/16] lg:rounded-2xl overflow-hidden bg-black lg:shadow-2xl">
          
          {/* Media Preview */}
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            {story?.type === 'image' ? (
              <img
                src={story.preview}
                alt="Story"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={story?.preview}
                className="w-full h-full object-contain"
                controls
              />
            )}

        {/* Text Overlay - Draggable */}
        {text && (
          <div
            ref={textOverlayRef}
            className={`absolute bg-black/60 backdrop-blur-sm text-white p-3 rounded-lg max-w-xs z-20 select-none transition-all duration-100 ${
              isDraggingText 
                ? 'cursor-grabbing bg-black/80 scale-110 shadow-2xl' 
                : 'cursor-grab hover:bg-black/70 hover:scale-105'
            }`}
            style={{
              left: `${textPosition.x}%`,
              top: `${textPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
            }}
            onMouseDown={handleTextMouseDown}
            onTouchStart={handleTextTouchStart}
          >
            <p className="text-sm lg:text-lg font-semibold break-words pointer-events-none">{text}</p>
          </div>
        )}

        {/* Emoji Stickers - Draggable */}
        {emojiStickers.map((sticker, idx) => (
          <div
            key={idx}
            className={`absolute text-4xl lg:text-5xl select-none transition-all duration-100 ${
              draggingEmojiIndex === idx
                ? 'cursor-grabbing scale-125 opacity-90 z-30'
                : 'cursor-grab hover:scale-110 z-20'
            }`}
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
            }}
            onMouseDown={(e) => handleEmojiMouseDown(e, idx)}
            onTouchStart={(e) => handleEmojiTouchStart(e, idx)}
          >
            {sticker.emoji}
          </div>
        ))}

        {/* Tools Overlay */}
        <div className="absolute top-4 left-4 right-4 flex gap-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition"
            title="Add emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute top-16 left-4 bg-gray-800 rounded-lg p-3 grid grid-cols-4 gap-2 w-48">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="text-2xl hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
          </div>

          {/* Bottom Controls - Inside story container on desktop */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 space-y-3">
            {/* Text Input */}
            <input
              type="text"
              placeholder="Add text to your story..."
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 100))}
              className="w-full bg-gray-800/80 backdrop-blur-sm text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                uploading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
              }`}
            >
              <Download size={20} />
              {uploading ? 'Uploading...' : 'Share Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryUpload;