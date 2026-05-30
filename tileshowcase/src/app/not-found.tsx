import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </p>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90"
        href="/catalog"
      >
        Go to catalog
      </Link>
    </main>
  );
}

