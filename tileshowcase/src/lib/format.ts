const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return INR_FORMATTER.format(amount);
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sqmToSqft(sqm: number): number {
  return sqm * 10.7639;
}

export function sqftToSqm(sqft: number): number {
  return sqft / 10.7639;
}

