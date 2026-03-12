import { useState, useRef, useEffect } from "react";
import { auth } from "@/firebase";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ArrowRight, User, Mail, Phone, Calendar, Instagram, Youtube, Facebook, 
  Upload, CheckCircle, Clock, Camera, IndianRupee, Plus, FileText, Edit, 
  Heart, MessageCircle, TrendingUp, Settings, Share2, BadgeCheck, Award, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import avatar2 from "@/assets/avatar-2.jpg";
import profileIcon from "@/assets/profileicon.png";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
// import heroBanner from "@/assets/hero-banner.jpg"; // Removed duplicate if already imported elsewhere
import { MainLayout } from "@/components/layout/MainLayout";
import heroBanner from "@/assets/hero-banner.jpg";

const steps = ["Personal", "Social Media"];

const API_URL = "http://localhost:8000";
const getPayoutPerRemix = (prompt: any) => Number(prompt?.payout_per_remix ?? 1) || 1;

const AICreator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    instagram: "",
    youtube: "",
    x: "",
    linkedin: "",
    facebook: "",
    website: "",
  });
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);

  // Fetch user profile and application status
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }
        // Fetch profile from backend (for mobile)
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setForm(f => ({
          ...f,
          fullName: data.full_name || user.displayName || "",
          email: data.email || user.email || "",
          mobile: data.mobile || "",
          facebook: data.facebook || "",
        }));
        // Fetch AI Creator application status
        const appRes = await fetch(`${API_URL}/ai-creator/application/${data.firebase_uid}`);
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplication(appData);
          if (appData.status === "pending") setIsSubmitted(true);
          if (appData.status === "approved") setIsApproved(true);
          if (appData.status === "rejected") setIsRejected(true);
        }
      } catch (e: any) {
        // If 404, no application exists
        if (e.message && e.message.includes("404")) {
          setApplication(null);
        } else {
          setError(e.message || "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPrompts = async () => {
      if (!isApproved || !profile) {
        setPrompts([]);
        setPromptsLoading(false);
        return;
      }
      try {
        setPromptsLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/ai-creator/prompts/me?status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return setPrompts([]);
        const data = await res.json();
        setPrompts(Array.isArray(data) ? data : []);
      } catch (err) {
        setPrompts([]);
      } finally {
        setPromptsLoading(false);
      }
    };

    fetchPrompts();
  }, [profile, isApproved]);

  // --- Earnings logic: use API totalEarnings (not calculated from prompts) ---
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [remixes, setRemixes] = useState<any[]>([]);
  const totalRemixes = remixes.length;
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        
        // Fetch remixes for count
        const remixesRes = await fetch(`${API_URL}/remix/my-remixes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (remixesRes.ok) {
          const remixesData = await remixesRes.json();
          setRemixes(remixesData.remixes || []);
        }
        
        // Fetch earnings summary with accurate totalEarnings
        const res = await fetch(`${API_URL}/withdraw/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTotalEarnings(data.totalEarnings || 0);
          setTotalWithdrawn(data.totalWithdrawn || 0);
        }
      } catch {}
    };
    fetchEarningsData();
  }, []);

  // Handle input changes
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // URL validation for social links
  const isValidUrl = (url: string, domain: string) => {
    if (!url) return true;
    try {
      const u = new URL(url);
      return u.hostname.includes(domain);
    } catch {
      return false;
    }
  };

  // Submit application
  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Validate URLs
      if (!isValidUrl(form.instagram, "instagram.com")) return setError("Instagram URL invalid");
      if (!isValidUrl(form.youtube, "youtube.com")) return setError("YouTube URL invalid");
      if (!isValidUrl(form.x, "x.com")) return setError("X (Twitter) URL invalid");
      if (!isValidUrl(form.facebook, "facebook.com") && !isValidUrl(form.facebook, "facebook.com")) return setError("facebook/Facebook URL invalid");
      if (form.website && !isValidUrl(form.website, ".")) return setError("Website URL invalid");
      try {
        setLoading(true);
        setError(null);
        const user = auth.currentUser;
        if (!user || !profile) throw new Error("Not logged in");
        const payload = {
          user_id: profile.firebase_uid,
          full_name: form.fullName,
          email: form.email,
          mobile: form.mobile,
          dob: form.dob,
          instagram: form.instagram,
          youtube: form.youtube,
          x: form.x,
          facebook: form.facebook,
          website: form.website,
        };
        const res = await fetch(`${API_URL}/ai-creator/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to submit application");
        setIsSubmitted(true);
      } catch (e: any) {
        setError(e.message || "Failed to submit");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAadhaarPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      setSelfiePhoto(canvasRef.current.toDataURL("image/jpeg"));
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Loading...</h1>
            {error && <p className="text-red-500 mb-6">{error}</p>}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Application status UI
  if (isSubmitted && !isApproved && !isRejected) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Application Under Review</h1>
            <p className="text-muted-foreground mb-6">
              Your AI Creator application has been submitted and is under review.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span>Checking documents...</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  if (isRejected) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-200 flex items-center justify-center animate-pulse">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Application Rejected</h1>
            <p className="text-muted-foreground mb-6">
              Your application was rejected. Please contact support for more info.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Dashboard after approval - Profile style
  if (isApproved && profile) {
    // All stats computed from top-level `prompts` state
    const promptsCount = prompts.length;
    const remixesCount = totalRemixes;
    const stats = [
      { label: "Prompts", value: String(promptsCount) },
      { label: "Remixes", value: String(remixesCount) },
    ];

    // Avatar and cover image logic (same as Profile)
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
      <MainLayout showRightSidebar={true}>
        <div className="max-w-4xl mx-auto pb-20 md:pb-0 overflow-x-hidden">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-44 md:h-52 rounded-none sm:rounded-2xl overflow-hidden">
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="relative px-4 -mt-14 sm:-mt-16">
            {/* Avatar and Actions Row */}
            <div className="flex items-end justify-between mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-r from-primary to-secondary">
                  <img
                    src={fallbackAvatar}
                    alt="Creator"
                    className="w-full h-full rounded-full object-cover border-4 border-background"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-green-500 rounded-full text-[10px] font-bold text-white border-2 border-background">
                  CREATOR
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-2">
                
              </div>
            </div>

            {/* Name and Badge */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-display font-bold">{profile.full_name || profile.displayName || "AI Creator"}</h1>
                <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary/20" />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs font-bold rounded-full">
                  AI CREATOR
                </span>
                <p className="text-muted-foreground text-sm">@{profile.username || profile.email?.split("@")[0]}</p>
              </div>
            </div>

            {/* Stats (no followers, all 0) */}
            <div className="flex gap-6 py-4 border-y border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg sm:text-xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
              {/* Earnings Card UI block: only Available Balance */}
              <div className="flex-1 text-right">
                <div className="inline-block p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground mb-1 text-right">Available Balance</p>
                  <p className="text-lg sm:text-xl font-display font-bold text-green-500 text-right">₹{availableBalance}</p>
                </div>
              </div>
            </div>

            {/* Social Media Icons Row */}
            {(profile.instagram || profile.youtube || profile.facebook || profile.x || profile.linkedin || profile.whatsapp || profile.website) && (
              <div className="flex gap-3 justify-center py-4 border-b border-border">
                {profile.instagram && (
                  <a href={profile.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center hover:scale-110 transition-transform">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
                {profile.youtube && (
                  <a href={profile.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center hover:scale-110 transition-transform">
                    <Youtube className="w-5 h-5 text-white" />
                  </a>
                )}
                {profile.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:scale-110 transition-transform">
                    <Facebook className="w-5 h-5 text-white" />
                  </a>
                )}
                {profile.x && (
                  <a href={profile.x} target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white dark:text-black" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.48 0-4.49 2.01-4.49 4.49 0 .352.04.695.116 1.022C7.728 9.36 4.1 7.6 1.67 4.98c-.386.664-.607 1.437-.607 2.26 0 1.56.795 2.94 2.005 3.75a4.48 4.48 0 0 1-2.034-.563v.057c0 2.18 1.55 4 3.6 4.42-.377.104-.775.16-1.185.16-.29 0-.57-.028-.845-.08.57 1.78 2.23 3.08 4.2 3.12A8.98 8.98 0 0 1 2 19.54a12.7 12.7 0 0 0 6.88 2.02c8.26 0 12.78-6.84 12.78-12.78 0-.195-.004-.39-.013-.583A9.1 9.1 0 0 0 24 4.59a8.98 8.98 0 0 1-2.54.698z"/>
                    </svg>
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-8.5 19h-3v-8h3v8zm-1.5-9.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 9.268h-3v-4.5c0-1.07-.93-2-2-2s-2 .93-2 2v4.5h-3v-8h3v1.085c.41-.63 1.36-1.085 2.5-1.085 1.93 0 3.5 1.57 3.5 3.5v4.5z"/>
                    </svg>
                  </a>
                )}
                {profile.whatsapp && (
                  <a href={profile.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" title={profile.website_name || "Website"} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
           
          </div>

          {/* Dashboard Options */}
          <div className="px-4 grid grid-cols-2 gap-3 mt-0">
            <Link
              to="/ai-creator/earnings"
              className="p-4 md:p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                <IndianRupee className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-semibold mb-0.5">Earnings</h3>
              <p className="text-xs text-muted-foreground">View analytics</p>
            </Link>

            <Link
              to="/ai-creator/add-prompt"
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-primary/50 md:hover:border-border/80 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold mb-0.5">Add New Prompt</h3>
              <p className="text-xs text-muted-foreground">Create AI style</p>
            </Link>

            <Link
              to="/ai-creator/prompts"
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-secondary/50 md:hover:border-border/80 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold mb-0.5">My Prompts</h3>
              <p className="text-xs text-muted-foreground">Manage styles</p>
            </Link>

            <Link
              to="/ai-creator/edit-profile"
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-pink-500/50 md:hover:border-border/80 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Edit className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold mb-0.5">Edit Profile</h3>
              <p className="text-xs text-muted-foreground">Update info</p>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Registration flow
  return (
    <MainLayout showRightSidebar={true}>
      <div className="flex justify-center items-center min-h-[80vh] py-8">
        <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border">
          {/* Progress */}
          <div className="flex items-center gap-4 mb-10">
            {steps.map((step, i) => (
              <div key={step} className="flex-1">
                <div className={cn("h-2 rounded-full transition-colors", i <= currentStep ? "bg-primary" : "bg-muted")}/>
                <p className={cn("text-xs mt-2 hidden sm:block text-center", i <= currentStep ? "text-primary font-semibold" : "text-muted-foreground")}>{step}</p>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-10 pb-20">
            {currentStep === 0 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Personal Details</h2>
                {/* Full Name (read-only) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-70 cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>
                {/* Date of Birth (editable) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleInput}
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                    />
                  </div>
                </div>
                {/* Email (read-only) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-70 cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>
                {/* Mobile (read-only) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      readOnly
                      className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-70 cursor-not-allowed shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Social Media Links</h2>
                {/* Instagram */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Instagram</label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="instagram"
                      value={form.instagram}
                      onChange={handleInput}
                      placeholder="https://instagram.com/username"
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                {/* YouTube */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">YouTube</label>
                  <div className="relative">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="youtube"
                      value={form.youtube}
                      onChange={handleInput}
                      placeholder="https://youtube.com/@channel"
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                {/* X (Twitter) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">X (Twitter)</label>
                  <div className="relative">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="x"
                      value={form.x}
                      onChange={handleInput}
                      placeholder="https://x.com/username"
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                {/* Facebook */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Facebook</label>
                  <div className="relative">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="facebook"
                      value={form.facebook}
                      onChange={handleInput}
                      placeholder="https://facebook.com/username"
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                {/* Website */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-primary">Website / Portfolio (optional)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="website"
                      value={form.website}
                      onChange={handleInput}
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation - Inline below step content for better mobile visibility */}
          <div className="w-full py-6 z-20">
            <div className="max-w-2xl mx-auto flex gap-4 flex-col sm:flex-row">
              {currentStep > 0 && (
                <button 
                  onClick={handleBack} 
                  className="px-8 py-3 border border-border rounded-xl font-medium hover:bg-muted/50 transition-colors bg-background shadow"
                >
                  Back
                </button>
              )}
              <button 
                onClick={handleNext} 
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-8 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg",
                  currentStep > 0 ? "flex-1" : "w-full max-w-xs mx-auto"
                )}
                style={{ boxShadow: "0 4px 24px 0 rgba(255, 140, 0, 0.25)" }}
              >
                {currentStep === steps.length - 1 ? "Submit Application" : "Continue"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          {error && <div className="text-red-500 text-center mt-4">{error}</div>}
        </div>
      </div>
    </MainLayout>
  );
};

export default AICreator;