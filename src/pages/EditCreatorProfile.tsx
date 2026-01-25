import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, User, FileText, Instagram, Youtube, Facebook, Camera, Save, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import avatar2 from "@/assets/avatar-2.jpg";

const EditCreatorProfile = () => {
  const [avatar, setAvatar] = useState<string>(avatar2);
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto px-3 md:px-0 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            to="/ai-creator" 
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-display font-bold">Edit Creator Profile</h1>
            <p className="text-sm text-muted-foreground">Update your creator information</p>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-r from-primary to-secondary">
              <img
                src={avatar}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-background"
              />
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              <Camera className="w-5 h-5 text-primary-foreground" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Display Name */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Display Name</label>
            </div>
            <input 
              type="text" 
              placeholder="Your creator name" 
              defaultValue="Elara Vance"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          {/* Bio */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-secondary" />
              <label className="text-sm font-medium">Bio</label>
            </div>
            <textarea 
              rows={3} 
              placeholder="Tell us about your AI art style and what inspires you..."
              defaultValue="AI Artist & Digital Creator 🎨 Exploring the intersection of technology and creativity."
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
            <p className="text-xs text-muted-foreground mt-2">Max 200 characters</p>
          </div>

          {/* Website */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="w-4 h-4 text-green-500" />
              <label className="text-sm font-medium">Website</label>
            </div>
            <input 
              type="url" 
              placeholder="https://yourwebsite.com" 
              defaultValue="https://elaravance.art"
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
          </div>

          {/* Social Links */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-medium mb-4">Social Media Links</h3>
            <div className="space-y-3">
              <div className="relative">
                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                <input 
                  type="text" 
                  placeholder="@username" 
                  defaultValue="@elaravance"
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input 
                  type="text" 
                  placeholder="Channel URL" 
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
              <div className="relative">
                <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="text" 
                  placeholder="Profile URL" 
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default EditCreatorProfile;
