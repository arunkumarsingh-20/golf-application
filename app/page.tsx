import Link from "next/link";


export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-emerald-300">
          Play. Give. Win.
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          A golf rewards platform where every subscription supports a charity.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-neutral-300">
          Track your last five Stableford scores, enter monthly draws, and direct
          part of your subscription toward a cause you care about.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-emerald-400 px-6 py-3 font-semibold text-black"
          >
            Subscribe Now
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold"
          >
            Log in
          </Link>

          <Link
            href="/charities"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold"
          >
            Explore Charities
          </Link>

        </div>

      </section>
    </main>
  );
}
