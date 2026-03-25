import { createClient } from "@/lib/supabase/server";

export default async function ResultsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: results } = await supabase
    .from("draw_results")
    .select("id, match_count, prize_amount, status, draw_id")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Draw Results</h1>
        <p className="mt-2 text-neutral-300">
          Your recent draw outcomes and winnings.
        </p>

        <div className="mt-8 space-y-4">
          {results?.length ? (
            results.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-lg font-semibold">
                  {r.match_count}-match
                </p>
                <p className="text-sm text-neutral-300">
                  Prize: ₹{Number(r.prize_amount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-neutral-400">
                  Status: {r.status}
                </p>
              </div>
            ))
          ) : (
            <p className="text-neutral-400">No results yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
