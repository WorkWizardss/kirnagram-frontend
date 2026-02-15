import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Save,
  AtSign,
  FileText,
  Users,
  ChevronDown,
  X,
  RotateCw,
  Crosshair,
} from "lucide-react";
import Cropper from "react-easy-crop";
import avatar2 from "@/assets/avatar-2.jpg";
import heroBanner from "@/assets/hero-banner.jpg";
import profileIcon from "@/assets/profileicon.png";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import { MainLayout } from "@/components/layout/MainLayout";
import { auth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://127.0.0.1:8000";

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraCaptureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showCoverSheet, setShowCoverSheet] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [cropType, setCropType] = useState<"profile" | "cover">("profile");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const [genderOpen, setGenderOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    bio: "",
    gender: "",
  });

  const getGenderFallback = (gender?: string, imageName?: string) => {
    // If image is a real uploaded file (from R2 or Google, valid URL), use it
    if (imageName && imageName.trim() !== "" && 
        !imageName.includes("default") && 
        !imageName.includes("placeholder")) {
      return imageName;
    }
    // Otherwise use gender-based icon
    if (gender === "male") return maleIcon;
    if (gender === "female") return femaleIcon;
    return profileIcon;
  };

  // 🔹 LOAD PROFILE
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        const res = await fetch(`${API_BASE}/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        setFormData({
          name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.mobile || "",
          location: data.location || "",
          website: data.website || "",
          bio: data.bio || "",
          gender: data.gender || "",
        });

        // Set avatar with fallback logic
        const avatarUrl = data.image_name && 
          data.image_name.trim() !== "" && 
          !data.image_name.includes("default") &&
          !data.image_name.includes("placeholder") &&
          !data.image_name.startsWith("blob:")  // ✅ Filter out blob URLs
            ? data.image_name
            : getGenderFallback(data.gender, data.image_name);
        setAvatarPreview(avatarUrl);
        
        // Set cover with fallback to hero banner
        const coverUrl = data.cover_image && 
          data.cover_image.trim() !== "" &&
          !data.cover_image.includes("default") &&
          !data.cover_image.includes("placeholder") &&
          !data.cover_image.startsWith("blob:")  // ✅ Filter out blob URLs
            ? data.cover_image
            : heroBanner;
        setCoverPreview(coverUrl);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 INPUT CHANGE
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // If the user switches gender and there is no uploaded image, adjust fallback
    if (name === "gender" && (!avatarPreview || avatarPreview === getGenderFallback(formData.gender))) {
      setAvatarPreview(getGenderFallback(value));
    }
  };

  const handleGenderSelect = (value: string) => {
    const currentFallback = getGenderFallback(formData.gender);
    setFormData({ ...formData, gender: value });
    if (!avatarPreview || avatarPreview === currentFallback) {
      setAvatarPreview(getGenderFallback(value));
    }
    setGenderOpen(false);
  };

  // 🔹 UPLOAD IMAGE (R2)
  const uploadImage = async (
    file: File,
    type: "profile-image" | "cover-image"
  ) => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return null;
    }

    const token = await user.getIdToken();

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/${type}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Upload failed:", err);
        toast({ title: "Upload failed", description: err.detail || "Server error", variant: "destructive" });
        return null;
      }

      const data = await res.json();
      if (!data?.image_url) {
        toast({ title: "Upload failed", description: "Invalid server response", variant: "destructive" });
        return null;
      }
      return data.image_url as string;
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload error", description: String(error), variant: "destructive" });
      return null;
    }
  };

  // 🔹 AVATAR SELECT
  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Show crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string);
      setCropFile(file);
      setCropType("profile");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setShowCropModal(true);
      setShowAvatarSheet(false);
    };
    reader.readAsDataURL(file);
  };

  // 🔹 CAMERA FLOW
  const stopCameraStream = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({ title: "Camera not supported", description: "Browser does not support camera capture. Opening gallery instead.", variant: "destructive" });
      cameraInputRef.current?.click();
      return;
    }

    setCameraError("");
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setCameraStream(stream);
      setShowCameraModal(true);
      setShowAvatarSheet(false);

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
    } catch (error: any) {
      const message = error?.name === "NotAllowedError" ? "Camera permission denied" : "Unable to access camera";
      setCameraError(message);
      toast({ title: message, description: "You can still upload from gallery.", variant: "destructive" });
      cameraInputRef.current?.click();
    } finally {
      setCameraLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraVideoRef.current || !cameraCaptureCanvasRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = cameraCaptureCanvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "camera.png", { type: "image/png" });
      setCropFile(file);
      setCropSrc(dataUrl);
      setCropType("profile");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setShowCropModal(true);
      setShowCameraModal(false);
      stopCameraStream();
    } catch (error) {
      console.error("Failed to capture photo", error);
      toast({ title: "Capture failed", description: "Please try again", variant: "destructive" });
    }
  };

  // 🔹 COVER SELECT
  const handleCoverSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    // Show crop modal for cover
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string);
      setCropFile(file);
      setCropType("cover");
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setShowCropModal(true);
      setShowCoverSheet(false);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // 🔹 CROP AND SAVE IMAGE
  const handleCropSave = async () => {
    if (!cropSrc || !croppedAreaPixels) return;

    const canvas = cropCanvasRef.current;
    if (!canvas) return;

    setUploadingImage(true);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = cropSrc;

    image.onload = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let canvasWidth = 400;
      let canvasHeight = 400;
      let type: "profile-image" | "cover-image" = "profile-image";

      if (cropType === "cover") {
        canvasWidth = 800;
        canvasHeight = 300;
        type = "cover-image";
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw cropped image
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      // For circular profile images, add circular mask
      if (cropType === "profile") {
        const imageData = ctx.getImageData(0, 0, 400, 400);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const pixelIndex = i / 4;
          const x = pixelIndex % 400;
          const y = Math.floor(pixelIndex / 400);
          const dx = x - 200;
          const dy = y - 200;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 200) {
            data[i + 3] = 0; // Set alpha to 0 for pixels outside circle
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      // Convert canvas to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const filename = cropType === "profile" ? "avatar.png" : "cover.png";
        const croppedFile = new File([blob], filename, { type: "image/png" });

        const preview = URL.createObjectURL(blob);
        if (cropType === "profile") {
          setAvatarPreview(preview);
        } else {
          setCoverPreview(preview);
        }

        const uploadedUrl = await uploadImage(croppedFile, type);
        if (uploadedUrl) {
          const cacheUrl = `${uploadedUrl}?t=${Date.now()}`;
          if (cropType === "profile") {
            setAvatarPreview(cacheUrl);
          } else {
            setCoverPreview(cacheUrl);
          }

          // 🔹 SAVE TO DATABASE IMMEDIATELY (skip notification)
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            try {
              const updatePayload = cropType === "profile" 
                ? { image_name: uploadedUrl, skip_notification: true }
                : { cover_image: uploadedUrl, skip_notification: true };
              
              await fetch(`${API_BASE}/profile/update`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
              });
            } catch (error) {
              console.error("Failed to save image to database:", error);
              toast({ title: "Image uploaded but failed to save to profile", variant: "destructive" });
            }
          }
        } else {
          toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
        }

        setShowCropModal(false);
        setUploadingImage(false);
        setShowAvatarSheet(false);
        setShowCoverSheet(false);
        toast({ title: `${cropType === "profile" ? "Photo" : "Cover"} updated successfully` });
      }, "image/png");
    };

    image.onerror = () => {
      setUploadingImage(false);
      toast({ title: "Failed to process image", variant: "destructive" });
    };
  };

  // 🔹 COVER SELECT
  const handleCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setCoverPreview(URL.createObjectURL(file));
    await uploadImage(file, "cover-image");
  };

  // 🔹 REMOVE AVATAR (reset to gender/default icon)
  const handleRemoveAvatar = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    try {
      const res = await fetch(`${API_BASE}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_name: null, skip_notification: true }),
      });

      if (res.ok) {
        const fallback = getGenderFallback(formData.gender);
        setAvatarPreview(fallback);
        toast({ title: "Profile photo removed" });
      } else {
        toast({ title: "Failed to remove photo", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to remove avatar", error);
      toast({ title: "Failed to remove photo", variant: "destructive" });
    } finally {
      setShowAvatarSheet(false);
    }
  };

  // 🔹 REMOVE COVER
  const handleRemoveCover = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cover_image: null, skip_notification: true }),
      });

      if (res.ok) {
        setCoverPreview(null);
        toast({ title: "Cover photo removed" });
      } else {
        toast({ title: "Failed to remove cover", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to remove cover", error);
      toast({ title: "Error removing cover", variant: "destructive" });
    } finally {
      setShowCoverSheet(false);
    }
  };

  // 🔹 SAVE PROFILE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    const token = await user.getIdToken();

    try {
      // Build update payload - include image URLs if they exist
      const updatePayload: any = {
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        mobile: formData.phone,
        gender: formData.gender,
      };

      // Only include images if they are actual URLs (not fallback icons or blob URLs)
      if (avatarPreview && 
          !avatarPreview.includes('maleicon') && 
          !avatarPreview.includes('femaleicon') && 
          !avatarPreview.includes('profileicon') &&
          !avatarPreview.includes('avatar-2') &&
          !avatarPreview.startsWith('blob:')) {  // ✅ Never save blob URLs
        // Remove cache-busting query param before saving
        const cleanUrl = avatarPreview.split('?')[0];
        updatePayload.image_name = cleanUrl;
      }

      if (coverPreview && 
          !coverPreview.includes('hero-banner') &&
          !coverPreview.startsWith('blob:')) {  // ✅ Never save blob URLs
        // Remove cache-busting query param before saving
        const cleanUrl = coverPreview.split('?')[0];
        updatePayload.cover_image = cleanUrl;
      }

      const response = await fetch(`${API_BASE}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully",
        });
        navigate("/profile");
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Something went wrong while updating your profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 🔹 DETECT CURRENT LOCATION
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({ 
        title: "Geolocation not supported", 
        description: "Your browser doesn't support location detection", 
        variant: "destructive",
        duration: 2000 
      });
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use BigDataCloud API (free, CORS-enabled, no API key needed)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // Format location: City, State/Region, Country
            const locationParts = [];
            if (data.city || data.locality) {
              locationParts.push(data.city || data.locality);
            }
            if (data.principalSubdivision) {
              locationParts.push(data.principalSubdivision);
            }
            if (data.countryName) {
              locationParts.push(data.countryName);
            }
            
            const detectedLocation = locationParts.join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setFormData({ ...formData, location: detectedLocation });
            toast({ 
              title: "📍 Location detected", 
              description: detectedLocation,
              duration: 2000 
            });
          } else {
            throw new Error("Geocoding failed");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          // Fallback to coordinates
          const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData({ ...formData, location: coords });
          toast({ 
            title: "📍 Location detected", 
            description: "Using coordinates",
            duration: 2000 
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setDetectingLocation(false);
        const message = error.code === 1 
          ? "Location permission denied" 
          : error.code === 3
          ? "Location detection timeout"
          : "Unable to detect location";
        toast({ 
          title: message, 
          description: "Please enter manually", 
          variant: "destructive",
          duration: 2000 
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!genderDropdownRef.current) return;
      if (!genderDropdownRef.current.contains(event.target as Node)) {
        setGenderOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure stream attaches once modal renders
  useEffect(() => {
    if (!showCameraModal || !cameraStream || !cameraVideoRef.current) return;
    cameraVideoRef.current.srcObject = cameraStream;
    cameraVideoRef.current
      .play()
      .catch((err) => console.error("Video play failed", err));
  }, [showCameraModal, cameraStream]);

  if (loading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex justify-center items-center h-96">
          Loading profile...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto overflow-x-hidden">
       
          <div className="flex items-center gap-3 mb-4 mt-4 ml-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-display font-bold">Edit Profile</h1>
            <button
              type="submit"
              form="edit-profile-form"
              className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Save
            </button>
          </div>

        {/* Cover */}
        <div className="relative h-32 sm:h-48 rounded-xl overflow-hidden">
          <img
            src={coverPreview || heroBanner}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCoverSheet(true);
              }}
              className="p-3 bg-background/80 rounded-full hover:bg-background transition-all shadow-lg active:scale-95 z-20 pointer-events-auto"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative px-4 -mt-16 z-30">
          <div className="relative w-28 h-28">
            <img
              src={avatarPreview || avatar2}
              className="w-full h-full rounded-full object-cover border-4 border-background"
            />
            <button
              onClick={() => setShowAvatarSheet(true)}
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              hidden
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                if (!e.target.files?.[0]) return;
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                  setCropSrc(event.target?.result as string);
                  setCropFile(file);
                  setCropType("profile");
                  setZoom(1);
                  setCrop({ x: 0, y: 0 });
                  setShowCropModal(true);
                  setShowAvatarSheet(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        {/* Avatar action sheet - Bottom on mobile, centered dialog on desktop */}
        {showAvatarSheet && (
          <div 
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAvatarSheet(false);
              }
            }}
          >
            <div className="w-full md:max-w-md bg-background md:rounded-2xl rounded-t-3xl p-6 space-y-3 animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 shadow-2xl border-t-4 border-primary/20">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Profile photo</p>
                <button onClick={() => setShowAvatarSheet(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                className="w-full py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-all"
                onClick={() => avatarInputRef.current?.click()}
              >
                Choose from gallery
              </button>
              <button
                className="w-full py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-all"
                onClick={openCamera}
              >
                Take photo
              </button>
              <button
                className="w-full py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all"
                onClick={handleRemoveAvatar}
              >
                Remove current picture
              </button>
            </div>
          </div>
        )}

        {/* Cover action sheet - Bottom on mobile, centered dialog on desktop */}
        {showCoverSheet && (
          <div 
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCoverSheet(false);
              }
            }}
          >
            <div className="w-full md:max-w-md bg-background md:rounded-2xl rounded-t-3xl p-6 space-y-3 animate-in fade-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 shadow-2xl border-t-4 border-primary/20">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Cover photo</p>
                <button onClick={() => setShowCoverSheet(false)} className="p-2 hover:bg-muted rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                className="w-full py-3 rounded-xl bg-muted hover:bg-muted/70 text-sm font-medium transition-all"
                onClick={() => {
                  setShowCoverSheet(false);
                  coverInputRef.current?.click();
                }}
              >
                Choose from gallery
              </button>
              <button
                className="w-full py-3 rounded-xl border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-all"
                onClick={handleRemoveCover}
              >
                Remove current picture
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={coverInputRef}
          type="file"
          hidden
          accept="image/*"
          onChange={handleCoverSelect}
        />

        {showCameraModal && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                stopCameraStream();
                setShowCameraModal(false);
              }
            }}
          >
            <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl p-4 md:p-6 space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />Take photo</p>
                  {cameraError && <p className="text-xs text-destructive mt-1">{cameraError}</p>}
                </div>
                <button
                  onClick={() => {
                    stopCameraStream();
                    setShowCameraModal(false);
                  }}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative bg-muted/40 rounded-xl overflow-hidden aspect-[3/4] md:aspect-video max-h-[70vh]">
                <video
                  ref={cameraVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {cameraLoading && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <RotateCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                )}
              </div>

              <canvas ref={cameraCaptureCanvasRef} hidden />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    stopCameraStream();
                    setShowCameraModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-border hover:bg-muted text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCameraCapture}
                  disabled={cameraLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cameraLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Opening camera...
                    </>
                  ) : (
                    "Capture"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Professional Crop Modal with Animations */}
        {showCropModal && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !uploadingImage) setShowCropModal(false);
            }}
          >
            <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl p-4 md:p-6 space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Crop {cropType === "profile" ? "Profile Photo" : "Cover Image"}
                </h2>
                <button 
                  onClick={() => !uploadingImage && setShowCropModal(false)} 
                  disabled={uploadingImage}
                  className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* React Easy Crop Component with Loading Overlay */}
              <div className={`relative bg-gradient-to-br from-muted/50 to-muted rounded-xl overflow-hidden ${cropType === "profile" ? "h-96" : "h-64"}`}>
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropType === "profile" ? 1 : 800 / 300}
                  cropShape={cropType === "profile" ? "round" : "rect"}
                  showGrid={true}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  objectFit="horizontal-cover"
                />
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                    <RotateCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-foreground">Uploading image...</p>
                  </div>
                )}
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Zoom</label>
                  <span className="text-xs text-muted-foreground">{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  disabled={uploadingImage}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary 
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all 
                    [&::-webkit-slider-thumb]:hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <canvas ref={cropCanvasRef} hidden />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCropModal(false)}
                  disabled={uploadingImage}
                  className="flex-1 py-3 rounded-xl border-2 border-border hover:bg-muted text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploadingImage}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Save & Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="px-2 md:px-4 py-6 space-y-5">
          {/* NAME (READ ONLY) */}
          <Input
            label="Full Name"
            icon={<User className="w-5 h-5" />}
            value={formData.name}
            disabled
          />
          <Input
            label="Username"
            name="username"
            icon={<AtSign className="w-5 h-5" />}
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
          />

          {/* GENDER */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Gender</label>
            <div ref={genderDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setGenderOpen((open) => !open)}
                className="w-full pl-12 pr-10 py-3 rounded-xl text-sm bg-background/80 border-2 border-border hover:bg-background hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer font-medium text-foreground text-left"
              >
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                </span>
                {formData.gender === "male"
                  ? "Male"
                  : formData.gender === "female"
                    ? "Female"
                    : "Select your gender"}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <ChevronDown className={`w-5 h-5 transition-transform ${genderOpen ? "rotate-180" : ""}`} />
                </span>
              </button>

              {genderOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-card/95 backdrop-blur shadow-xl overflow-hidden">
                  {[
                    { value: "", label: "Select your gender" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleGenderSelect(option.value)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        formData.gender === option.value
                          ? "bg-orange-500/20 text-orange-200"
                          : "text-foreground hover:bg-orange-500/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Input
            label="Email"
            icon={<Mail className="w-5 h-5" />}
            value={formData.email}
            disabled
          />
          <Input
            label="Phone"
            name="phone"
            icon={<Phone className="w-5 h-5" />}
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />
          {/* Location with auto-detect */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Location</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground group-hover:text-primary">
                <MapPin className="w-5 h-5" />
              </span>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter your location"
                className="w-full pl-12 pr-12 py-3 rounded-xl text-sm placeholder:text-muted-foreground transition-all bg-muted/50 border border-border hover:bg-muted/70 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Detect current location"
              >
                {detectingLocation ? (
                  <RotateCw className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Crosshair className="w-4 h-4 text-muted-foreground hover:text-primary" />
                )}
              </button>
            </div>
          </div>
          <Input
            label="Website"
            name="website"
            icon={<LinkIcon className="w-5 h-5" />}
            value={formData.website}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Bio</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none hover:bg-muted/70"
              />
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

const Input = ({ label, icon, disabled, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-foreground">{label}</label>
    <div className="relative group">
      <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
        disabled ? "text-muted-foreground/50" : "text-muted-foreground group-hover:text-primary"
      }`}>
        {icon}
      </span>
      <input
        disabled={disabled}
        {...props}
        className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm placeholder:text-muted-foreground transition-all
          ${disabled 
            ? "bg-muted/30 text-muted-foreground cursor-not-allowed border border-border/50" 
            : "bg-muted/50 border border-border hover:bg-muted/70 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          }
        `}
      />
    </div>
  </div>
);

export default EditProfile;
