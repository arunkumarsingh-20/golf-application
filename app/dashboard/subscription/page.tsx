"use client";

import { useState } from "react";

export default function SubscriptionPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: "monthly" | "yearly") {
    try {
      setLoadingPlan(plan);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to start checkout.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Subscription
        </p>
        <h1 className="mt-2 text-4xl font-bold">Choose your plan</h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          Subscribe monthly or yearly to enter the platform, track scores, and
          support your selected charity.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h2 className="text-2xl font-semibold">Monthly</h2>
            <p className="mt-2 text-neutral-300">Flexible access billed every month.</p>
            <button
              onClick={() => handleCheckout("monthly")}
              disabled={loadingPlan === "monthly"}
              className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black disabled:opacity-60"
            >
              {loadingPlan === "monthly" ? "Loading..." : "Choose Monthly"}
            </button>
          </div>

          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8">
            <h2 className="text-2xl font-semibold">Yearly</h2>
            <p className="mt-2 text-neutral-300">
              Best value with discounted annual billing.
            </p>
            <button
              onClick={() => handleCheckout("yearly")}
              disabled={loadingPlan === "yearly"}
              className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black disabled:opacity-60"
            >
              {loadingPlan === "yearly" ? "Loading..." : "Choose Yearly"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
