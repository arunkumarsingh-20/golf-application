import { createClient } from "@/lib/supabase/server";

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const [
    usersCount,
    activeSubsCount,
    totalPrizePool,
    totalWinnings,
    totalDraws,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("prize_pools").select("total_pool"),
    supabase.from("draw_results").select("prize_amount"),
    supabase.from("draws").select("id", { count: "exact", head: true }),
  ]);

  const totalPoolSum =
    totalPrizePool.data?.reduce(
      (sum, p) => sum + Number(p.total_pool || 0),
      0
    ) ?? 0;

  const totalWonSum =
    totalWinnings.data?.reduce(
      (sum, r) => sum + Number(r.prize_amount || 0),
      0
    ) ?? 0;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="mt-2 text-neutral-300">
          High-level platform metrics and draw performance.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-neutral-400">Total Users</p>
            <p className="mt-2 text-2xl font-semibold">
              {usersCount.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-neutral-400">Active Subscribers</p>
            <p className="mt-2 text-2xl font-semibold">
              {activeSubsCount.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-neutral-400">Total Draws</p>
            <p className="mt-2 text-2xl font-semibold">
              {totalDraws.count ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-neutral-400">Total Prize Pool</p>
            <p className="mt-2 text-2xl font-semibold">
              ₹{totalPoolSum.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-neutral-400">Total Paid Out</p>
            <p className="mt-2 text-2xl font-semibold">
              ₹{totalWonSum.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
