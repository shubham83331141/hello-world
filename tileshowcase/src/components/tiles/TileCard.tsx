"use client";

import Link from "next/link";
import { useShowroom } from "@/components/showroom/ShowroomProvider";
import { formatINR } from "@/lib/format";
import type { Tile } from "@/lib/types";
import StockBadge from "./StockBadge";

function ActionButton({
  onClick,
  children,
  variant = "default",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const className =
    variant === "primary"
      ? "bg-brand text-brand-foreground hover:opacity-90"
      : "border bg-card hover:bg-muted";

  return (
    <button
      className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold ${className}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function TileCard({ tile }: { tile: Tile }) {
  const { hydrated, state, actions } = useShowroom();

  const shortlisted = hydrated ? state.shortlist.includes(tile.id) : false;
  const compared = hydrated ? state.compare.includes(tile.id) : false;

  return (
    <div className="group rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="truncate text-sm font-semibold hover:underline"
              href={`/tiles/${encodeURIComponent(tile.id)}`}
            >
              {tile.name}
            </Link>
            <StockBadge stock={tile.stock} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {tile.brand}
            {tile.collection ? ` • ${tile.collection}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">{formatINR(tile.pricePerSqm)}</div>
          <div className="text-[11px] text-muted-foreground">per m²</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-1">{tile.size}</span>
        <span className="rounded-full bg-muted px-2 py-1">{tile.finish}</span>
        <span className="rounded-full bg-muted px-2 py-1">{tile.color}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tile.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton onClick={() => actions.toggleShortlist(tile.id)}>
          {shortlisted ? "Shortlisted" : "Shortlist"}
        </ActionButton>
        <ActionButton
          onClick={() => {
            if (!hydrated) return;
            if (!compared && state.compare.length >= 4) {
              window.alert("Compare is limited to 4 tiles.");
              return;
            }
            actions.toggleCompare(tile.id);
          }}
        >
          {compared ? "In compare" : "Compare"}
        </ActionButton>
        <ActionButton
          variant="primary"
          onClick={() => actions.addDealArea(tile.id, 5)}
        >
          Add 5 m² to deal
        </ActionButton>
      </div>

      <div className="mt-3 hidden text-xs text-muted-foreground group-hover:block">
        Tip: Tap “Add 5 m²” repeatedly to quickly rough‑estimate the area.
      </div>
    </div>
  );
}
