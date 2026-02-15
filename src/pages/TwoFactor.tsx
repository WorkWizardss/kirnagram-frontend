import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";

const TwoFactor = () => {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Request OTP
  const handleRequestOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();
      const res = await fetch("http://127.0.0.1:8000/2fa/request", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code.",
        duration: 2000,
      });
      setStep(2);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();
      const res = await fetch("http://127.0.0.1:8000/2fa/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to verify OTP");
      toast({
        title: "2FA Verified",
        description: "Two-factor authentication successful.",
        duration: 2000,
      });
      setTimeout(() => navigate("/settings"), 1000);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar with back button and title */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-background/80 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-display font-bold ml-2">Two Factor Verification</h1>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="max-w-md mx-auto w-full">
          {step === 1 ? (
            <div className="space-y-6">
              <Shield className="w-10 h-10 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-display font-bold text-center mb-2">Enable Two Factor Authentication</h2>
              <p className="text-muted-foreground text-center mb-6">Click below to send a verification code to your email.</p>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${loading ? "bg-primary/60 cursor-not-allowed text-primary-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"}`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {error && <p className="text-red-600 text-center mt-2">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <Shield className="w-10 h-10 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-display font-bold text-center mb-2">Enter Verification Code</h2>
              <p className="text-muted-foreground text-center mb-6">Check your email for the 6-digit code.</p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                disabled={loading}
                className="w-full py-3 px-4 bg-muted/50 border border-border rounded-xl text-center text-lg tracking-widest font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${loading || otp.length !== 6 ? "bg-primary/60 cursor-not-allowed text-primary-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"}`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              {error && <p className="text-red-600 text-center mt-2">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactor;
