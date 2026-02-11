import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  UserPlus, 
  FileText, 
  Camera, 
  CheckCircle2, 
  Upload,
  ArrowRight,
  Clock,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  { icon: Star, title: "Creator Badge", description: "Get verified as an official publisher" },
  { icon: TrendingUp, title: "Earn Revenue", description: "Monetize your AI art styles" },
  { icon: Sparkles, title: "Featured Content", description: "Get showcased to millions" },
];

const BecomePublisher = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    portfolio: "",
    experience: "",
    socialMedia: {
      instagram: "",
      youtube: "",
      facebook: "",
    },
    idDocument: null as File | null,
    selfie: null as File | null,
    agreed: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("socialMedia.")) {
      const socialField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, [socialField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = (field: "idDocument" | "selfie", file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const canProceedStep1 = formData.fullName && formData.email && formData.phone;
  const canProceedStep2 = formData.portfolio && formData.experience;
  const canSubmit = formData.idDocument && formData.selfie && formData.agreed;

  if (isSubmitted) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-2xl mx-auto pb-24 md:pb-8 px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Application Submitted!</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Thank you for applying to become a publisher. Our admin team will review your application 
              and documents. You'll receive a notification once approved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-xl px-4 py-3">
              <Clock className="w-4 h-4" />
              <span>Estimated review time: 24-48 hours</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto pb-24 md:pb-8 px-4 overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Become a Publisher</h1>
          <p className="text-muted-foreground">Join our creator community and monetize your AI art</p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{benefit.title}</h3>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  step >= s 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "w-12 h-1 rounded-full transition-all",
                  step > s ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-card border border-border rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold mb-4">Personal Information</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold mb-4">Portfolio & Experience</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Portfolio URL *</label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => handleInputChange("portfolio", e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://your-portfolio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Experience with AI Art *</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Tell us about your experience with AI art creation..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Social Media Links</label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleInputChange("socialMedia.instagram", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Instagram profile URL"
                  />
                  <input
                    type="url"
                    value={formData.socialMedia.youtube}
                    onChange={(e) => handleInputChange("socialMedia.youtube", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="YouTube channel URL"
                  />
                  <input
                    type="url"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleInputChange("socialMedia.facebook", e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Facebook page URL"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold mb-4">Verification</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">ID Document *</label>
                <p className="text-xs text-muted-foreground mb-2">Upload a clear photo of your Aadhaar/PAN card</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  {formData.idDocument ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{formData.idDocument.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload("idDocument", e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Live Selfie *</label>
                <p className="text-xs text-muted-foreground mb-2">Take a clear photo of yourself for verification</p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  {formData.selfie ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm">{formData.selfie.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to capture</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handleFileUpload("selfie", e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={(e) => handleInputChange("agreed", e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-muted-foreground">
                  I agree to the Terms of Service and Privacy Policy. I confirm that all information provided is accurate.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/80 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                  <Upload className="w-4 h-4" /> Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BecomePublisher;
