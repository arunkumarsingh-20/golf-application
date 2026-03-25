"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DrawResult = {
  id: string;
  match_count: number;
  prize_amount: number;
  status: string;
};

export default function WinningsPage() {
  const supabase = createClient();
  const [results, setResults] = useState<DrawResult[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      const { data } = await supabase
        .from("draw_results")
        .select("id, match_count, prize_amount, status")
        .order("created_at", { ascending: false });
      setResults(data || []);
    }
    loadResults();
  }, [supabase]);

  async function handleUpload() {
    if (!file || !selectedResult) return;

    const filePath = `${selectedResult}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("winner-proofs")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("winner-proofs")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("winner_proofs").insert({
      draw_result_id: selectedResult,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      image_url: publicUrl.publicUrl,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Proof uploaded!");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Your Winnings</h1>
        <p className="mt-2 text-neutral-300">
          Upload proof if you have a winning draw.
        </p>

        <div className="mt-8 space-y-4">
          {results.length ? (
            results.map((r) => (
              <label key={r.id} className="block rounded-xl border border-white/10 bg-white/5 p-4">
                <input
                  type="radio"
                  name="result"
                  value={r.id}
                  onChange={() => setSelectedResult(r.id)}
                />
                <span className="ml-3">
                  {r.match_count}-match — ₹{r.prize_amount} — status: {r.status}
                </span>
              </label>
            ))
          ) : (
            <p className="text-neutral-400">No winnings yet.</p>
          )}
        </div>

        <div className="mt-6">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={handleUpload}
            className="ml-4 rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-black"
          >
            Upload Proof
          </button>
        </div>
      </div>
    </main>
  );
}
