import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader, ArrowLeft, ArrowRight } from "lucide-react";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "New passwords must match.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("User not authenticated");
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({
        title: "Password changed",
        description: "Your password has been updated.",
        duration: 2000,
      });
      setTimeout(() => navigate("/settings"), 1000);
    } catch (error: any) {
      let msg = error.message || "Failed to change password.";
      if (error.code === "auth/wrong-password") msg = "Old password is incorrect.";
      toast({
        title: "Error",
        description: msg,
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
        <h1 className="text-xl font-display font-bold ml-2">Change Password</h1>
      </div>
      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Old Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Enter your old password"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Retype New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Retype your new password"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${loading ? "bg-primary/60 cursor-not-allowed text-primary-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                Change Password
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-primary hover:underline text-sm"
              onClick={() => navigate("/forgot-password")}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
