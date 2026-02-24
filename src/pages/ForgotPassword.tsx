import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Loader, ArrowRight, Sparkles } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";
import heroBanner from "@/assets/hero-banner.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset link sent!",
        description: "Check your email for a password reset link.",
        duration: 3000,
      });
      setTimeout(() => navigate("/login"), 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Left Panel - Image */}
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
      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-background relative overflow-x-hidden">
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
          <h1 className="text-3xl font-display font-bold mb-2 text-foreground">Forgot Password?</h1>
          <p className="text-muted-foreground mb-8">
            Enter your email and we'll send you a reset link.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${loading || !email.trim() ? "bg-primary/60 cursor-not-allowed text-primary-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"}`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          <p className="text-center text-muted-foreground text-sm mt-8">
            Remembered your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
