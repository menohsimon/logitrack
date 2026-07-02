"use client";

import { UserButton } from "@clerk/nextjs";
import { Separator } from "@logitrack/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@logitrack/ui/components/sidebar";

import { AuthGate } from "@/components/auth-gate";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { MobileShell } from "@/components/mobile/mobile-shell";
import { UserSidebar } from "@/components/navigation/user-sidebar";
import { DriverBottomNav } from "@/components/navigation/driver-bottom-nav";
import { useMinWidth } from "@/hooks/use-breakpoint";

export function UserShell({
  variant,
  children,
}: {
  variant: "user" | "driver";
  children: React.ReactNode;
}) {
  const isLarge = useMinWidth(1024);

  return (
    <AuthGate>
      {isLarge ? (
        <SidebarProvider>
          <UserSidebar variant={variant} />
          <SidebarInset>
            <header className="flex h-14 items-center gap-3 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <div className="ml-auto">
                <UserButton />
              </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      ) : (
        <MobileShell
          bottomNav={variant === "user" ? <BottomNav /> : <DriverBottomNav />}
        >
          {children}
        </MobileShell>
      )}
    </AuthGate>
  );
}