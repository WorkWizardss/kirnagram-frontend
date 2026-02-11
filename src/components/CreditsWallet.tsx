import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Gift, Sparkles, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { claimDailyCredits, CreditsSummary, fetchCreditsSummary } from "@/lib/creditsApi";
import { toast } from "@/components/ui/use-toast";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatAmount = (value: number) => `${value.toLocaleString()}`;

export function CreditsWalletPanel({ variant = "page" }: { variant?: "page" | "modal" }) {
  const [summary, setSummary] = useState<CreditsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCreditsSummary();
      setSummary(data);
    } catch (error) {
      toast({
        title: "Credits",
        description: error instanceof Error ? error.message : "Failed to load credits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClaim = useCallback(async () => {
    setClaiming(true);
    try {
      const result = await claimDailyCredits();
      toast({
        title: "Daily claim",
        description: `You earned ${result.amount} credits today`,
      });
      await loadSummary();
    } catch (error) {
      toast({
        title: "Daily claim",
        description: error instanceof Error ? error.message : "Daily claim failed",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  }, [loadSummary]);

  const paidPlans = useMemo(() => summary?.paid_plans ?? [], [summary]);

  const canClaim = Boolean(
    summary?.daily_claim?.enabled && (summary?.daily_claim?.remaining ?? 0) > 0,
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className={cn("space-y-6", variant === "modal" && "pt-2")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Credits Wallet</p>
          <h2 className="text-2xl font-display font-bold text-foreground">Your Balance</h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadSummary} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card className="glass-card border border-border/60 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-3xl font-display font-bold text-foreground">
                {formatAmount(summary?.balance ?? 0)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Last claimed</p>
            <p className="text-sm font-medium text-foreground">
              {formatDateTime(summary?.last_daily_claim_at)}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {summary?.daily_claim?.enabled
                ? `${summary?.daily_claim?.credits ?? 0} credits per claim • ${summary?.daily_claim?.limit_per_day ?? 1} per 24h`
                : "Daily claim disabled"}
            </span>
          </div>
          <Button
            onClick={handleClaim}
            disabled={!canClaim || claiming}
            className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground"
          >
            {claiming ? "Claiming..." : "Daily Claim"}
          </Button>
        </div>
        {summary?.daily_claim?.next_available_at && !canClaim && (
          <p className="mt-3 text-xs text-muted-foreground">
            Next available: {formatDateTime(summary.daily_claim.next_available_at)}
          </p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border border-border/60 p-5">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            <h3 className="font-display font-semibold text-foreground">Welcome Bonus</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {summary?.welcome_bonus?.enabled
              ? `New users get ${summary?.welcome_bonus?.credits ?? 0} credits.`
              : "Welcome bonus is currently disabled."}
          </p>
          <div className="mt-4 text-sm">
            <p className="text-muted-foreground">Claimed at</p>
            <p className="font-medium text-foreground">
              {formatDateTime(summary?.welcome_bonus_claimed_at)}
            </p>
          </div>
        </Card>

        <Card className="glass-card border border-border/60 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {(summary?.recent_activity || []).length === 0 && (
              <p className="text-muted-foreground">No activity yet.</p>
            )}
            {summary?.recent_activity?.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground capitalize">
                    {tx.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(tx.created_at)}
                  </p>
                </div>
                <span className={cn("font-semibold", tx.amount >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="glass-card border border-border/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-foreground">Paid Plans</h3>
            <p className="text-sm text-muted-foreground">Credits add instantly after payment.</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" disabled>
            View all
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className="border border-border/70 rounded-xl p-4 bg-background/70 flex flex-col gap-2"
            >
              <p className="text-sm text-muted-foreground">{plan.name}</p>
              <p className="text-xl font-display font-semibold text-foreground">
                {formatAmount(plan.credits)} credits
              </p>
              <Button variant="outline" size="sm" disabled>
                Buy
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
