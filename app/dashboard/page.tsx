import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserSubscription } from "@/lib/subscriptions";
import { signOut } from "../(auth)/actions";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    const subscription = await getCurrentUserSubscription(user.id);

    const { count: scoreCount } = await supabase
        .from("scores")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

    const { data: charitySetting } = await supabase
        .from("user_charity_settings")
        .select("contribution_percent, charities (name)")
        .eq("user_id", user.id)
        .maybeSingle();

    const { data: winnings } = await supabase
        .from("draw_results")
        .select("prize_amount")
        .eq("user_id", user.id);

    const winningsTotal =
        winnings?.reduce((sum, r) => sum + Number(r.prize_amount || 0), 0) ?? 0;

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                            Dashboard
                        </p>
                        <h1 className="mt-2 text-4xl font-bold">
                            Welcome, {profile?.full_name ?? user.email ?? "Subscriber"}
                        </h1>
                    </div>

                    <form action={signOut}>
                        <button
                            type="submit"
                            className="rounded-xl border border-white/10 px-4 py-2"
                        >
                            Log out
                        </button>
                    </form>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Email</p>
                        <p className="mt-2 font-medium">
                            {profile?.email ?? user.email}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Role</p>
                        <p className="mt-2 font-medium capitalize">
                            {profile?.role ?? "subscriber"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Subscription</p>
                        <p className="mt-2 font-medium capitalize">
                            {subscription?.status ?? "inactive"}
                        </p>
                        <p className="mt-1 text-sm text-neutral-400">
                            {subscription?.subscription_plans
                                ? `${subscription.subscription_plans.name} plan`
                                : "No plan yet"}
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Scores Logged</p>
                        <p className="mt-2 text-2xl font-semibold">
                            {scoreCount ?? 0}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Charity</p>
                        <p className="mt-2 font-medium">
                            {charitySetting?.charities?.name ?? "Not selected"}
                        </p>
                        <p className="mt-1 text-sm text-neutral-300">
                            Contribution: {charitySetting?.contribution_percent ?? 0}%
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Total Winnings</p>
                        <p className="mt-2 text-2xl font-semibold">
                            ₹{winningsTotal.toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <p className="text-sm text-neutral-400">Next Step</p>
                        <p className="mt-2 font-medium">
                            {subscription?.status === "active"
                                ? "You are active for the next draw"
                                : "Activate your subscription"}
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/subscription"
                        className="inline-block rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-black"
                    >
                        Manage Subscription
                    </Link>

                    <Link
                        href="/dashboard/scores"
                        className="inline-block rounded-xl border border-white/20 px-4 py-3 font-semibold"
                    >
                        Manage Scores
                    </Link>

                    <Link
                        href="/dashboard/charity"
                        className="inline-block rounded-xl border border-white/20 px-4 py-3 font-semibold"
                    >
                        Manage Charity
                    </Link>

                    <Link
                        href="/dashboard/results"
                        className="inline-block rounded-xl border border-white/20 px-4 py-3 font-semibold"
                    >
                        View Results
                    </Link>

                </div>

            </div>
        </main>
    );
}
