import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Heart, MessageCircle, Eye, TrendingUp, ChevronRight, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import cyberGirl from "@/assets/cyber-girl.jpg";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar3 from "@/assets/avatar-3.jpg";
import heroBanner from "@/assets/hero-banner.jpg";

const prompts = [
  { 
    id: 1, 
    name: "Neon Cyberpunk", 
    image: cyberGirl,
    status: "approved", 
    likes: 2340, 
    comments: 156, 
    views: 8920,
    remixes: 342,
    earnings: 890
  },
  { 
    id: 2, 
    name: "Dream Watercolor", 
    image: avatar1,
    status: "approved", 
    likes: 1820, 
    comments: 89, 
    views: 6540,
    remixes: 256,
    earnings: 720
  },
  { 
    id: 3, 
    name: "Vintage Film", 
    image: heroBanner,
    status: "pending", 
    likes: 0, 
    comments: 0, 
    views: 0,
    remixes: 0,
    earnings: 0
  },
  { 
    id: 4, 
    name: "Ethereal Glow", 
    image: avatar3,
    status: "approved", 
    likes: 1240, 
    comments: 67, 
    views: 4890,
    remixes: 124,
    earnings: 360
  },
];

const CreatorPrompts = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<typeof prompts[0] | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  const filteredPrompts = prompts.filter(p => 
    filter === "all" ? true : p.status === filter
  );

  const comments = [
    { user: "Alex", text: "Amazing style! Used it on my profile pic 🔥" },
    { user: "Maya", text: "How do you create such vibrant colors?" },
    { user: "Jordan", text: "This is my favorite prompt ever!" },
    { user: "Sam", text: "Perfect for my sci-fi project" },
  ];

  if (selectedPrompt) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto px-3 md:px-0 pb-24 md:pb-8">
          <button 
            onClick={() => setSelectedPrompt(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Prompts
          </button>

          {/* Prompt Header */}
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img 
              src={selectedPrompt.image} 
              alt={selectedPrompt.name}
              className="w-full h-48 md:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold">{selectedPrompt.name}</h1>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full mt-1 inline-block",
                    selectedPrompt.status === "approved" 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {selectedPrompt.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-500">₹{selectedPrompt.earnings}</p>
                  <p className="text-xs text-muted-foreground">earned</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { icon: Heart, value: selectedPrompt.likes, label: "Likes", color: "text-pink-500" },
              { icon: MessageCircle, value: selectedPrompt.comments, label: "Comments", color: "text-primary" },
              { icon: Eye, value: selectedPrompt.views, label: "Views", color: "text-secondary" },
              { icon: TrendingUp, value: selectedPrompt.remixes, label: "Remixes", color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="p-3 bg-card border border-border rounded-xl text-center">
                <stat.icon className={cn("w-5 h-5 mx-auto mb-1", stat.color)} />
                <p className="font-bold text-lg">{stat.value > 1000 ? `${(stat.value/1000).toFixed(1)}K` : stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Recent Comments
            </h2>
            <div className="space-y-3">
              {comments.map((comment, i) => (
                <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {comment.user[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{comment.user}</p>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-3 md:px-0 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            to="/ai-creator" 
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-display font-bold">My Prompts</h1>
            <p className="text-sm text-muted-foreground">{prompts.length} prompts created</p>
          </div>
          <Link 
            to="/ai-creator/add-prompt"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            + Add New
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search prompts..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm"
            />
          </div>
          <button className="p-2.5 bg-muted/50 border border-border rounded-xl">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["all", "approved", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors",
                filter === f 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Prompts List */}
        <div className="space-y-3">
          {filteredPrompts.map((prompt) => (
            <div 
              key={prompt.id}
              onClick={() => setSelectedPrompt(prompt)}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer group"
            >
              <img 
                src={prompt.image} 
                alt={prompt.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{prompt.name}</h3>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    prompt.status === "approved" 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-yellow-500/20 text-yellow-500"
                  )}>
                    {prompt.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {prompt.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {prompt.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {prompt.remixes}
                  </span>
                </div>
                {prompt.earnings > 0 && (
                  <p className="text-xs font-medium text-green-500 mt-1">₹{prompt.earnings} earned</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatorPrompts;
