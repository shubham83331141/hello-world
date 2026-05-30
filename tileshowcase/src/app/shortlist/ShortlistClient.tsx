"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useShowroom } from "@/components/showroom/ShowroomProvider";
import TileCard from "@/components/tiles/TileCard";
import type { Tile } from "@/lib/types";

export default function ShortlistClient({ tiles }: { tiles: Tile[] }) {
  const { hydrated, state, actions } = useShowroom();

  const shortlistedTiles = useMemo(() => {
    if (!hydrated) return [];
    const byId = new Map(tiles.map((t) => [t.id, t]));
    return state.shortlist.map((id) => byId.get(id)).filter(Boolean) as Tile[];
  }, [hydrated, state.shortlist, tiles]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Shortlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your “maybe” tiles while talking with the customer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
              href="/catalog"
            >
              Browse catalog
            </Link>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
              onClick={() => {
                state.shortlist.forEach((id) => actions.addDealArea(id, 5));
                window.alert("Added 5 m² of each shortlisted tile to the deal.");
              }}
              disabled={!hydrated || state.shortlist.length === 0}
            >
              Add all to deal (+5 m²)
            </button>
          </div>
        </div>
      </section>

      {shortlistedTiles.length === 0 ? (
        <section className="rounded-2xl border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No shortlisted tiles yet. Open the catalog and tap “Shortlist”.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-foreground hover:opacity-90"
            href="/catalog"
          >
            Browse catalog
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {shortlistedTiles.map((tile) => (
            <TileCard key={tile.id} tile={tile} />
          ))}
        </section>
      )}
    </main>
  );
}

