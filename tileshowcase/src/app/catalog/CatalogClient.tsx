"use client";

import { useMemo, useState } from "react";
import TileCard from "@/components/tiles/TileCard";
import type { Tile, TileStock } from "@/lib/types";

type Filters = {
  query: string;
  stock: TileStock | "any";
  finish: string | "any";
  size: string | "any";
};

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export default function CatalogClient({ tiles }: { tiles: Tile[] }) {
  const [filters, setFilters] = useState<Filters>({
    query: "",
    stock: "any",
    finish: "any",
    size: "any",
  });

  const allFinishes = useMemo(
    () => uniqueValues(tiles.map((t) => t.finish)),
    [tiles],
  );
  const allSizes = useMemo(() => uniqueValues(tiles.map((t) => t.size)), [tiles]);

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return tiles.filter((tile) => {
      if (filters.stock !== "any" && tile.stock !== filters.stock) return false;
      if (filters.finish !== "any" && tile.finish !== filters.finish) return false;
      if (filters.size !== "any" && tile.size !== filters.size) return false;
      if (!q) return true;
      const haystack = [
        tile.name,
        tile.brand,
        tile.collection ?? "",
        tile.size,
        tile.finish,
        tile.color,
        tile.material ?? "",
        tile.pattern ?? "",
        tile.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tiles, filters]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Catalog</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search and filter, then shortlist/compare and add rough area to the deal.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            of <span className="font-medium text-foreground">{tiles.length}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <div className="text-xs font-medium text-muted-foreground">Search</div>
            <input
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              value={filters.query}
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
              placeholder="e.g. calacatta, polished, 600×1200…"
            />
          </label>

          <label>
            <div className="text-xs font-medium text-muted-foreground">Stock</div>
            <select
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              value={filters.stock}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  stock: e.target.value as Filters["stock"],
                }))
              }
            >
              <option value="any">Any</option>
              <option value="in_stock">In stock</option>
              <option value="limited">Limited</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>

          <label>
            <div className="text-xs font-medium text-muted-foreground">Finish</div>
            <select
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              value={filters.finish}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  finish: e.target.value as Filters["finish"],
                }))
              }
            >
              <option value="any">Any</option>
              {allFinishes.map((finish) => (
                <option key={finish} value={finish}>
                  {finish}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-1">
            <div className="text-xs font-medium text-muted-foreground">Size</div>
            <select
              className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              value={filters.size}
              onChange={(e) =>
                setFilters((f) => ({ ...f, size: e.target.value as Filters["size"] }))
              }
            >
              <option value="any">Any</option>
              {allSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-1">
            <button
              type="button"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl border bg-card text-sm font-semibold hover:bg-muted"
              onClick={() =>
                setFilters({ query: "", stock: "any", finish: "any", size: "any" })
              }
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.map((tile) => (
          <TileCard key={tile.id} tile={tile} />
        ))}
      </section>
    </main>
  );
}

