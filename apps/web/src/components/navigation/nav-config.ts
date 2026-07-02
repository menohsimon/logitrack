import {
	Building2,
	ClipboardList,
	Compass,
	Home,
	LayoutDashboard,
	MessageSquare,
	Package,
	ScrollText,
	ShieldCheck,
	Star,
	Truck,
	User,
	Users,
} from "lucide-react";

import type { FloatingNavItem } from "./floating-nav-menu";

export const companyNavItems: FloatingNavItem[] = [
	{ href: "/company", icon: LayoutDashboard, label: "Overview" },
	{ href: "/company/profile", icon: Building2, label: "Profile" },
	{ href: "/company/verification", icon: ClipboardList, label: "Verification" },
	{ href: "/company/drivers", icon: Truck, label: "Drivers" },
	{ href: "/company/bookings", icon: Package, label: "Bookings" },
	{ href: "/company/shipments", icon: Package, label: "Shipments" },
	{ href: "/company/reviews", icon: Star, label: "Reviews" },
	{ href: "/company/support", icon: MessageSquare, label: "Support" },
];

export const adminNavItems: FloatingNavItem[] = [
	{ href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
	{ href: "/admin/users", icon: Users, label: "Users" },
	{ href: "/admin/companies", icon: Building2, label: "Companies" },
	{ href: "/admin/bookings", icon: Package, label: "Bookings" },
	{ href: "/admin/shipments", icon: Truck, label: "Shipments" },
	{ href: "/admin/support", icon: MessageSquare, label: "Support" },
	{ href: "/admin/reviews", icon: Star, label: "Reviews" },
	{ href: "/admin/audit-logs", icon: ScrollText, label: "Audit Logs" },
	{
		href: "/admin/access-requests",
		icon: ShieldCheck,
		label: "Access Requests",
	},
];

export const userNavItems: FloatingNavItem[] = [
	{ href: "/dashboard", icon: Home, label: "Home" },
	{ href: "/dashboard/explore", icon: Compass, label: "Explore" },
	{ href: "/dashboard/shipments", icon: Package, label: "Shipments" },
	{ href: "/dashboard/bookings", icon: ScrollText, label: "Bookings" },
	{ href: "/dashboard/reviews", icon: Star, label: "Reviews" },
	{ href: "/dashboard/support", icon: MessageSquare, label: "Support" },
	{ href: "/dashboard/profile", icon: User, label: "Profile" },
];

export const driverNavItems: FloatingNavItem[] = [
	{ href: "/driver", icon: Home, label: "Home" },
	{ href: "/driver/shipments", icon: Package, label: "Shipments" },
	{ href: "/driver/support", icon: MessageSquare, label: "Support" },
	{ href: "/driver/profile", icon: User, label: "Profile" },
];
