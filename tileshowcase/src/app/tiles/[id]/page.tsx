import Link from "next/link";
import { notFound } from "next/navigation";
import TileActions from "@/components/tiles/TileActions";
import StockBadge from "@/components/tiles/StockBadge";
import { formatINR } from "@/lib/format";
import { getTileById } from "@/lib/tiles";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tile = getTileById(id);
  if (!tile) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{tile.name}</h1>
              <StockBadge stock={tile.stock} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {tile.brand}
              {tile.collection ? ` • ${tile.collection}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">{formatINR(tile.pricePerSqm)}</div>
            <div className="text-xs text-muted-foreground">per m²</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted p-4">
            <div className="text-xs font-medium text-muted-foreground">Specs</div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{tile.size}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Finish</dt>
                <dd className="font-medium">{tile.finish}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Color</dt>
                <dd className="font-medium">{tile.color}</dd>
              </div>
              {tile.material ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Material</dt>
                  <dd className="font-medium">{tile.material}</dd>
                </div>
              ) : null}
              {tile.pattern ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Pattern</dt>
                  <dd className="font-medium">{tile.pattern}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <div className="text-xs font-medium text-muted-foreground">Tags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tile.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border bg-card px-2 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <div className="text-xs font-medium text-muted-foreground">Actions</div>
              <div className="mt-3">
                <TileActions tileId={tile.id} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link className="underline text-muted-foreground" href="/catalog">
            ← Back to catalog
          </Link>
          <Link className="underline text-muted-foreground" href="/compare">
            Compare
          </Link>
          <Link className="underline text-muted-foreground" href="/deal">
            Deal
          </Link>
        </div>
      </section>
    </main>
  );
}

