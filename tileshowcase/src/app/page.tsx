import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <section className="rounded-2xl border bg-card p-8">
        <p className="text-sm font-medium text-muted-foreground">
          Luxury tile showroom assistant
        </p>
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">
          TileSHowcase
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
          Browse tiles with a client, compare options, and build a printable
          quote in minutes. Everything is local-first so it works even when
          Wi‑Fi is spotty.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90"
            href="/catalog"
          >
            Browse catalog
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border bg-card px-5 text-sm font-semibold hover:bg-muted"
            href="/deal"
          >
            Start a deal
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold">Fast comparisons</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Shortlist tiles and compare specs side-by-side.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold">Quote builder</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add area, discount, and customer details for a quick print-ready
            quote.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-sm font-semibold">Local-first</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Keeps shortlist/compare/deals in this browser via localStorage.
          </p>
        </div>
      </section>
    </main>
  );
}
