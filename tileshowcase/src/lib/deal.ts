import { clampNumber } from "@/lib/format";
import type { DealDraft, Tile } from "@/lib/types";

export type DealLine = {
  tile: Tile;
  areaSqm: number;
  lineTotal: number;
};

export type DealTotals = {
  lines: DealLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
};

export function computeDealTotals(tiles: Tile[], draft: DealDraft): DealTotals {
  const tileById = new Map(tiles.map((t) => [t.id, t]));

  const lines: DealLine[] = draft.items
    .map((item) => {
      const tile = tileById.get(item.tileId);
      if (!tile) return undefined;
      const areaSqm = clampNumber(item.areaSqm, 0, 10_000);
      const lineTotal = areaSqm * tile.pricePerSqm;
      return { tile, areaSqm, lineTotal };
    })
    .filter(Boolean) as DealLine[];

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountAmount = subtotal * clampNumber(draft.discountPct, 0, 90) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  return { lines, subtotal, discountAmount, total };
}

