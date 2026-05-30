import type { TileStock } from "@/lib/types";

const STOCK_LABEL: Record<TileStock, string> = {
  in_stock: "In stock",
  limited: "Limited",
  out_of_stock: "Out of stock",
};

export default function StockBadge({ stock }: { stock: TileStock }) {
  const label = STOCK_LABEL[stock];
  const className =
    stock === "in_stock"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : stock === "limited"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "bg-rose-500/10 text-rose-700 dark:text-rose-300";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

