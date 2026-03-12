import { MainLayout } from "@/components/layout/MainLayout";
import { Globe, MapPin, MessageCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publisherApi } from "@/lib/publisherApi";

const PublisherBusinessProfile = () => {
  const { publisherId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await publisherApi.getPublisherProfile(publisherId);
        setData(res);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load business profile");
      } finally {
        setLoading(false);
      }
    };

    if (publisherId) {
      run();
    }
  }, [publisherId]);

  if (loading) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="max-w-4xl mx-auto p-6"><p className="text-muted-foreground">Loading business profile...</p></div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout showRightSidebar={true}>
        <div className="max-w-4xl mx-auto p-6"><p className="text-red-500">{error || "Profile not available"}</p></div>
      </MainLayout>
    );
  }

  const profile = data.business_profile || {};
  const owner = data.publisher || {};

  return (
    <MainLayout showRightSidebar={true}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">{profile.business_name || "Business"}</h1>
          <p className="text-muted-foreground">Publisher Business Profile</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3 flex items-center gap-2"><UserRound className="w-4 h-4" /> <span className="text-sm">Owner: {owner.full_name || "N/A"}</span></div>
            <div className="rounded-xl border border-border p-3 flex items-center gap-2"><MessageCircle className="w-4 h-4" /> <span className="text-sm">WhatsApp: {profile.whatsapp || "N/A"}</span></div>
            <div className="rounded-xl border border-border p-3 flex items-center gap-2"><Globe className="w-4 h-4" /> <span className="text-sm">Website: {profile.website || "N/A"}</span></div>
            <div className="rounded-xl border border-border p-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> <span className="text-sm">Address: {profile.address || "N/A"}</span></div>
          </div>

          <div className="mt-5">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.about || "No business bio yet."}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublisherBusinessProfile;
