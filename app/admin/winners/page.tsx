import { approveProof, rejectProof, markPaid } from "@/lib/winnerReview";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const success = params.success;

  const supabase = supabaseAdmin;

  const { data: proofs } = await supabase
    .from("winner_proofs")
    .select(`
      id,
      image_url,
      review_status,
      draw_result_id,
      user_id,
      draw_results (
        status,
        prize_amount
      )
    `);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Winner Proofs</h1>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Action completed.
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {proofs?.length ? (
            proofs.map((p) => {
              const result = Array.isArray(p.draw_results)
                ? p.draw_results[0]
                : p.draw_results;

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm text-neutral-300">
                    Status: {p.review_status}
                  </p>

                  <p className="text-sm text-neutral-400">
                    Prize: ₹{result?.prize_amount ?? "N/A"} | Payment:{" "}
                    {result?.status ?? "pending"}
                  </p>

                  <img
                    src={p.image_url}
                    alt="Proof"
                    className="mt-3 max-w-xs rounded-xl border border-white/10"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={approveProof}>
                      <input type="hidden" name="proofId" value={p.id} />
                      <button
                        disabled={p.review_status === "approved"}
                        className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </form>

                    <form action={rejectProof}>
                      <input type="hidden" name="proofId" value={p.id} />
                      <button
                        disabled={p.review_status === "rejected"}
                        className="rounded-xl border border-white/20 px-4 py-2 font-semibold disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </form>

                    {p.review_status === "approved" &&
                    result?.status !== "paid" ? (
                      <form action={markPaid}>
                        <input type="hidden" name="proofId" value={p.id} />
                        <button className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-400/10">
                          Mark Paid
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-neutral-400">No proofs uploaded yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
