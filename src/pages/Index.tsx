import { MainLayout } from "@/components/layout/MainLayout";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { HeroBanner } from "@/components/feed/HeroBanner";
import { FeedPost } from "@/components/feed/FeedPost";
import { StoriesRow } from "@/components/feed/StoriesRow";
import cyberGirl from "@/assets/cyber-girl.jpg";
import avatar1 from "@/assets/avatar-1.jpg";

const Index = () => {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Mobile Stories */}
        <StoriesRow />

        {/* Feed Tabs */}
        <FeedTabs />

        {/* Hero Banner */}
        <HeroBanner />

        {/* Feed Posts */}
        <div className="space-y-6">
          <FeedPost
            author={{
              name: "NeonDreamer",
              username: "@neondreamer",
              avatar: avatar1,
              isPro: true,
              earnings: "+$124",
              isVerified: true,
            }}
            image={cyberGirl}
            tags={["DESIGN", "MKT", "DEV"]}
            badge="Top 1%"
            likes={2489}
            comments={156}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
