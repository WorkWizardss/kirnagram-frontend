import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { publisherApi } from "@/lib/publisherApi";
import { useNavigate } from "react-router-dom";

type Campaign = {
  _id: string;
  publisher_id: string;
  ad_name: string;
  business_name?: string;
  logo_url?: string;
  photo_preview_url?: string;
  video_preview_url?: string;
  video_duration_seconds?: number;
  website_url?: string;
  target_audience: string;
  target_region: string[];
  budget_mode: "custom" | "package";
  ad_type?: "standard" | "full";
  days_left: number;
  status: string;
  metrics: { views: number; detail_clicks: number };
};

const packagePresets = [
  { key: "standard-monthly", name: "Standard Monthly", days: 30, total: 1485 },
  { key: "standard-quarterly", name: "Standard Quarterly", days: 90, total: 3960 },
  { key: "standard-yearly", name: "Standard Yearly", days: 365, total: 14053 },
  { key: "full-monthly", name: "Full Video Monthly", days: 30, total: 2025 },
  { key: "full-quarterly", name: "Full Video Quarterly", days: 90, total: 5400 },
  { key: "full-yearly", name: "Full Video Yearly", days: 365, total: 19163 },
];

const PublisherAdsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [adName, setAdName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("General Public");
  const [targetRegion, setTargetRegion] = useState("Urban");
  const [budgetMode, setBudgetMode] = useState<"custom" | "package">("custom");
  const [adType, setAdType] = useState<"standard" | "full">("standard");
  const [customBudget, setCustomBudget] = useState("2000");
  const [packageKey, setPackageKey] = useState(packagePresets[0].key);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const customDailyPrice = adType === "standard" ? 55 : 75;
  const calculatedDays = Math.max(1, Math.floor((Number(customBudget) || 0) / customDailyPrice));
  const selectedPackage = packagePresets.find((p) => p.key === packageKey) || packagePresets[0];
  const totalAmount = budgetMode === "custom" ? Math.ceil(Number(customBudget) || 0) : selectedPackage.total;

  const campaigns: Campaign[] = summary?.campaigns || [];

  const chartRows = useMemo(() => campaigns.slice(0, 6), [campaigns]);

  const load = async () => {
    try {
      setLoading(true);
      const access = await publisherApi.getAccess();
      if (!access?.is_publisher) {
        navigate("/become-publisher/apply");
        return;
      }

      const [dashboardSummary, businessProfile] = await Promise.all([
        publisherApi.getDashboardSummary(),
        publisherApi.getMyBusinessProfile(),
      ]);
      setSummary(dashboardSummary);
      setProfile(businessProfile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublishAd = async () => {
    try {
      setIsSaving(true);
      if (!adName.trim()) {
        throw new Error("Ad name is required");
      }
      if (!businessName.trim()) {
        throw new Error("Business name is required");
      }
      if (videoDurationSeconds && videoDurationSeconds > 120) {
        throw new Error("Video must be 2 minutes or less");
      }

      // Upload files if provided
      setIsUploading(true);
      let finalLogoUrl = logoUrl;
      let finalPhotoUrl = photoPreviewUrl;
      let finalVideoUrl = videoPreviewUrl;

      if (logoFile) {
        const logoResult = await publisherApi.uploadAdLogo(logoFile);
        finalLogoUrl = logoResult.logo_url;
      }
      if (photoFile) {
        const photoResult = await publisherApi.uploadAdPhoto(photoFile);
        finalPhotoUrl = photoResult.photo_url;
      }
      if (videoFile) {
        const videoResult = await publisherApi.uploadAdVideo(videoFile);
        finalVideoUrl = videoResult.video_url;
      }
      setIsUploading(false);

      // Show preview modal
      setShowPreview(true);
      
      // Store uploaded URLs for preview
      setLogoUrl(finalLogoUrl);
      setPhotoPreviewUrl(finalPhotoUrl);
      setVideoPreviewUrl(finalVideoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to prepare ad");
      setIsUploading(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndPay = async () => {
    try {
      setIsProcessingPayment(true);

      // Create payment order
      const orderResponse = await publisherApi.createPaymentOrder({
        ad_name: adName.trim(),
        business_name: businessName.trim(),
        total_amount: totalAmount * 100, // Convert to paise
        duration_days: budgetMode === "custom" ? calculatedDays : selectedPackage.days,
        budget_mode: budgetMode,
      });

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: orderResponse.razorpay_key,
          order_id: orderResponse.order_id,
          amount: orderResponse.amount,
          currency: orderResponse.currency,
          name: "Kirnagram",
          description: adName,
          handler: async (response: any) => {
            try {
              // Verify payment and create campaign
              await publisherApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              // Create campaign after payment
              if (budgetMode === "custom") {
                await publisherApi.createCampaign({
                  ad_name: adName.trim(),
                  business_name: businessName.trim(),
                  logo_url: logoUrl || undefined,
                  photo_preview_url: photoPreviewUrl || undefined,
                  video_preview_url: videoPreviewUrl || undefined,
                  video_duration_seconds: videoDurationSeconds,
                  description: description.trim() || undefined,
                  website_url: websiteUrl.trim() || undefined,
                  target_audience: targetAudience,
                  target_region: [targetRegion],
                  budget_mode: "custom",
                  ad_type: adType,
                  custom_budget: Number(customBudget),
                });
              } else {
                await publisherApi.createCampaign({
                  ad_name: adName.trim(),
                  business_name: businessName.trim(),
                  logo_url: logoUrl || undefined,
                  photo_preview_url: photoPreviewUrl || undefined,
                  video_preview_url: videoPreviewUrl || undefined,
                  video_duration_seconds: videoDurationSeconds,
                  description: description.trim() || undefined,
                  website_url: websiteUrl.trim() || undefined,
                  target_audience: targetAudience,
                  target_region: [targetRegion],
                  budget_mode: "package",
                  ad_type: adType,
                  package_name: selectedPackage.name,
                  package_duration_days: selectedPackage.days,
                  package_total_budget: selectedPackage.total,
                });
              }

              // Clear form and close modals
              setShowPreview(false);
              setIsModalOpen(false);
              setAdName("");
              setBusinessName("");
              setLogoUrl("");
              setLogoFile(null);
              setPhotoPreviewUrl("");
              setPhotoFile(null);
              setVideoPreviewUrl("");
              setVideoFile(null);
              setVideoDurationSeconds(undefined);
              setDescription("");
              setWebsiteUrl("");
              await load();
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create campaign after payment");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: orderResponse.user_name,
            email: orderResponse.user_email,
            contact: orderResponse.user_phone,
          },
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.head.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payment");
      setIsProcessingPayment(false);
    }
  };

  const handleDetailsClick = async (campaign: Campaign) => {
    try {
      await publisherApi.trackDetailClick(campaign._id);
    } catch {
      // no-op
    }

    if (campaign.website_url) {
      window.open(campaign.website_url, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(`/publisher/business-profile/${campaign.publisher_id}`);
  };

  if (loading) {
    return <MainLayout showRightSidebar={true}><div className="max-w-6xl mx-auto p-6"><p className="text-muted-foreground">Loading ads management...</p></div></MainLayout>;
  }

  return (
    <MainLayout showRightSidebar={true}>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Ads Management</h1>
            <p className="text-muted-foreground text-sm">Publisher dashboard with campaign analytics and business profile.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/become-publisher/packages")} className="px-4 py-2 rounded-lg border border-border bg-card text-foreground">Packages</button>
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold">Publish Ad</button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Total Campaigns</p><p className="text-2xl font-bold">{summary?.total_campaigns || 0}</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Active Campaigns</p><p className="text-2xl font-bold">{summary?.active_campaigns || 0}</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Ad Views</p><p className="text-2xl font-bold">{summary?.total_views || 0}</p></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Detail Clicks</p><p className="text-2xl font-bold">{summary?.total_detail_clicks || 0}</p></div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-semibold mb-3">Campaign Performance Graph</h2>
          <div className="space-y-2">
            {chartRows.length === 0 ? <p className="text-sm text-muted-foreground">No campaigns yet.</p> : chartRows.map((row) => {
              const max = Math.max(1, ...(chartRows.map((r) => r.metrics.views)));
              const width = Math.max(8, Math.round((row.metrics.views / max) * 100));
              return (
                <div key={row._id} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{row.ad_name}</span><span>{row.metrics.views} views</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:p-5 overflow-x-auto">
          <h2 className="font-semibold mb-3">All Ads</h2>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Business</th>
                <th className="text-left py-2">Preview</th>
                <th className="text-left py-2">Days Left</th>
                <th className="text-left py-2">Views</th>
                <th className="text-left py-2">Detail Clicks</th>
                <th className="text-left py-2">Insights</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b border-border/60">
                  <td className="py-2">{campaign.ad_name}</td>
                  <td className="py-2">{campaign.business_name || "N/A"}</td>
                  <td className="py-2">{campaign.photo_preview_url || campaign.video_preview_url ? <a href={campaign.photo_preview_url || campaign.video_preview_url} target="_blank" rel="noreferrer" className="text-primary underline">Open</a> : <span className="text-muted-foreground">N/A</span>}</td>
                  <td className="py-2">{campaign.days_left}</td>
                  <td className="py-2">{campaign.metrics.views}</td>
                  <td className="py-2">{campaign.metrics.detail_clicks}</td>
                  <td className="py-2">
                    <button onClick={() => handleDetailsClick(campaign)} className="px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-semibold mb-2">Business Profile</h2>
          <p className="text-sm text-muted-foreground">{profile?.business_name || "Business"} {profile?.whatsapp ? `• WhatsApp: ${profile.whatsapp}` : ""}</p>
          <p className="text-sm text-muted-foreground mt-1">{profile?.about || "Add your profile details so users can view business information when website is unavailable."}</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center overflow-y-auto" onClick={() => !isSaving && !isUploading && setIsModalOpen(false)}>
          <div className="w-full max-w-3xl rounded-2xl bg-card border border-border p-5 my-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Create New Ad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 max-h-[60vh] overflow-y-auto">
              <input value={adName} onChange={(e) => setAdName(e.target.value)} placeholder="Ad title" className="rounded-xl border border-border bg-muted/40 px-3 py-2.5" />
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" className="rounded-xl border border-border bg-muted/40 px-3 py-2.5" />
              
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Business Logo</label>
                <div className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoFile(file);
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer flex-1 text-sm">
                    {logoFile ? logoFile.name : "Upload logo..."}
                  </label>
                  {logoFile && (
                    <button
                      onClick={() => setLogoFile(null)}
                      className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Photo Preview</label>
                <div className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPhotoFile(file);
                    }}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer flex-1 text-sm">
                    {photoFile ? photoFile.name : "Upload photo..."}
                  </label>
                  {photoFile && (
                    <button
                      onClick={() => setPhotoFile(null)}
                      className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Video (max 2 mins)</label>
                <div className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVideoFile(file);
                        // Try to get video duration from file metadata
                        const video = document.createElement('video');
                        video.src = URL.createObjectURL(file);
                        video.onloadedmetadata = () => {
                          setVideoDurationSeconds(Math.round(video.duration));
                        };
                      }
                    }}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="cursor-pointer flex-1 text-sm">
                    {videoFile ? videoFile.name : "Upload video..."}
                  </label>
                  {videoFile && (
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoDurationSeconds(undefined);
                      }}
                      className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Business website (optional)" className="rounded-xl border border-border bg-muted/40 px-3 py-2.5" />
              
              <input 
                type="number"
                value={videoDurationSeconds ?? ""} 
                onChange={(e) => setVideoDurationSeconds(e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="Video duration (seconds, auto-detected)" 
                className="rounded-xl border border-border bg-muted/40 px-3 py-2.5" 
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <option value="">Select audience...</option>
                  <option value="Students">Students</option>
                  <option value="Office Workers">Office Workers</option>
                  <option value="Business Owners">Business Owners</option>
                  <option value="Families">Families</option>
                  <option value="Senior Citizens">Senior Citizens</option>
                  <option value="General Public">General Public</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Target Region</label>
                <select value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <option value="">Select region...</option>
                  <option value="North Zone">North Zone</option>
                  <option value="South Zone">South Zone</option>
                  <option value="East Zone">East Zone</option>
                  <option value="West Zone">West Zone</option>
                  <option value="Central">Central</option>
                  <option value="Urban">Urban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ad description" className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 md:col-span-2 min-h-[90px]" />

              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2">Ad Type</p>
                <div className="flex gap-2">
                  <button onClick={() => setAdType("standard")} className={adType === "standard" ? "px-3 py-2 rounded-lg bg-primary text-primary-foreground" : "px-3 py-2 rounded-lg border border-border"}>Standard (₹55/day)</button>
                  <button onClick={() => setAdType("full")} className={adType === "full" ? "px-3 py-2 rounded-lg bg-primary text-primary-foreground" : "px-3 py-2 rounded-lg border border-border"}>Full (₹75/day)</button>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2">Payment Mode</p>
                <div className="flex gap-2">
                  <button onClick={() => setBudgetMode("custom")} className={budgetMode === "custom" ? "px-3 py-2 rounded-lg bg-primary text-primary-foreground" : "px-3 py-2 rounded-lg border border-border"}>Custom Budget</button>
                  <button onClick={() => setBudgetMode("package")} className={budgetMode === "package" ? "px-3 py-2 rounded-lg bg-primary text-primary-foreground" : "px-3 py-2 rounded-lg border border-border"}>Package</button>
                </div>
              </div>

              {budgetMode === "custom" ? (
                <>
                  <input value={customBudget} onChange={(e) => setCustomBudget(e.target.value)} placeholder="Budget amount (₹)" type="number" className="rounded-xl border border-border bg-muted/40 px-3 py-2.5" />
                  <input value={`₹${customDailyPrice}`} readOnly placeholder="Daily price" className="rounded-xl border border-border bg-muted/20 px-3 py-2.5" />
                  <input value={Number.isFinite(calculatedDays) ? `${calculatedDays} days` : "0 days"} readOnly placeholder="Run days" className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 md:col-span-1" />
                </>
              ) : (
                <div className="md:col-span-2">
                  <select value={packageKey} onChange={(e) => setPackageKey(e.target.value)} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                    {packagePresets.map((pkg) => (
                      <option key={pkg.key} value={pkg.key}>{pkg.name} - {pkg.days} days - ₹{pkg.total}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving || isUploading} className="px-4 py-2 rounded-lg border border-border">Cancel</button>
              <button onClick={handlePublishAd} disabled={isSaving || isUploading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground">{isUploading ? "Uploading..." : isSaving ? "Processing..." : "Review & Pay"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center overflow-y-auto" onClick={() => !isProcessingPayment && setShowPreview(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 my-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-semibold mb-4">Ad Preview & Confirmation</h3>
            
            <div className="space-y-4 mb-6">
              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-1">Ad Title</p>
                <p className="font-semibold">{adName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-1">Business Name</p>
                  <p className="font-semibold">{businessName}</p>
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-1">Ad Type</p>
                  <p className="font-semibold capitalize">{adType} (₹{customDailyPrice}/day)</p>
                </div>
              </div>

              {(logoUrl || photoPreviewUrl || videoPreviewUrl) && (
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-2">Media</p>
                  <div className="flex gap-2 flex-wrap">
                    {logoUrl && <a href={logoUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">View Logo</a>}
                    {photoPreviewUrl && <a href={photoPreviewUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">View Photo</a>}
                    {videoPreviewUrl && <a href={videoPreviewUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">View Video</a>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-1">Target Audience</p>
                  <p className="font-semibold">{targetAudience}</p>
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-1">Target Region</p>
                  <p className="font-semibold">{targetRegion}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-1">Payment Summary</p>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <p className="text-sm">{budgetMode === "custom" ? `${calculatedDays} days @ ₹${customDailyPrice}/day` : `${selectedPackage.name} (${selectedPackage.days} days)`}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">₹{totalAmount}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPreview(false)} disabled={isProcessingPayment} className="px-4 py-2 rounded-lg border border-border">Back to Edit</button>
              <button onClick={handleConfirmAndPay} disabled={isProcessingPayment} className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold">{isProcessingPayment ? "Processing..." : "Proceed to Payment"}</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default PublisherAdsDashboard;
