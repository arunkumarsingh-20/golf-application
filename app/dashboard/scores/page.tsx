import { createClient } from "@/lib/supabase/server";
import { addScore } from "@/lib/scores";

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scores } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Your Last 5 Scores</h1>
        <p className="mt-2 text-neutral-300">
          Enter a new Stableford score. We keep only your latest 5.
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Score added successfully.
          </p>
        ) : null}

        <form action={addScore} className="mt-8 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm">Score (1–45)</label>
            <input
              name="score"
              type="number"
              min={1}
              max={45}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">Date played</label>
            <input
              name="playedAt"
              type="date"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black"
            >
              Add Score
            </button>
          </div>
        </form>

        <div className="mt-10 space-y-3">
          {scores?.length ? (
            scores.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
              >
                <p className="font-medium">{s.score} points</p>
                <p className="text-sm text-neutral-300">{s.played_at}</p>
              </div>
            ))
          ) : (
            <p className="mt-6 text-neutral-400">No scores yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
