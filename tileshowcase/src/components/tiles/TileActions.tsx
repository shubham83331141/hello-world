"use client";

import { useShowroom } from "@/components/showroom/ShowroomProvider";

function Button({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "primary";
}) {
  const className =
    variant === "primary"
      ? "bg-brand text-brand-foreground hover:opacity-90"
      : "border bg-card hover:bg-muted";
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function TileActions({ tileId }: { tileId: string }) {
  const { hydrated, state, actions } = useShowroom();

  const shortlisted = hydrated ? state.shortlist.includes(tileId) : false;
  const compared = hydrated ? state.compare.includes(tileId) : false;

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => actions.toggleShortlist(tileId)}>
        {shortlisted ? "Shortlisted" : "Shortlist"}
      </Button>
      <Button
        onClick={() => {
          if (!compared && state.compare.length >= 4) {
            window.alert("Compare is limited to 4 tiles.");
            return;
          }
          actions.toggleCompare(tileId);
        }}
      >
        {compared ? "In compare" : "Compare"}
      </Button>
      <Button variant="primary" onClick={() => actions.addDealArea(tileId, 5)}>
        Add 5 m² to deal
      </Button>
    </div>
  );
}

