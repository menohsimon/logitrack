"use client";

import { cn } from "@logitrack/ui/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@logitrack/ui/components/sheet";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { asRoute } from "@/lib/routes";

import { IosBottomNav, type IosNavItem } from "./ios-bottom-nav";

export type FloatingNavItem = IosNavItem;

const MAX_PRIMARY_ITEMS = 4;

export function FloatingNavMenu({
  items,
  title = "Menu",
}: {
  items: FloatingNavItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { primaryItems, overflowItems } = useMemo(() => {
    if (items.length <= 5) {
      return { primaryItems: items, overflowItems: [] as FloatingNavItem[] };
    }
    return {
      primaryItems: items.slice(0, MAX_PRIMARY_ITEMS),
      overflowItems: items.slice(MAX_PRIMARY_ITEMS),
    };
  }, [items]);

  const barItems: IosNavItem[] = useMemo(() => {
    if (overflowItems.length === 0) {
      return primaryItems;
    }

    const overflowActive = overflowItems.some(
      (item) =>
        item.href === pathname ||
        (item.href !== "/" && pathname.startsWith(item.href)),
    );

    return [
      ...primaryItems,
      {
        href: "#more",
        label: "More",
        icon: LayoutGrid,
        active: overflowActive,
      },
    ];
  }, [overflowItems, primaryItems, pathname]);

  return (
    <>
      <IosBottomNav
        items={barItems}
        onItemClick={(item) => {
          if (item.href === "#more") {
            setOpen(true);
          }
        }}
      />

      {overflowItems.length > 0 && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl px-0 pb-8 pt-4">
            <SheetHeader className="px-4 pb-2">
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <nav className="overflow-y-auto px-2">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === pathname ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={asRoute(item.href)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition-colors",
                      active ? "bg-muted font-medium" : "hover:bg-muted/60",
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}