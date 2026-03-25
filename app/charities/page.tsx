import { createClient } from "@/lib/supabase/server";

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").toLowerCase();

  const supabase = await createClient();

  let charitiesQuery = supabase
    .from("charities")
    .select("*")
    .eq("active", true)
    .order("featured", { ascending: false });

  if (query) {
    charitiesQuery = charitiesQuery.ilike("name", `%${query}%`);
  }

  const { data: charities } = await charitiesQuery;

  const featured = charities?.find((c) => c.featured);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">Charities</h1>
        <p className="mt-2 text-neutral-300">
          Choose a cause you want your subscription to support.
        </p>

        <form className="mt-6">
          <input
            name="q"
            placeholder="Search charities..."
            defaultValue={params.q || ""}
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-3"
          />
        </form>

        {featured ? (
          <div className="mt-10 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">
              Featured
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{featured.name}</h2>
            <p className="mt-3 text-neutral-200">{featured.description}</p>
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {charities?.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-xl font-semibold">{c.name}</h3>
              <p className="mt-2 text-sm text-neutral-300">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
