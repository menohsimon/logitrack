"use client";

import { UserButton } from "@clerk/nextjs";
import { Separator } from "@logitrack/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@logitrack/ui/components/sidebar";

import { AuthGate } from "@/components/auth-gate";
import { FloatingNavMenu } from "@/components/navigation/floating-nav-menu";
import { adminNavItems, companyNavItems } from "@/components/navigation/nav-config";
import { AppSidebar } from "./app-sidebar";

export function DashboardShell({
  variant,
  title,
  children,
}: {
  variant: "company" | "admin";
  title?: string;
  children: React.ReactNode;
}) {
  const navItems = variant === "admin" ? adminNavItems : companyNavItems;

  const shell = (
    <SidebarProvider>
      <AppSidebar variant={variant} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger className="hidden md:inline-flex" />
          {title && <h1 className="font-semibold">{title}</h1>}
          <div className="ml-auto">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <FloatingNavMenu
        items={navItems}
        title={variant === "admin" ? "Admin Menu" : "Company Menu"}
      />
    </SidebarProvider>
  );

  return <AuthGate>{shell}</AuthGate>;
}