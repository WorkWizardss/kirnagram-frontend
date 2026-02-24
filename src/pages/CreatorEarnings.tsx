import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, TrendingUp, Users, IndianRupee, Eye, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

// payout per remix (INR) — adjust as needed
const REMIX_PAYOUT = 1;

const CreatorEarnings = () => {
  const [timeRange, setTimeRange] = useState("6M");
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState(200);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  // Always use 200 as the minimum withdraw amount for display and logic
  const minWithdraw = 200;

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      // 1️⃣ Get prompts
      const res = await fetch(`${API_BASE}/ai-creator/prompts/me?status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load prompts");
      const data = await res.json();
      setPrompts(Array.isArray(data) ? data : []);

      // 2️⃣ Get earnings summary (also includes minWithdrawAmount)
      const earningsRes = await fetch(`${API_BASE}/withdraw/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setTotalWithdrawn(earningsData.totalWithdrawn || 0);
        // Ignore backend minWithdrawAmount, always use 200
      }
    } catch (e: any) {
      toast({
        title: "Failed to load data",
        description: e.message || String(e),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const totalRemixes = prompts.reduce((s, p) => s + (p.remixes?.length || 0), 0);
  const uniqueRemixUsers = new Set<string>();
  prompts.forEach((p) => (p.remixes || []).forEach((r: string) => uniqueRemixUsers.add(r)));
  const totalUsers = uniqueRemixUsers.size;
  const totalViews = prompts.reduce((s, p) => s + (p.views?.length || 0), 0);
  const totalEarnings = totalRemixes * REMIX_PAYOUT;
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

  useEffect(() => {
    if (showWithdraw) {
      setAmount(minWithdraw);
    }
  }, [showWithdraw, minWithdraw]);

  useEffect(() => {
    if (availableBalance < minWithdraw) {
      setShowWithdraw(false);
    }
  }, [availableBalance, minWithdraw]);

  // chart: group earnings by month of created_at
  const chartMap: Record<string, { month: string; earnings: number; remixes: number }> = {};
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  prompts.forEach((p) => {
    const date = p.created_at ? new Date(p.created_at) : new Date();
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
    const remixes = (p.remixes || []).length;
    const earnings = remixes * REMIX_PAYOUT;
    if (!chartMap[key]) chartMap[key] = { month, earnings: 0, remixes: 0 };
    chartMap[key].earnings += earnings;
    chartMap[key].remixes += remixes;
  });
  const earningsData = Object.values(chartMap).sort((a,b) => monthNames.indexOf(a.month.split(' ')[0]) - monthNames.indexOf(b.month.split(' ')[0]));

  return (
    <MainLayout showRightSidebar={true}>
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
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl md:text-3xl font-bold text-green-500">₹{availableBalance}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime Earnings: ₹{totalEarnings}
            </p>
            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalRemixes} remixes
            </p>
          </div>
          
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Remixes</p>
            <p className="text-2xl md:text-3xl font-bold">{totalRemixes}</p>
            <p className="text-xs text-primary mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalRemixes} remixes
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Views</p>
            <p className="text-2xl md:text-3xl font-bold">{totalViews}</p>
          </div>
        </div>

        {/* Withdraw Button Section */}
        <div className="mb-6">
          <button
            // Always allow opening the withdraw dropdown
            disabled={false}
            onClick={() => setShowWithdraw(v => !v)}
            className={`w-full py-3 rounded-xl font-semibold transition 
              ${availableBalance >= minWithdraw
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-muted text-muted-foreground"
              }`}
          >
            Withdraw
          </button>
          {showWithdraw && !withdrawSuccess && (
            <div className="mt-4 bg-muted/30 rounded-xl p-4">
              <input
                type="text"
                placeholder="Enter UPI ID"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full mb-3 p-2 rounded-lg bg-muted border border-border"
              />
              <p className="text-xs text-muted-foreground mb-2">
                Available Balance: ₹{availableBalance}
              </p>
              <input
                type="number"
                min={minWithdraw}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="w-full mb-2 p-2 rounded-lg bg-muted border border-border"
              />
              <p className="text-xs text-muted-foreground mb-2">
                Minimum withdraw amount is ₹{minWithdraw}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowWithdraw(false);
                    setUpiId("");
                    setAmount(minWithdraw);
                  }}
                  className="flex-1 py-2 rounded-lg bg-muted"
                >
                  Cancel
                </button>
                <button
                  disabled={withdrawLoading || amount < minWithdraw || amount > availableBalance || !upiId.trim()}
                  onClick={async () => {
                    setWithdrawLoading(true);
                    if (!upiId.trim()) {
                      toast({ 
                        title: "UPI ID Required",
                        variant: "destructive"
                      });
                      setWithdrawLoading(false);
                      return;
                    }
                    if (amount < minWithdraw) {
                      toast({ 
                        title: `Minimum withdraw is ₹${minWithdraw}`,
                        variant: "destructive"
                      });
                      setWithdrawLoading(false);
                      return;
                    }
                    if (amount > availableBalance) {
                      toast({ 
                        title: "Insufficient balance",
                        description: "You cannot withdraw more than your earnings",
                        variant: "destructive"
                      });
                      setWithdrawLoading(false);
                      return;
                    }
                    try {
                      const user = auth.currentUser;
                      if (!user) return;

                      const token = await user.getIdToken();

                      const res = await fetch(`${API_BASE}/withdraw/request`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ upiId, amount }),
                      });

                      if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        toast({
                          title: "Error",
                          description: errData.detail || "Failed to submit withdraw",
                          variant: "destructive",
                        });
                        return;
                      }

                      setWithdrawSuccess(true);
                      fetchPrompts();
                      setUpiId("");
                      setAmount(minWithdraw);

                    } catch (err) {
                      toast({
                        title: "Error",
                        description: "Failed to submit withdraw",
                        variant: "destructive",
                      });
                    } finally {
                      setWithdrawLoading(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {withdrawLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
          {showWithdraw && withdrawSuccess && (
            <div className="mt-4 bg-muted/30 rounded-xl p-4 flex flex-col items-center">
              <p className="text-sm font-medium mb-2">Withdraw request submitted. Admin will review within 24 hours.</p>
              <button
                className="mt-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                onClick={() => {
                  setWithdrawSuccess(false);
                  setShowWithdraw(false);
                }}
              >OK</button>
            </div>
          )}
         
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
                    dataKey="earnings" 
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
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {!loading && prompts.length === 0 && <div className="text-sm text-muted-foreground">No prompts yet.</div>}
            {!loading && prompts.map((p, i) => (
              <div 
                key={p._id || i} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={p.image_url || ''}
                    alt={p.style_name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{p.style_name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.remixes?.length || 0} remixes • ₹{(p.remixes?.length || 0) * REMIX_PAYOUT}
                    </p>
                    {p.unit_id && <p className="text-[10px] text-muted-foreground mt-1">{p.unit_id}</p>}
                  </div>
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    {/* Withdraw modal replaced with dropdown/collapsible */}
    </MainLayout>
  );
};

export default CreatorEarnings;
