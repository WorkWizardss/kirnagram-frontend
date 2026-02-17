import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles, Mail, Lock, ArrowRight, Loader } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import {
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth, googleProvider } from "@/firebase";
import { GoogleMobileModal } from "@/components/GoogleMobileModal";

const Login = () => {
  // ✅ ALL HOOKS INSIDE COMPONENT
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  // 🔥 STEP 1 — ADD NEW STATE
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  // 🚨 ISSUE 2 — OTP Modal Loading State
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate email format
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    toast({
      title: "Invalid email",
      description: "Please enter a valid email address.",
      variant: "destructive",
    });
    return;
  }

  // Validate password length
  if (password.length < 6) {
    toast({
      title: "Password too short",
      description: "Password must be at least 6 characters.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  setPasswordError(""); // reset previous error

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // 🔥 Get fresh token
    const token = await userCredential.user.getIdToken(true);

    // 🔄 Sync user
    await fetch("http://127.0.0.1:8000/2fa/sync-user", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 🔐 Check 2FA
    const res = await fetch("http://127.0.0.1:8000/2fa/login-request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("2FA Response:", data);

    if (data.two_factor_required === true) {
      setShowOtpModal(true);
      setLoading(false);
      return;
    }

    // ✅ If 2FA not enabled
    navigate("/home");

  } catch (err: any) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const handleGoogleLogin = async () => {
  try {
    setLoading(true);

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
      toast({
        title: "📱 Complete your profile",
        description: "Add your phone number to continue.",
        duration: 2000,
      });
      setShowMobileModal(true);
    } else {
      // 🔥 STEP 3 — 2FA check for Google login
      const check2fa = await fetch("http://127.0.0.1:8000/2fa/login-request", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data2fa = await check2fa.json();
      if (data2fa.two_factor_required) {
        setShowOtpModal(true);
        setLoading(false);
        return;
      }
      navigate("/home");
    }

  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      // User closed the popup, don't show error
      return;
    }
    toast({
      title: "❌ Google login failed",
      description: "Please try again or use email login.",
      variant: "destructive",
      duration: 3000,
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <GoogleMobileModal
        open={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        onSuccess={() => navigate("/")}
      />

      {/* 🔥 STEP 4 — OTP MODAL UI */}
      {showOtpModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowOtpModal(false)}
        >
          <div
            className="bg-white p-6 rounded-xl w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">
              Enter Email OTP
            </h2>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setOtp(value);
              }}
              placeholder="Enter 6-digit OTP"
              className="w-full border p-2 rounded mb-4 text-center tracking-widest"
            />

            <button
              disabled={otpLoading}
              onClick={async () => {
                setOtpLoading(true);
                // OTP length validation
                if (otp.length !== 6) {
                  toast({
                    title: "Invalid OTP",
                    description: "Please enter valid 6-digit OTP",
                    variant: "destructive",
                  });
                  setOtpLoading(false);
                  return;
                }
                // Always get a fresh token for OTP verify
                const token = await auth.currentUser?.getIdToken(true);

                const verify = await fetch(
                  "http://127.0.0.1:8000/2fa/login-verify",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ otp }),
                  }
                );

                if (verify.ok) {
                  setShowOtpModal(false);
                  setOtp("");
                  navigate("/home");
                } else {
                  toast({
                    title: "Invalid OTP",
                    description: "The OTP is incorrect or expired.",
                    variant: "destructive",
                  });
                }
                setOtpLoading(false);
              }}
              className="bg-primary text-white w-full py-2 rounded"
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </div>
      )}

      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-background relative overflow-x-hidden">
        {/* Watercolor overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-primary/30 via-transparent to-primary/20" />

        <div className="relative max-w-md mx-auto w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              kirnagram
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2 text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to continue your creative journey
          </p>

          {/* Social Logins */}
          <div className="space-y-3 mb-6">
            <button
  type="button"
  onClick={handleGoogleLogin}
  disabled={loading}
  className={`w-full flex items-center justify-center gap-3 py-3 px-4 
    bg-card border border-border rounded-xl transition-all
    ${
      loading
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
    {loading ? "Signing in..." : "Continue with Google"}
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
              <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (document.querySelector('input[type="password"]') as HTMLInputElement)?.focus();
                    }
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => {
    setPassword(e.target.value);
    setPasswordError(""); // clear error while typing
  }}
  disabled={loading}
  className={`w-full pl-12 pr-12 py-3 bg-muted/50 rounded-xl text-sm placeholder:text-muted-foreground 
    focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
    ${
      passwordError
        ? "border-2 border-red-600 focus:ring-red-600 focus:border-red-600"
        : "border border-border focus:ring-primary/50 focus:border-primary/50"
    }
  `}
  placeholder="Enter your password"
  required
/>


                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-red-600 text-base font-semibold mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-muted/50 text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 
                ${
                  loading || !email.trim() || !password.trim()
                    ? "bg-primary/60 cursor-not-allowed text-primary-foreground"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={heroBanner}
          alt="Cyber Renaissance"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-3xl font-display font-bold mb-3 text-foreground">
            The <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Cyber Renaissance</span>
            <br />
            Has Arrived
          </h2>
          <p className="text-muted-foreground">
            Join millions of creators transforming their imagination into reality with AI-powered tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
