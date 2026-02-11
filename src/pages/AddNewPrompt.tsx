import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Upload, Image, Type, FileText, Sparkles, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { auth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const API_BASE = "http://127.0.0.1:8000";

const AddNewPrompt = () => {
  const { toast } = useToast();
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [styleName, setStyleName] = useState("");
  const [promptDescription, setPromptDescription] = useState("");
  const [aiModel, setAiModel] = useState<"chatgpt" | "gemini" | "both" | "">("");
  const [tags, setTags] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSampleFile(file);
      const reader = new FileReader();
      reader.onload = () => setSampleImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!styleName.trim() || !promptDescription.trim() || !aiModel) {
      toast({
        title: "Missing details",
        description: "Please fill style name, prompt description, and AI model.",
        variant: "destructive",
      });
      return;
    }

    if (!sampleFile) {
      toast({
        title: "Add a sample image",
        description: "Please upload a sample image before submitting.",
        variant: "destructive",
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be signed in to submit a prompt.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("style_name", styleName.trim());
      formData.append("prompt_description", promptDescription.trim());
      formData.append("ai_model", aiModel);
      formData.append("tags", tags.trim());
      formData.append("image", sampleFile);

      const res = await fetch(`${API_BASE}/ai-creator/prompts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to submit prompt");
      }

      setSubmitted(true);
      toast({
        title: "Prompt submitted",
        description: "Your prompt was sent for review.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-3">Prompt Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Your new AI style prompt has been submitted for review. We'll notify you once it's approved.
            </p>
            <div className="flex gap-3 justify-center">
              <Link 
                to="/ai-creator/prompts"
                className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                View My Prompts
              </Link>
              <Link 
                to="/ai-creator"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto px-3 md:px-0 pb-24 md:pb-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            to="/ai-creator" 
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Add New Prompt</h1>
            <p className="text-sm text-muted-foreground">Create a new AI style</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Style Name */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Style Name</label>
            </div>
            <input 
              type="text" 
              placeholder="e.g., Neon Cyberpunk" 
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
            <p className="text-xs text-muted-foreground mt-2">Choose a unique, descriptive name</p>
          </div>

          {/* AI Model */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <label className="text-sm font-medium">AI Model</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "ChatGPT", value: "chatgpt" },
                { label: "Gemini", value: "gemini" },
                { label: "Both", value: "both" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAiModel(option.value as "chatgpt" | "gemini" | "both")}
                  className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                    aiModel === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Text */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-green-500" />
              <label className="text-sm font-medium">Prompt Description</label>
            </div>
            <textarea 
              rows={4} 
              placeholder="Describe your AI style in detail. Include colors, mood, effects, and any specific instructions..."
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" 
            />
            <p className="text-xs text-muted-foreground mt-2">Be descriptive for best results</p>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-blue-500" />
              <label className="text-sm font-medium">Tags</label>
            </div>
            <input
              type="text"
              placeholder="e.g., neon, cyberpunk, city"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-2">Comma-separated tags</p>
          </div>

          {/* Sample Image */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-pink-500" />
              <label className="text-sm font-medium">Sample Image</label>
            </div>
            
            {sampleImage ? (
              <div className="relative">
                <img 
                  src={sampleImage} 
                  alt="Sample" 
                  className="w-full h-48 object-cover rounded-xl" 
                />
                <button 
                  onClick={() => {
                    setSampleImage(null);
                    setSampleFile(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-full text-xs hover:bg-background"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">Upload sample image</span>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Tips */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tips for approval
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Use high-quality sample images</li>
              <li>• Write clear, detailed descriptions</li>
              <li>• Choose an appropriate category</li>
              <li>• Make your style unique and creative</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default AddNewPrompt;
