"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useShowroom } from "@/components/showroom/ShowroomProvider";
import { formatINR, sqftToSqm, sqmToSqft } from "@/lib/format";
import { computeDealTotals } from "@/lib/deal";
import type { Tile } from "@/lib/types";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-muted-foreground">{children}</div>;
}

export default function DealClient({ tiles }: { tiles: Tile[] }) {
  const { hydrated, state, actions } = useShowroom();
  const [unit, setUnit] = useState<"sqm" | "sqft">("sqm");

  const totals = useMemo(() => {
    if (!hydrated) return null;
    return computeDealTotals(tiles, state.dealDraft);
  }, [hydrated, tiles, state.dealDraft]);

  const canSave = hydrated && state.dealDraft.items.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Deal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Add area per tile, discount, and customer details. Then print or save.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
              href="/catalog"
            >
              Add tiles
            </Link>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
              onClick={() => actions.startNewDeal()}
              disabled={!hydrated}
            >
              New deal
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
              onClick={() => {
                actions.saveDeal();
                window.alert("Saved to Deals (local).");
              }}
              disabled={!canSave}
            >
              Save quote
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
              onClick={() => window.print()}
              disabled={!canSave}
            >
              Print
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 md:col-span-2 print:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <FieldLabel>Customer name</FieldLabel>
              <input
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                value={hydrated ? state.dealDraft.customerName : ""}
                onChange={(e) => actions.setDealCustomerName(e.target.value)}
                placeholder="e.g. Mr. Shah"
              />
            </label>
            <label>
              <FieldLabel>Phone (optional)</FieldLabel>
              <input
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                value={hydrated ? state.dealDraft.customerPhone : ""}
                onChange={(e) => actions.setDealCustomerPhone(e.target.value)}
                placeholder="+91…"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <FieldLabel>Area unit</FieldLabel>
              <select
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                value={unit}
                onChange={(e) => setUnit(e.target.value as "sqm" | "sqft")}
              >
                <option value="sqm">m²</option>
                <option value="sqft">ft²</option>
              </select>
            </label>
            <label>
              <FieldLabel>Discount (%)</FieldLabel>
              <input
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                value={hydrated ? state.dealDraft.discountPct : 0}
                type="number"
                min={0}
                max={90}
                onChange={(e) =>
                  actions.setDealDiscountPct(Number(e.target.value || "0"))
                }
              />
            </label>
            <label>
              <FieldLabel>Notes</FieldLabel>
              <input
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                value={hydrated ? state.dealDraft.notes : ""}
                onChange={(e) => actions.setDealNotes(e.target.value)}
                placeholder="Delivery timeline, finish options…"
              />
            </label>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Items</h2>
              <div className="text-xs text-muted-foreground">
                Tap “Add 5 m²” from catalog/compare to build quickly.
              </div>
            </div>

            {!hydrated || state.dealDraft.items.length === 0 ? (
              <div className="mt-4 rounded-2xl border bg-muted p-6 text-sm text-muted-foreground">
                No items yet. Go to <Link className="underline" href="/catalog">Catalog</Link>{" "}
                and tap “Add 5 m² to deal”.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {totals?.lines.map((line) => {
                  const displayArea =
                    unit === "sqm" ? line.areaSqm : sqmToSqft(line.areaSqm);
                  const displayStep = unit === "sqm" ? 1 : 10;

                  return (
                    <div
                      key={line.tile.id}
                      className="rounded-2xl border bg-card p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold">
                            {line.tile.name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {line.tile.brand} • {line.tile.size} •{" "}
                            {formatINR(line.tile.pricePerSqm)} / m²
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold">
                          {formatINR(line.lineTotal)}
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <label>
                          <FieldLabel>
                            Area ({unit === "sqm" ? "m²" : "ft²"})
                          </FieldLabel>
                          <input
                            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                            value={
                              Number.isFinite(displayArea)
                                ? displayArea.toFixed(unit === "sqm" ? 1 : 0)
                                : ""
                            }
                            type="number"
                            min={0}
                            step={displayStep}
                            onChange={(e) => {
                              const v = Number(e.target.value || "0");
                              actions.setDealItemArea(
                                line.tile.id,
                                unit === "sqm" ? v : sqftToSqm(v),
                              );
                            }}
                          />
                        </label>
                        <div className="flex gap-2 sm:justify-end">
                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center rounded-xl border bg-card px-3 text-sm font-semibold hover:bg-muted"
                            onClick={() => actions.addDealArea(line.tile.id, 5)}
                          >
                            +5 m²
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center rounded-xl border bg-card px-3 text-sm font-semibold hover:bg-muted"
                            onClick={() => actions.removeDealItem(line.tile.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-5 md:col-span-1 print:col-span-1">
          <h2 className="text-sm font-semibold tracking-tight">Summary</h2>
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatINR(totals?.subtotal ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Discount ({hydrated ? state.dealDraft.discountPct : 0}%)
              </span>
              <span className="font-medium">
                −{formatINR(totals?.discountAmount ?? 0)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">
                {formatINR(totals?.total ?? 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-muted p-4 text-xs text-muted-foreground">
            Prices are demo values. Replace `src/lib/tiles.ts` with your showroom’s
            real catalog and pricing.
          </div>
        </aside>
      </section>
    </main>
  );
}

