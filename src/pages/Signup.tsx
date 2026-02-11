// filepath: c:\Users\so143\Desktop\kirnagram\frontend\src\pages\Signup.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Mail, Lock, User, ArrowRight, Phone, Loader } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/firebase";
import heroBanner from "@/assets/hero-banner.jpg";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { GoogleMobileModal } from "@/components/GoogleMobileModal";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ Check email in real-time
  const validateEmail = async (value: string) => {
    setEmail(value);
    setEmailError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      // Only clear error, don't show format validation error
      return;
    }

    // Check if email exists in backend
    setCheckingEmail(true);
    try {
      const checkRes = await fetch("http://127.0.0.1:8000/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, mobile: "" }),
      });

      const checkData = await checkRes.json();

      if (checkData.emailExists) {
        setEmailError("Email already in use");
      } else {
        setEmailError("");
      }
    } catch (err) {
      console.error("Email check failed:", err);
    } finally {
      setCheckingEmail(false);
    }
  };

  // ✅ Check mobile in real-time
  const validateMobile = async (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setMobile(cleanValue);
    setMobileError("");

    if (cleanValue.length !== 10) {
      // Only clear error, don't show length validation error
      return;
    }

    // Check if mobile exists in backend
    setCheckingMobile(true);
    try {
      const checkRes = await fetch("http://127.0.0.1:8000/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", mobile: cleanValue }),
      });

      const checkData = await checkRes.json();

      if (checkData.mobileExists) {
        setMobileError("Mobile number already in use");
      } else {
        setMobileError("");
      }
    } catch (err) {
      console.error("Mobile check failed:", err);
    } finally {
      setCheckingMobile(false);
    }
  };
   
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailError || mobileError || passwordError) return;
    if (!acceptedTerms) return;

    setLoading(true);

    try {
      // 2️⃣ Firebase signup
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await userCred.user.getIdToken();

      // 3️⃣ Save profile in MongoDB via backend
      await fetch("http://127.0.0.1:8000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: name,
          mobile: mobile,
          image_name: null,
        }),
      });

      // ✅ Show success toast
      toast({
        title: "Account Created Successfully! 🎉",
        description: "Welcome to kirnagram. Redirecting to home...",
        duration: 1000,
      });

      // 4️⃣ Redirect to home after 1 second
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };


  
const handleGoogleLogin = async () => {
  try {
    setGoogleLoading(true);

    // 🔐 Firebase Google popup
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 🔑 Get Firebase ID token
    const token = await user.getIdToken();

    // 📡 Send user info to backend
    const res = await fetch("http://127.0.0.1:8000/auth/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: user.displayName,
        image_name: user.photoURL,
      }),
    });

    const data = await res.json();

    // Check if this is a new user (needs mobile)
    if (data.newUser) {
      setShowMobileModal(true);
    } else {
      toast({
        title: "Login successful",
        description: "Welcome back to kirnagram",
      });
      navigate("/home");
    }

  } catch (error) {
    toast({
      title: "Google login failed",
      description: "Please try again",
      variant: "destructive",
    });
  } finally {
    setGoogleLoading(false);
  }
};


 
  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <GoogleMobileModal
        open={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        onSuccess={() => navigate("/home")}
      />

      {/* Left Panel - Image (reversed) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={heroBanner}
          alt="Cyber Renaissance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-display font-bold mb-3 text-foreground">
            Start Your <span className="bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">Creative Journey</span>
          </h2>
          <p className="text-muted-foreground">
            Create AI-powered art, connect with creators, and share your vision with the world.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-background relative">
        {/* Watercolor overlay - pink tint for signup */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-secondary/30 via-transparent to-secondary/20" />

        <div className="relative max-w-md mx-auto w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shadow-lg shadow-secondary/20">
              <Sparkles className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              kirnagram
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2 text-foreground">Create Account</h1>
          <p className="text-muted-foreground mb-8">
            Join the AI creative revolution
          </p>

          {/* Social Logins */}
          <div className="space-y-3 mb-6">
            <button
  type="button"
  onClick={handleGoogleLogin}
  disabled={googleLoading}
  className={`w-full flex items-center justify-center gap-3 py-3 px-4 
    bg-card border border-border rounded-xl transition-all
    ${
      googleLoading
        ? "opacity-60 cursor-not-allowed"
        : "hover:bg-muted/50"
    }
  `}
>
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>

  <span className="font-medium">
    {googleLoading ? "Signing in..." : "Continue with Google"}
  </span>
</button>

          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector('input[type="email"]') as HTMLInputElement)?.focus();
                    }
                  }}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Email</label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector('input[type="tel"]') as HTMLInputElement)?.focus();
                    }
                  }}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 bg-muted/50 rounded-xl text-sm
                    placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all
                    ${
                      emailError
                        ? "border border-red-500 focus:ring-red-500"
                        : "border border-border focus:ring-secondary/50 focus:border-secondary/50"
                    }
                  `}
                  required
                />

                {checkingEmail && (
                  <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary animate-spin" />
                )}
              </div>

              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Mobile Number</label>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => validateMobile(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector('input[name="password"]') as HTMLInputElement)?.focus();
                    }
                  }}
                  placeholder="Enter your mobile number"
                  maxLength={10}
                  className={`w-full pl-12 pr-4 py-3 bg-muted/50 rounded-xl text-sm
                    placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all
                    ${
                      mobileError
                        ? "border border-red-500 focus:ring-red-500"
                        : "border border-border focus:ring-secondary/50 focus:border-secondary/50"
                    }
                  `}
                  required
                />

                {checkingMobile && (
                  <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary animate-spin" />
                )}
              </div>

              {mobileError && (
                <p className="text-red-500 text-xs mt-1">{mobileError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Password</label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);

                    if (value.length < 8) {
                      setPasswordError("Password must be at least 8 characters");
                    } else {
                      setPasswordError("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.focus();
                    }
                  }}
                  placeholder="Create a password"
                  className={`w-full pl-12 pr-12 py-3 bg-muted/50 rounded-xl text-sm
                    placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all
                    ${
                      passwordError
                        ? "border border-red-500 focus:ring-red-500"
                        : "border border-border focus:ring-secondary/50 focus:border-secondary/50"
                    }
                  `}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-border bg-muted/50 text-secondary focus:ring-secondary/50"
              />

              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Privacy Policy
                </button>
              </span>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !acceptedTerms ||
                !name ||
                !email ||
                !mobile ||
                !password ||
                !!emailError ||
                !!mobileError ||
                !!passwordError ||
                checkingEmail ||
                checkingMobile
              }
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300
                ${
                  loading ||
                  !acceptedTerms ||
                  !name ||
                  !email ||
                  !mobile ||
                  !password ||
                  emailError ||
                  mobileError ||
                  passwordError ||
                  checkingEmail ||
                  checkingMobile
                    ? "bg-primary/60 cursor-not-allowed text-primary-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Modals */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};

export default Signup;