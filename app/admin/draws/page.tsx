import { createClient } from "@/lib/supabase/server";
import { createDraw, simulateDraw, calculatePrizes, publishDraw } from "@/lib/draws";


export default async function AdminDrawsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; success?: string }>;
}) {
    const params = await searchParams;
    const error = params.error;
    const success = params.success;

    const supabase = await createClient();

    const { data: draws } = await supabase
        .from("draws")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold">Draw Management</h1>
                <p className="mt-2 text-neutral-300">
                    Create and simulate monthly draws.
                </p>

                {/* ERROR MESSAGE */}
                {error ? (
                    <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </p>
                ) : null}

                {/* SUCCESS MESSAGE */}
                {success ? (
                    <p className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                        Draw created successfully.
                    </p>
                ) : null}

                {/* CREATE DRAW FORM */}
                <form action={createDraw} className="mt-8 grid gap-4 md:grid-cols-3">
                    <input
                        name="month"
                        type="number"
                        min={1}
                        max={12}
                        placeholder="Month"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                        required
                    />
                    <input
                        name="year"
                        type="number"
                        min={2024}
                        placeholder="Year"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                        required
                    />
                    <select
                        name="drawType"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                        <option value="random">Random</option>
                        <option value="algorithmic">Algorithmic (later)</option>
                    </select>

                    <button
                        type="submit"
                        className="md:col-span-3 rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black"
                    >
                        Create & Simulate Draw
                    </button>
                </form>

                {/* DRAWS LIST */}
                <div className="mt-10 space-y-3">
                    {draws?.length ? (
                        draws.map((d) => (
                            <div
                                key={d.id}
                                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 md:flex-row md:items-center md:justify-between"
                            >
                                {/* LEFT */}
                                <div>
                                    <p className="font-medium">
                                        {d.month}/{d.year} — {d.draw_type}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        Status: {d.status}
                                    </p>
                                </div>

                                {/* MIDDLE (NUMBERS) */}
                                <div className="text-sm text-neutral-300">
                                    {Array.isArray(d.draw_numbers) && d.draw_numbers.length
                                        ? d.draw_numbers.join(", ")
                                        : "No numbers"}
                                </div>

                                {/* RIGHT (SIMULATION BUTTON) */}
                                <form action={simulateDraw}>
                                    <input type="hidden" name="drawId" value={d.id} />
                                    <button
                                        type="submit"
                                        disabled={d.status === "completed"}
                                        className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                                    >
                                        Run Simulation
                                    </button>
                                </form>

                                <form action={calculatePrizes}>
                                    <input type="hidden" name="drawId" value={d.id} />
                                    <button
                                        type="submit"
                                        className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm text-emerald-200"
                                    >
                                        Calculate Prizes
                                    </button>
                                </form>

                                <form action={publishDraw}>
                                    <input type="hidden" name="drawId" value={d.id} />
                                    <button
                                        type="submit"
                                        className="rounded-xl border border-white/20 px-4 py-2 text-sm"
                                    >
                                        Publish Draw
                                    </button>
                                </form>


                            </div>
                        ))
                    ) : (
                        <p className="mt-6 text-neutral-400">No draws yet.</p>
                    )}
                </div>
            </div>
        </main>
    );
}