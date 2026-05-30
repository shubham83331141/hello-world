"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShowroomProvider, useShowroom } from "@/components/showroom/ShowroomProvider";

function NavLink({
  href,
  label,
  badgeCount,
}: {
  href: string;
  label: string;
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        active ? "bg-muted" : "hover:bg-muted",
      ].join(" ")}
      href={href}
    >
      <span>{label}</span>
      {typeof badgeCount === "number" && badgeCount > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs text-background">
          {badgeCount}
        </span>
      ) : null}
    </Link>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { hydrated, state } = useShowroom();
  const shortlistCount = hydrated ? state.shortlist.length : 0;
  const compareCount = hydrated ? state.compare.length : 0;
  const dealCount = hydrated ? state.dealDraft.items.length : 0;
  const savedDealsCount = hydrated ? state.savedDeals.length : 0;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                TileSHowcase
              </div>
              <div className="text-xs text-muted-foreground">Showroom mode</div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            <NavLink href="/catalog" label="Catalog" />
            <NavLink
              href="/shortlist"
              label="Shortlist"
              badgeCount={shortlistCount}
            />
            <NavLink href="/compare" label="Compare" badgeCount={compareCount} />
            <NavLink href="/deal" label="Deal" badgeCount={dealCount} />
            <NavLink href="/deals" label="Deals" badgeCount={savedDealsCount} />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShowroomProvider>
      <ShellInner>{children}</ShellInner>
    </ShowroomProvider>
  );
}
