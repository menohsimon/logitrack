"use client";

import { Home, MessageSquare, Package, User } from "lucide-react";

import { IosBottomNav } from "@/components/navigation/ios-bottom-nav";

const items = [
	{ href: "/driver", icon: Home, label: "Home" },
	{ href: "/driver/shipments", icon: Package, label: "Shipments" },
	{ href: "/driver/support", icon: MessageSquare, label: "Support" },
	{ href: "/driver/profile", icon: User, label: "Profile" },
];

export function DriverBottomNav() {
	return <IosBottomNav items={items} />;
}
