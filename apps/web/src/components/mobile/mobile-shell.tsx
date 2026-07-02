"use client";

import { BottomNav } from "./bottom-nav";

export function MobileShell({
  children,
  bottomNav,
}: {
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-svh max-w-md bg-muted/30 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="px-4 pt-4">{children}</div>
      {bottomNav ?? <BottomNav />}
    </div>
  );
}