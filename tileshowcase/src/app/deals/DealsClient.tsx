"use client";

import { useShowroom } from "@/components/showroom/ShowroomProvider";
import { formatINR } from "@/lib/format";
import { computeDealTotals } from "@/lib/deal";
import type { Tile } from "@/lib/types";

export default function DealsClient({ tiles }: { tiles: Tile[] }) {
  const { hydrated, state, actions } = useShowroom();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-2xl border bg-card p-5">
        <h1 className="text-lg font-semibold tracking-tight">Saved deals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stored locally in this browser. Use it for follow-ups or quick re-quotes.
        </p>
      </section>

      {!hydrated || state.savedDeals.length === 0 ? (
        <section className="rounded-2xl border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No saved deals yet. Build a quote in “Deal” and hit “Save quote”.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {state.savedDeals.map((deal) => {
            const totals = computeDealTotals(tiles, deal);
            const customer = deal.customerName.trim() || "Unnamed customer";
            const created = new Date(deal.createdAt).toLocaleString();
            return (
              <div key={deal.id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold">{customer}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Created {created} • {deal.items.length} item(s)
                    </div>
                    {deal.notes ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {deal.notes}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatINR(totals.total)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (Subtotal {formatINR(totals.subtotal)} • Discount{" "}
                      {deal.discountPct}%)
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-90"
                    onClick={() => actions.loadSavedDeal(deal.id)}
                  >
                    Load into Deal
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-full border bg-card px-4 text-sm font-semibold hover:bg-muted"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete this saved deal from this browser?",
                        )
                      ) {
                        actions.deleteSavedDeal(deal.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

