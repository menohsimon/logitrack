"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@logitrack/ui/components/sidebar";
import {
	Building2,
	ClipboardList,
	LayoutDashboard,
	MessageSquare,
	Package,
	ScrollText,
	ShieldCheck,
	Star,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { asLinkRender } from "@/lib/render-adapters";

type NavItem = {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
};

const companyNav: NavItem[] = [
	{ href: "/company", label: "Overview", icon: LayoutDashboard },
	{ href: "/company/profile", label: "Profile", icon: Building2 },
	{ href: "/company/verification", label: "Verification", icon: ClipboardList },
	{ href: "/company/drivers", label: "Drivers", icon: Truck },
	{ href: "/company/vehicles", label: "Vehicles", icon: Truck },
	{ href: "/company/bookings", label: "Bookings", icon: Package },
	{ href: "/company/shipments", label: "Shipments", icon: Package },
	{ href: "/company/reviews", label: "Reviews", icon: Star },
	{ href: "/company/support", label: "Support", icon: MessageSquare },
];

const adminNav: NavItem[] = [
	{ href: "/admin", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/admin/users", label: "Users", icon: Users },
	{ href: "/admin/companies", label: "Companies", icon: Building2 },
	{ href: "/admin/bookings", label: "Bookings", icon: Package },
	{ href: "/admin/shipments", label: "Shipments", icon: Truck },
	{ href: "/admin/support", label: "Support", icon: MessageSquare },
	{ href: "/admin/reviews", label: "Reviews", icon: Star },
	{ href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
	{
		href: "/admin/access-requests",
		label: "Access Requests",
		icon: ShieldCheck,
	},
];

export function AppSidebar({ variant }: { variant: "company" | "admin" }) {
	const pathname = usePathname();
	const items = variant === "admin" ? adminNav : companyNav;
	const title = variant === "admin" ? "LogiTrack Admin" : "Company Portal";

	return (
		<Sidebar>
			<SidebarHeader className="p-4">
				<Link
					href={variant === "admin" ? "/admin" : "/company"}
					className="font-bold text-lg"
				>
					{title}
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => {
								const Icon = item.icon;
								const active =
									item.href === `/${variant}`
										? pathname === item.href
										: pathname.startsWith(item.href);
								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											render={asLinkRender(item.href)}
											isActive={active}
										>
											<Icon className="size-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="p-4">
				<Link
					href="/"
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					← Back to marketplace
				</Link>
			</SidebarFooter>
		</Sidebar>
	);
}
