"use client";

import { cn } from "@logitrack/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { asRoute } from "@/lib/routes";

export type IosNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active?: boolean;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/driver" || href === "/company" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type IosBottomNavProps = {
  items: IosNavItem[];
  className?: string;
  onItemClick?: (item: IosNavItem) => void;
};

export function IosBottomNav({ items, className, onItemClick }: IosBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden",
        className,
      )}
    >
      <div className="flex items-center justify-around rounded-full border border-white/10 bg-neutral-900/75 px-1 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/80">
        {items.map((item) => {
          const active = item.active ?? isActive(pathname, item.href);
          const Icon = item.icon;

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "size-[22px] transition-colors",
                    active ? "text-white" : "text-white/70",
                  )}
                />
                {item.badge && (
                  <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-medium leading-tight",
                  active ? "text-white" : "text-white/70",
                )}
              >
                {item.label}
              </span>
            </>
          );

          const itemClassName = cn(
            "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 transition-colors",
            active && "bg-white/15",
          );

          if (onItemClick && item.href.startsWith("#")) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => onItemClick(item)}
                className={itemClassName}
                aria-label={item.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={asRoute(item.href)}
              className={itemClassName}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}