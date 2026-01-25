import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ArrowRight, User, Mail, Phone, Calendar, Instagram, Youtube, Facebook, 
  Upload, CheckCircle, Clock, Camera, IndianRupee, Plus, FileText, Edit, 
  Heart, MessageCircle, TrendingUp, Settings, Share2, BadgeCheck, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import avatar2 from "@/assets/avatar-2.jpg";
import heroBanner from "@/assets/hero-banner.jpg";

const steps = ["Personal", "Social Media", "Documents", "Review"];

const AICreator = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [aadhaarPhoto, setAadhaarPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsSubmitted(true);
      setTimeout(() => setIsApproved(true), 5000);
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

  // Waiting for approval state
  if (isSubmitted && !isApproved) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Application Under Review</h1>
            <p className="text-muted-foreground mb-6">
              Admin is verifying your Aadhaar, PAN, and other details. This usually takes about 2 minutes.
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

  // Dashboard after approval - Profile style
  if (isApproved) {
    const stats = [
      { label: "Prompts", value: "12" },
      { label: "Remixes", value: "1.2K" },
      { label: "Followers", value: "4.8K" },
    ];

    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-44 md:h-52 rounded-none sm:rounded-2xl overflow-hidden">
            <img
              src={heroBanner}
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
                    src={avatar2}
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
                <button 
                  onClick={() => navigate("/ai-creator/edit-profile")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground rounded-xl font-medium text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-muted/50 rounded-xl font-medium text-sm">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Name and Badge */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-display font-bold">Elara Vance</h1>
                <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary/20" />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary text-xs font-bold rounded-full">
                  AI CREATOR
                </span>
                <p className="text-muted-foreground text-sm">@elaravance</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 py-4 border-y border-border">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg sm:text-xl font-display font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
              <div className="flex-1 text-right">
                <p className="text-lg sm:text-xl font-display font-bold text-green-500">₹2,450</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Earnings</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4 mb-6">
              <p className="text-foreground text-sm">
                AI Artist & Digital Creator 🎨 Creating unique AI styles and prompts. Top 1% Creator.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Award className="w-4 h-4 text-primary" />
                <span>Verified AI Creator</span>
              </div>
            </div>
          </div>

          {/* Dashboard Options */}
          <div className="px-4 grid grid-cols-2 gap-3">
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
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-0.5">Add New Prompt</h3>
              <p className="text-xs text-muted-foreground">Create AI style</p>
            </Link>

            <Link
              to="/ai-creator/prompts"
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-secondary/50 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-semibold mb-0.5">My Prompts</h3>
              <p className="text-xs text-muted-foreground">Manage styles</p>
            </Link>

            <Link
              to="/ai-creator/edit-profile"
              className="p-4 md:p-5 bg-card border border-border rounded-2xl hover:border-pink-500/50 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-pink-500/10 flex items-center justify-center mb-3">
                <Edit className="w-5 h-5 text-pink-500" />
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
    <MainLayout showRightSidebar={false}>
      <div className="max-w-xl mx-auto px-3 md:px-0">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, i) => (
            <div key={step} className="flex-1">
              <div className={cn("h-1.5 rounded-full transition-colors", i <= currentStep ? "bg-primary" : "bg-muted")} />
              <p className={cn("text-xs mt-1.5 hidden sm:block", i <= currentStep ? "text-primary font-medium" : "text-muted-foreground")}>{step}</p>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4 pb-28">
          {currentStep === 0 && (
            <>
              <h2 className="text-xl font-bold mb-4">Personal Details</h2>
              {[
                { icon: User, label: "Full Name", placeholder: "Enter your name" },
                { icon: Calendar, label: "Date of Birth", placeholder: "dd-mm-yyyy", type: "date" },
                { icon: Mail, label: "Email", placeholder: "Enter your email", type: "email" },
                { icon: Phone, label: "Mobile Number", placeholder: "Enter mobile number", type: "tel" },
              ].map(({ icon: Icon, label, placeholder, type }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-2 text-primary">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type={type || "text"} 
                      placeholder={placeholder} 
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {currentStep === 1 && (
            <>
              <h2 className="text-xl font-bold mb-4">Social Media Links</h2>
              {[
                { icon: Instagram, label: "Instagram", placeholder: "@username" },
                { icon: Youtube, label: "YouTube", placeholder: "Channel URL" },
                { icon: Facebook, label: "Facebook", placeholder: "Profile URL" },
              ].map(({ icon: Icon, label, placeholder }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-2 text-primary">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder={placeholder} 
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-xl font-bold mb-4">Document Verification</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-primary">PAN Card Number</label>
                <input 
                  type="text" 
                  placeholder="ABCDE1234F" 
                  maxLength={10}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Aadhaar Number</label>
                <input 
                  type="text" 
                  placeholder="1234 5678 9012" 
                  maxLength={14}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Upload Aadhaar Card Photo</label>
                {aadhaarPhoto ? (
                  <div className="relative">
                    <img src={aadhaarPhoto} alt="Aadhaar" className="w-full h-36 object-cover rounded-xl" />
                    <button 
                      onClick={() => setAadhaarPhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Aadhaar Photo</span>
                    <input type="file" accept="image/*" onChange={handleAadhaarUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-primary">Live Photo Verification</label>
                {isCameraOpen ? (
                  <div className="space-y-3">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-44 object-cover rounded-xl bg-muted" />
                    <canvas ref={canvasRef} className="hidden" />
                    <button 
                      onClick={capturePhoto}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" /> Capture Photo
                    </button>
                  </div>
                ) : selfiePhoto ? (
                  <div className="relative">
                    <img src={selfiePhoto} alt="Selfie" className="w-full h-44 object-cover rounded-xl" />
                    <button 
                      onClick={() => setSelfiePhoto(null)}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 rounded-full text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={openCamera}
                    className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer hover:bg-primary/5"
                  >
                    <Camera className="w-6 h-6 text-primary" />
                    <span className="text-sm text-primary font-medium">Open Camera</span>
                  </button>
                )}
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>Personal details completed</span>
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>Social media linked</span>
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle className="w-5 h-5" />
                  <span>Documents verified</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                By submitting, you agree to our <Link to="/terms" className="text-primary underline">Terms</Link> and <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>

        {/* Navigation - Fixed bottom with proper sizing */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border z-20">
          <div className="max-w-xl mx-auto flex gap-3">
            {currentStep > 0 && (
              <button 
                onClick={handleBack} 
                className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted/50 transition-colors"
              >
                Back
              </button>
            )}
            <button 
              onClick={handleNext} 
              className={cn(
                "flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors",
                currentStep > 0 ? "flex-1" : "w-full max-w-xs mx-auto"
              )}
            >
              {currentStep === steps.length - 1 ? "Submit Application" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AICreator;
