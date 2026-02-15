import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { auth } from "@/firebase";
import { Crop, ImagePlus, Loader2, Plus, Send, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const ratioOptions = [
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
];

const API_BASE = "http://127.0.0.1:8000";

type RatioLabel = "1:1" | "4:5" | "16:9" | "9:16";

const AddPostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [ratio, setRatio] = useState<RatioLabel>("1:1");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [draftRatio, setDraftRatio] = useState<RatioLabel>("1:1");
  const [draftZoom, setDraftZoom] = useState(1);
  const [draftOffsetX, setDraftOffsetX] = useState(0);
  const [draftOffsetY, setDraftOffsetY] = useState(0);
  const [caption, setCaption] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const pinchRef = useRef({ distance: 0, zoom: 1 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [previewBaseScale, setPreviewBaseScale] = useState(1);
  const [prefillLoaded, setPrefillLoaded] = useState(false);

  const ratioValue = useMemo(
    () => ratioOptions.find((item) => item.label === ratio)?.value ?? 1,
    [ratio],
  );

  const draftRatioValue = useMemo(
    () => ratioOptions.find((item) => item.label === draftRatio)?.value ?? 1,
    [draftRatio],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const imageUrl = (location.state as any)?.imageUrl as string | undefined;
    if (!imageUrl || prefillLoaded) return;

    const loadFromUrl = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        let response: Response | null = null;
        const proxyRes = await fetch(
          `${API_BASE}/posts/image-proxy?url=${encodeURIComponent(imageUrl)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (proxyRes.ok) {
          response = proxyRes;
        } else {
          try {
            response = await fetch(imageUrl);
          } catch {
            response = null;
          }
        }
        if (!response || !response.ok) return;

        const blob = await response.blob();
        const file = new File([blob], "remix.jpg", { type: blob.type || "image/jpeg" });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        setSelectedFile(file);
        setPreviewUrl(url);
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
        setDraftZoom(1);
        setDraftOffsetX(0);
        setDraftOffsetY(0);
        setRatio("1:1");
        setDraftRatio("1:1");
        setIsCropOpen(true);
        setPrefillLoaded(true);
      } catch {
        setPrefillLoaded(true);
      }
    };

    loadFromUrl();
  }, [location.state, prefillLoaded, previewUrl]);

  useEffect(() => {
    if (!isCropOpen) return;
    setDraftRatio(ratio);
    setDraftZoom(zoom);
    setDraftOffsetX(offsetX);
    setDraftOffsetY(offsetY);
  }, [isCropOpen, ratio, zoom, offsetX, offsetY]);

  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    if (!cropContainerRef.current || !imageSize.width || !imageSize.height) return;
    const container = cropContainerRef.current;
    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const nextBase = Math.max(rect.width / imageSize.width, rect.height / imageSize.height);
      setBaseScale(nextBase);
      setDraftOffsetX((prev) => {
        const { x } = clampOffsets(prev, draftOffsetY, rect.width, rect.height, nextBase, draftZoom);
        return x;
      });
      setDraftOffsetY((prev) => {
        const { y } = clampOffsets(draftOffsetX, prev, rect.width, rect.height, nextBase, draftZoom);
        return y;
      });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [imageSize, draftRatio, draftZoom, draftOffsetX, draftOffsetY]);

  useEffect(() => {
    if (!previewContainerRef.current || !imageSize.width || !imageSize.height) return;
    const container = previewContainerRef.current;
    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const nextBase = Math.max(rect.width / imageSize.width, rect.height / imageSize.height);
      setPreviewBaseScale(nextBase);
      setOffsetX((prev) => {
        const { x } = clampOffsets(prev, offsetY, rect.width, rect.height, nextBase, zoom);
        return x;
      });
      setOffsetY((prev) => {
        const { y } = clampOffsets(offsetX, prev, rect.width, rect.height, nextBase, zoom);
        return y;
      });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [imageSize, ratio, zoom, offsetX, offsetY]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setIsVideo(false);
      setRatio("1:1");
      setDraftRatio("1:1");
      setIsCropOpen(true);
    } else if (file.type.startsWith("video/")) {
      setIsVideo(true);
      setRatio("9:16");
      setDraftRatio("9:16");
      setIsCropOpen(false); // No crop for video
    } else {
      toast({
        title: "Unsupported file",
        description: "Please select an image or video file to continue.",
        variant: "destructive",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setDraftZoom(1);
    setDraftOffsetX(0);
    setDraftOffsetY(0);
  };

  const handleTagAdd = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
  };

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleTagAdd(tagInput.replace(/,$/, ""));
      setTagInput("");
    }
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const clampOffsets = (
    nextX: number,
    nextY: number,
    containerWidth: number,
    containerHeight: number,
    currentBaseScale: number,
    currentZoom: number,
  ) => {
    if (!imageSize.width || !imageSize.height) {
      return { x: nextX, y: nextY };
    }

    const scaledWidth = imageSize.width * currentBaseScale * currentZoom;
    const scaledHeight = imageSize.height * currentBaseScale * currentZoom;
    const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
    return {
      x: clamp(nextX, -maxX, maxX),
      y: clamp(nextY, -maxY, maxY),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropContainerRef.current) return;
    cropContainerRef.current.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: draftOffsetX,
      offsetY: draftOffsetY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !cropContainerRef.current) return;
    const rect = cropContainerRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    const nextX = dragStartRef.current.offsetX + deltaX;
    const nextY = dragStartRef.current.offsetY + deltaY;
    const { x, y } = clampOffsets(nextX, nextY, rect.width, rect.height, baseScale, draftZoom);
    setDraftOffsetX(x);
    setDraftOffsetY(y);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropContainerRef.current) return;
    cropContainerRef.current.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY * -0.0015;
    const nextZoom = clamp(Number((draftZoom + delta).toFixed(3)), 1, 3);
    if (cropContainerRef.current) {
      const rect = cropContainerRef.current.getBoundingClientRect();
      const { x, y } = clampOffsets(draftOffsetX, draftOffsetY, rect.width, rect.height, baseScale, nextZoom);
      setDraftOffsetX(x);
      setDraftOffsetY(y);
    }
    setDraftZoom(nextZoom);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      pinchRef.current = {
        distance: Math.hypot(dx, dy),
        zoom: draftZoom,
      };
    } else if (event.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        offsetX: draftOffsetX,
        offsetY: draftOffsetY,
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!cropContainerRef.current) return;
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const scale = distance / Math.max(pinchRef.current.distance, 1);
      const nextZoom = clamp(pinchRef.current.zoom * scale, 1, 3);
      const rect = cropContainerRef.current.getBoundingClientRect();
      const { x, y } = clampOffsets(draftOffsetX, draftOffsetY, rect.width, rect.height, baseScale, nextZoom);
      setDraftOffsetX(x);
      setDraftOffsetY(y);
      setDraftZoom(Number(nextZoom.toFixed(3)));
    } else if (event.touches.length === 1 && isDragging) {
      const rect = cropContainerRef.current.getBoundingClientRect();
      const deltaX = event.touches[0].clientX - dragStartRef.current.x;
      const deltaY = event.touches[0].clientY - dragStartRef.current.y;
      const nextX = dragStartRef.current.offsetX + deltaX;
      const nextY = dragStartRef.current.offsetY + deltaY;
      const { x, y } = clampOffsets(nextX, nextY, rect.width, rect.height, baseScale, draftZoom);
      setDraftOffsetX(x);
      setDraftOffsetY(y);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSendPost = async () => {
    if (!selectedFile) {
      toast({
        title: isVideo ? "Add a video" : "Add an image",
        description: `Select a ${isVideo ? "video" : "image"} before posting.`,
        variant: "destructive",
      });
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({
        title: "Please login",
        description: "You need to be signed in to create a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await currentUser.getIdToken();

      let fileToUpload: File = selectedFile;
      let fieldName = "image";
      if (!isVideo) {
        // Only crop images
        const createCroppedBlob = async () => {
          if (!previewUrl || !previewContainerRef.current || !imageSize.width || !imageSize.height) {
            return null;
          }
          const container = previewContainerRef.current;
          const rect = container.getBoundingClientRect();
          const containerWidth = rect.width;
          const containerHeight = rect.height;
          if (!containerWidth || !containerHeight) return null;
          const img = new Image();
          img.src = previewUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
          });
          const baseScaleForExport = Math.max(
            containerWidth / imageSize.width,
            containerHeight / imageSize.height,
          );
          const scale = baseScaleForExport * zoom;
          const imageRenderWidth = imageSize.width * scale;
          const imageRenderHeight = imageSize.height * scale;
          const imageLeft = containerWidth / 2 - imageRenderWidth / 2 + offsetX;
          const imageTop = containerHeight / 2 - imageRenderHeight / 2 + offsetY;
          const cropX = (0 - imageLeft) / scale;
          const cropY = (0 - imageTop) / scale;
          const cropWidth = containerWidth / scale;
          const cropHeight = containerHeight / scale;
          const targetWidth = 1080;
          const targetHeight = Math.round(targetWidth / ratioValue);
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            targetWidth,
            targetHeight,
          );
          return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
          });
        };
        const croppedBlob = await createCroppedBlob();
        if (croppedBlob) {
          fileToUpload = new File([croppedBlob], selectedFile.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
        }
        fieldName = "image";
      } else {
        // For video, no cropping in browser (future: add cropping UI)
        fieldName = "video";
      }

      const formData = new FormData();
      if (isVideo) {
        formData.append("video", fileToUpload);
      } else {
        formData.append("image", fileToUpload);
      }
      formData.append("ratio", ratio);
      formData.append("caption", caption);
      formData.append("tags", tags.join(","));

      const response = await fetch(`${API_BASE}/posts/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create post");
      }

      let createdPost: any = null;
      try {
        createdPost = await response.json();
      } catch {
        createdPost = null;
      }

      if (createdPost && (createdPost._id || createdPost.image_url || createdPost.video_url)) {
        const targetId = createdPost.user_id || currentUser.uid;
        const cacheKey = `posts:${targetId}`;
        const cached = sessionStorage.getItem(cacheKey);
        const normalizedPost = {
          ...createdPost,
          user_id: createdPost.user_id || currentUser.uid,
          ratio: createdPost.ratio || ratio,
          likes: createdPost.likes || [],
          comments: createdPost.comments || [],
          views: createdPost.views || [],
        };
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              sessionStorage.setItem(cacheKey, JSON.stringify([normalizedPost, ...parsed]));
            } else {
              sessionStorage.setItem(cacheKey, JSON.stringify([normalizedPost]));
            }
          } catch {
            sessionStorage.setItem(cacheKey, JSON.stringify([normalizedPost]));
          }
        } else {
          sessionStorage.setItem(cacheKey, JSON.stringify([normalizedPost]));
        }
      }

      toast({
        title: "Post uploaded",
        description: `Your ${isVideo ? "video" : "image"} post has been created successfully.`,
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      setTagInput("");
      setTags([]);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      setRatio("1:1");
      setIsVideo(false);
      navigate("/profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Create</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Add Post
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-black/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                Image Picker
              </div>
              {previewUrl && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change image
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsCropOpen(true)}>
                    <Crop className="w-4 h-4" />
                    Crop
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-dashed border-border bg-background/50 flex items-center justify-center",
                previewUrl ? "min-h-[320px]" : "min-h-[360px]",
              )}
            >
              {previewUrl ? (
                isVideo ? (
                  <div className="relative w-full" style={{ aspectRatio: 9/16 }}>
                    <video
                      src={previewUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-full rounded-2xl object-contain bg-black"
                      style={{ aspectRatio: 9/16 }}
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: ratioValue }}
                    ref={previewContainerRef}
                  >
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <img
                        src={previewUrl}
                        alt="Selected"
                        className="absolute top-1/2 left-1/2 object-cover max-w-none"
                        style={{
                          width: imageSize.width ? `${imageSize.width}px` : undefined,
                          height: imageSize.height ? `${imageSize.height}px` : undefined,
                          transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${zoom * previewBaseScale})`,
                          transformOrigin: "center",
                        }}
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center gap-4 text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">Select an image or video to start</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a photo, artwork, or video. {" "}
                      {isVideo ? "Video will be center cropped to 16:9 or 9:16." : "You can crop it next."}
                    </p>
                  </div>
                  <Button
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="w-4 h-4" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-black/10 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Description</h2>
              <Textarea
                placeholder="Write a caption that tells your story..."
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-[140px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tags</h2>
                <span className="text-xs text-muted-foreground">Press Enter to add</span>
              </div>
              <Input
                placeholder="Add tags (e.g., cyberpunk, neon)"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
              />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-1 pr-1" variant="secondary">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      className="rounded-full p-1 hover:bg-muted"
                      onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Post Settings</h2>
              <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                <p>Make sure your image is centered and looks great in the preview.</p>
                <p className="mt-1">Use the crop button anytime to adjust the framing.</p>
              </div>
            </div>

            <Button
              className="w-full rounded-full gap-2"
              onClick={handleSendPost}
              disabled={!selectedFile || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Uploading..." : "Send Post"}
            </Button>
          </div>
        </div>
      </div>

      {/* Only show crop dialog for images */}
      {!isVideo && (
        <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
          <DialogContent
            className="w-full max-w-none h-[100dvh] sm:h-auto sm:max-w-2xl rounded-none sm:rounded-2xl p-4 sm:p-6"
            showClose={false}
          >
            <DialogHeader>
              <DialogTitle>Adjust crop</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {ratioOptions
                  .filter((item) => item.label !== "9:16")
                  .map((item) => (
                    <Button
                      key={item.label}
                      size="sm"
                      variant={draftRatio === item.label ? "default" : "outline"}
                      onClick={() => setDraftRatio(item.label as RatioLabel)}
                    >
                      {item.label}
                    </Button>
                  ))}
              </div>

              <div
                className="relative w-full rounded-2xl bg-black/90 overflow-hidden"
                style={{ aspectRatio: draftRatioValue }}
                ref={cropContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                role="presentation"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Crop preview"
                    className="absolute top-1/2 left-1/2 object-cover max-w-none"
                    style={{
                      width: imageSize.width ? `${imageSize.width}px` : undefined,
                      height: imageSize.height ? `${imageSize.height}px` : undefined,
                      transform: `translate(-50%, -50%) translate(${draftOffsetX}px, ${draftOffsetY}px) scale(${draftZoom * baseScale})`,
                      transformOrigin: "center",
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select an image to crop
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                onClick={() => {
                  setRatio(draftRatio);
                  setZoom(draftZoom);
                  setOffsetX(draftOffsetX);
                  setOffsetY(draftOffsetY);
                  setIsCropOpen(false);
                }}
              >
                Next
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default AddPostPage;
