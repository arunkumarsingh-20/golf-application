import { createClient } from "@/lib/supabase/server";
import { saveCharitySelection } from "@/lib/charity";

export default async function CharityPage({
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

  const { data: charities } = await supabase
    .from("charities")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false });

  const { data: current } = await supabase
    .from("user_charity_settings")
    .select("charity_id, contribution_percent")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Choose Your Charity</h1>
        <p className="mt-2 text-neutral-300">
          At least 10% of your subscription goes to a charity you choose.
        </p>

        {error ? (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Charity updated successfully.
          </p>
        ) : null}

        <form action={saveCharitySelection} className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {charities?.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <input
                  type="radio"
                  name="charityId"
                  value={c.id}
                  defaultChecked={current?.charity_id === c.id}
                  className="mt-1"
                />
                <div>
                  <p className="text-lg font-semibold">{c.name}</p>
                  <p className="mt-1 text-sm text-neutral-300">{c.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm">Contribution % (min 10)</label>
            <input
              name="percent"
              type="number"
              min={10}
              max={100}
              defaultValue={current?.contribution_percent ?? 10}
              required
              className="w-full max-w-xs rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black"
          >
            Save Charity
          </button>
        </form>
      </div>
    </main>
  );
}
