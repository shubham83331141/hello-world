"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useShowroom } from "@/components/showroom/ShowroomProvider";
import { formatINR } from "@/lib/format";
import type { Tile } from "@/lib/types";

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: React.ReactNode[];
}) {
  return (
    <div className="grid gap-3 border-t py-3 md:grid-cols-[180px_1fr]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value, idx) => (
          <div key={idx} className="rounded-xl bg-muted px-3 py-2 text-sm">
            {value || <span className="text-muted-foreground">—</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompareClient({ tiles }: { tiles: Tile[] }) {
  const { hydrated, state, actions } = useShowroom();

  const comparedTiles = useMemo(() => {
    if (!hydrated) return [];
    const byId = new Map(tiles.map((t) => [t.id, t]));
    return state.compare.map((id) => byId.get(id)).filter(Boolean) as Tile[];
  }, [hydrated, state.compare, tiles]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Compare</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to 4 tiles side-by-side.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
              href="/catalog"
            >
              Add more
            </Link>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
              onClick={() => actions.clearCompare()}
              disabled={!hydrated || state.compare.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {comparedTiles.length === 0 ? (
        <section className="rounded-2xl border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No tiles in compare yet. Open the catalog and tap “Compare”.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90"
            href="/catalog"
          >
            Browse catalog
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border bg-card p-5">
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <div className="text-xs font-medium text-muted-foreground">Tiles</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {comparedTiles.map((tile) => (
                <div key={tile.id} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {tile.name}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {tile.brand}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border px-2 py-1 text-xs hover:bg-muted"
                      onClick={() => actions.toggleCompare(tile.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 text-sm font-semibold">
                    {formatINR(tile.pricePerSqm)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      / m²
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full bg-brand px-3 text-xs font-semibold text-brand-foreground hover:opacity-90"
                    onClick={() => actions.addDealArea(tile.id, 5)}
                  >
                    Add 5 m² to deal
                  </button>
                </div>
              ))}
            </div>
          </div>

          <CompareRow
            label="Size"
            values={comparedTiles.map((t) => t.size)}
          />
          <CompareRow
            label="Finish"
            values={comparedTiles.map((t) => t.finish)}
          />
          <CompareRow
            label="Color"
            values={comparedTiles.map((t) => t.color)}
          />
          <CompareRow
            label="Material"
            values={comparedTiles.map((t) => t.material ?? "")}
          />
          <CompareRow
            label="Pattern"
            values={comparedTiles.map((t) => t.pattern ?? "")}
          />
          <CompareRow
            label="Collection"
            values={comparedTiles.map((t) => t.collection ?? "")}
          />
        </section>
      )}
    </main>
  );
}

