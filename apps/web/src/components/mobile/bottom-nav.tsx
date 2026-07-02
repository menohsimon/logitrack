"use client";

import { Compass, Home, MessageSquare, Package, User } from "lucide-react";

import { IosBottomNav } from "@/components/navigation/ios-bottom-nav";

const items = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/explore", icon: Compass, label: "Explore" },
  { href: "/dashboard/shipments", icon: Package, label: "Shipments" },
  { href: "/dashboard/support", icon: MessageSquare, label: "Support" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  return <IosBottomNav items={items} />;
}