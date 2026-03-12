import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { auth } from "@/firebase";
import { fetchCreditsSummary } from "@/lib/creditsApi";
import { cn } from "@/lib/utils";
import { Download, Image as ImageIcon, Sparkles, Upload } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

type PromptDetail = {
  _id: string;
  unit_id?: string | null;
  style_name?: string;
  prompt_description?: string;
  description?: string;
  prompt?: string;
  prompt_text?: string;
  ai_model?: "chatgpt" | "gemini" | "both";
  image_url?: string;
  tags?: string[];
};

const uiQualityOptions = ["low", "medium", "high"] as const;

type RemixSourceState = {
  returnTo?: string;
  fromPostId?: string;
  returnScrollY?: number;
};

const mapQualityForModel = (
  model: "chatgpt" | "gemini",
  uiQuality: string
) => {
  const normalized = (uiQuality || "").toLowerCase();
  if (model === "gemini") {
    if (normalized === "low") return "fast";
    if (normalized === "high") return "ultra";
    return "standard";
  }

  if (normalized === "fast") return "low";
  if (normalized === "ultra") return "high";
  if (normalized === "standard") return "medium";
  return normalized || "medium";
};

const Remix = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { promptId } = useParams();
  const [prompt, setPrompt] = useState<PromptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [ratio, setRatio] = useState("9:16");
  const [quality, setQuality] = useState<string>("medium");
  const [burnCost, setBurnCost] = useState<number | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [remixId, setRemixId] = useState<string | null>(null);
  const [resolvedModel, setResolvedModel] = useState<"chatgpt" | "gemini">("chatgpt");
  const [downloading, setDownloading] = useState(false);
  const sourceState = (location.state || null) as RemixSourceState | null;

  const handleBack = () => {
    if (sourceState?.returnTo) {
      navigate(sourceState.returnTo, {
        replace: true,
        state: {
          fromRemix: true,
          focusPostId: sourceState.fromPostId,
          restoreScrollY: sourceState.returnScrollY,
        },
      });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  const fetchWithFreshToken = async (url: string, init?: RequestInit) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not logged in");
    }

    let token = await user.getIdToken();
    let response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 401) {
      return response;
    }

    token = await user.getIdToken(true);
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  };

  useEffect(() => {
    const loadPrompt = async () => {
      if (!promptId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchWithFreshToken(`${API_BASE}/ai-creator/prompts/${promptId}`);
        if (!res.ok) throw new Error("Failed to load prompt");
        const data = await res.json();
        setPrompt(data);
        const aiModel = (data.ai_model || "chatgpt").toLowerCase();
        const resolved = aiModel === "gemini" || aiModel === "both" ? "gemini" : "chatgpt";
        setResolvedModel(resolved);
        setQuality("medium");
      } catch (error) {
        toast({
          title: "Remix",
          description: error instanceof Error ? error.message : "Failed to load prompt",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPrompt();
  }, [promptId]);

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const summary = await fetchCreditsSummary();
        const rates = summary?.burn_rates || {};
        const backendQuality = mapQualityForModel(resolvedModel, quality);
        const rate = rates?.[resolvedModel]?.[backendQuality];
        if (typeof rate === "number") setBurnCost(rate);
        else setBurnCost(null);
      } catch {
        setBurnCost(null);
      }
    };

    loadCredits();
  }, [quality, resolvedModel]);

  const promptInfo = useMemo(() => {
    if (!prompt) return { style: "", description: "", image: "" };
    return {
      style: prompt.style_name || "Prompt Style",
      description:
        prompt.prompt_description ||
        prompt.description ||
        prompt.prompt ||
        prompt.prompt_text ||
        "",
      image: prompt.image_url || "",
    };
  }, [prompt]);

  const tagsLabel = useMemo(() => {
    if (!prompt?.tags?.length) return "";
    return prompt.tags.join(", ");
  }, [prompt]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => setUploadedPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !promptId) return;
    try {
      setGenerating(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      // Simple prompt like ChatGPT/Gemini app: just the style + description
      const promptText = [
        promptInfo.style ? `${promptInfo.style}` : "",
        promptInfo.description ? `. ${promptInfo.description}` : "",
      ].join("").trim();

      const formData = new FormData();
      const backendQuality = mapQualityForModel(resolvedModel, quality);
      formData.append("prompt_id", promptId);
      formData.append("ratio", ratio);
      formData.append("quality", backendQuality);
      formData.append("model", resolvedModel);
      formData.append("prompt_text", promptText);
      formData.append("image", uploadedFile);

      const res = await fetch(`${API_BASE}/remix/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to generate remix");
      }

      const data = await res.json();
      if (!data?.success || !data?.image_url) {
        throw new Error(data?.error || "Failed to generate remix");
      }

      try {
        const watermarked = await addWatermarkToImage(data.image_url);
        setOutputUrl(watermarked);
      } catch {
        setOutputUrl(data.image_url);
      }
      setRemixId(data.remix_id || null);

      // 🔥 REFRESH PROMPT DATA (IMPORTANT)
      const updatedPromptRes = await fetchWithFreshToken(
        `${API_BASE}/ai-creator/prompts/${promptId}`
      );
      if (updatedPromptRes.ok) {
        const updatedPrompt = await updatedPromptRes.json();
        setPrompt(updatedPrompt);
      }

      toast({
        title: "Remix ready",
        description: "Your remix is generated and ready to use.",
      });
    } catch (error) {
      toast({
        title: "Remix failed",
        description: error instanceof Error ? error.message : "Generation failed",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Adds Kirnagram logo + website text at the bottom-left of the provided image URL.
   * - Tries to fetch the image as a Blob and draw to a canvas (avoids taint where possible).
   * - Looks for a logo at `/kirnagram-logo.png` in the public folder; if missing, only text will be drawn.
   * - Returns a data URL (png) of the watermarked image.
   */
  async function addWatermarkToImage(src: string): Promise<string> {
    const loadImage = (urlOrBlob: string | Blob) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        if (typeof urlOrBlob === "string") {
          img.crossOrigin = "anonymous";
          img.src = urlOrBlob;
        } else {
          img.src = URL.createObjectURL(urlOrBlob);
        }
      });

    // fetch main image as blob to improve chance of clean canvas draw
    const imgResp = await fetch(src);
    if (!imgResp.ok) throw new Error("Failed to fetch image for watermarking");
    const imgBlob = await imgResp.blob();
    const img = await loadImage(imgBlob);

    // create canvas scaled by devicePixelRatio for crisper output
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * dpr);
    canvas.height = Math.round(img.height * dpr);
    canvas.style.width = `${img.width}px`;
    canvas.style.height = `${img.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.scale(dpr, dpr);

    // draw original image
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const padding = Math.max(12, Math.round(img.width * 0.02));
    const maxLogoWidth = Math.round(img.width * 0.12);
    let logoDrawn = false;

    // try to load logo from public folder; skip if missing
    try {
      const logo = await loadImage("/kirnagram-logo.png");
      const logoRatio = logo.width / logo.height;
      let logoW = maxLogoWidth;
      let logoH = Math.round(logoW / logoRatio);
      if (logoH > img.height * 0.18) {
        logoH = Math.round(img.height * 0.18);
        logoW = Math.round(logoH * logoRatio);
      }
      const logoX = padding; // bottom-left corner
      const logoY = img.height - logoH - padding;

      ctx.globalAlpha = 0.98;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      ctx.globalAlpha = 1;
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }

    // draw website text to the right of logo (or at padding if no logo)
    const text = "www.kirnagram.com";
    const fontSize = Math.max(14, Math.min(32, Math.round(img.width * 0.035)));
    ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textBaseline = "alphabetic";

    const textX = logoDrawn ? padding + Math.round(maxLogoWidth) + Math.round(padding * 0.5) : padding;
    const textY = img.height - padding; // baseline at bottom padding

    // subtle shadow for contrast
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillText(text, textX + 1, textY + 1);

    // white, semi-opaque text
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(text, textX, textY);

    return canvas.toDataURL("image/png");
  }

  if (loading) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="max-w-4xl mx-auto py-16 text-center text-muted-foreground">
          Loading remix...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={true}>
      <div className="max-w-4xl mx-auto pb-24 md:pb-8 space-y-6">
        <div className="flex flex-col gap-2 pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Remix Studio</p>
          <div className="w-full flex justify-start">
            <Button variant="ghost" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Card className="glass-card border border-border/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Original Style</p>
                  <p className="font-semibold text-foreground">{promptInfo.style}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                  {resolvedModel === "chatgpt" ? "ChatGPT" : "Gemini"}
                </span>
              </div>
              {prompt?.unit_id && (
                <p className="text-xs text-muted-foreground">Prompt ID: {prompt.unit_id}</p>
              )}
              {tagsLabel && (
                <p className="text-xs text-muted-foreground">Tags: {tagsLabel}</p>
              )}
              <div className="w-full flex items-center justify-center min-h-[220px] bg-gradient-to-br from-muted/60 to-background rounded-xl border border-border/60 shadow-lg overflow-hidden">
                {promptInfo.image ? (
                  <img
                    src={promptInfo.image}
                    alt="Prompt sample"
                    className="max-w-full max-h-72 object-contain rounded-xl transition-transform duration-200 hover:scale-105 shadow-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-56 text-muted-foreground">
                    <span className="text-3xl mb-2">🖼️</span>
                    <span className="text-sm">No sample image</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="glass-card border border-border/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Image</p>
                  <p className="font-semibold text-foreground">Upload a photo</p>
                </div>
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              {uploadedPreview ? (
                <div className="relative">
                  <img
                    src={uploadedPreview}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setUploadedPreview(null);
                    }}
                    className="absolute top-3 right-3 px-3 py-1 bg-background/80 rounded-full text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Tap to upload</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG or JPG up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </label>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="glass-card border border-border/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generation Settings</p>
                  <p className="font-semibold text-foreground">Quality & Ratio</p>
                </div>
                <span className="text-xs text-muted-foreground">Auto model</span>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ratio</p>
                <div className="grid grid-cols-2 gap-2">
                  {["9:16", "16:9"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRatio(value)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-sm",
                        ratio === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 hover:bg-muted/60"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quality</p>
                <div className="grid grid-cols-3 gap-2">
                  {uiQualityOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setQuality(value)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs uppercase",
                        quality === value
                          ? "border-secondary bg-secondary/20 text-secondary-foreground"
                          : "border-border bg-muted/40 hover:bg-muted/60"
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Credits burn</span>
                <span className="text-sm font-semibold text-foreground">
                  {burnCost ?? "--"} credits
                </span>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!uploadedFile || generating}
                className="w-full bg-gradient-to-r from-secondary to-accent text-secondary-foreground"
              >
                {generating ? "Generating..." : "Generate Remix"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Credits are burned when generation starts.
              </p>
            </Card>

            {outputUrl && (
              <Card className="glass-card border border-border/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Output</p>
                    <p className="font-semibold text-foreground">Your remix is ready</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <img
                  src={outputUrl}
                  alt="Remix output"
                  className="w-full max-h-[500px] object-contain bg-black rounded-xl"
                  style={{ aspectRatio: ratio }}
                />
                <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  disabled={downloading}
                  onClick={async () => {
                    setDownloading(true);
                    try {
                      if (!remixId) {
                        alert("Invalid remix ID");
                        setDownloading(false);
                        return;
                      }

                      const user = auth.currentUser;
                      if (!user) {
                        alert("Please login");
                        setDownloading(false);
                        return;
                      }

                      const token = await user.getIdToken();

                      const response = await fetch(
                        `${import.meta.env.VITE_API_BASE}/remix/download/${remixId}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );

                      if (!response.ok) {
                        throw new Error("Download failed");
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);

                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `kirnagram-remix-${remixId}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      window.URL.revokeObjectURL(url);

                    } catch (error) {
                      alert("Failed to download image.");
                    } finally {
                      setDownloading(false);
                    }
                  }}
                >
                  {downloading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-t-transparent border-primary rounded-full mr-2"></span>
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {downloading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  onClick={() => navigate("/create", { state: { imageUrl: outputUrl } })}
                  className="w-full"
                >
                  Add to Post
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/story/upload", { state: { imageUrl: outputUrl } })}
                  className="w-full"
                >
                  Add to Story
                </Button>
                </div>
                </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Remix;
