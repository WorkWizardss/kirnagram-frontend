import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, TrendingUp, Users, IndianRupee, Eye, Calendar, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

const earningsData = [
  { month: "Jan", earnings: 450, users: 120 },
  { month: "Feb", earnings: 680, users: 180 },
  { month: "Mar", earnings: 920, users: 245 },
  { month: "Apr", earnings: 1100, users: 312 },
  { month: "May", earnings: 1580, users: 420 },
  { month: "Jun", earnings: 2450, users: 580 },
];

const promptStats = [
  { name: "Neon Cyberpunk", users: 342, earnings: 890, trend: "+12%" },
  { name: "Dream Watercolor", users: 256, earnings: 720, trend: "+8%" },
  { name: "Vintage Film", users: 178, earnings: 480, trend: "+15%" },
  { name: "Ethereal Glow", users: 124, earnings: 360, trend: "+5%" },
];

const CreatorEarnings = () => {
  const [timeRange, setTimeRange] = useState("6M");

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-3 md:px-0 pb-24 md:pb-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link 
            to="/ai-creator" 
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your creator revenue</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
              <IndianRupee className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">₹2,450</p>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18% this month
            </p>
          </div>
          
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-2xl md:text-3xl font-bold">580</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +24% this month
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Views</p>
            <p className="text-2xl md:text-3xl font-bold">12.4K</p>
          </div>

          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Avg. Daily</p>
            <p className="text-2xl md:text-3xl font-bold">₹82</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Usage Analytics</h2>
            <button className="flex items-center gap-1 text-sm text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50">
              {timeRange} <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prompt Performance */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold mb-4">Prompt Performance</h2>
          <div className="space-y-3">
            {promptStats.map((prompt, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{prompt.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {prompt.users} users • ₹{prompt.earnings}
                  </p>
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                  {prompt.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreatorEarnings;
