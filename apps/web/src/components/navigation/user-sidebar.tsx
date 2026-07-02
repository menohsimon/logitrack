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
import { Home, MessageSquare, Package, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { userNavItems } from "@/components/navigation/nav-config";
import { asLinkRender } from "@/lib/render-adapters";

const userItems = userNavItems;

const driverItems = [
	{ href: "/driver", icon: Home, label: "Home" },
	{ href: "/driver/shipments", icon: Package, label: "Shipments" },
	{ href: "/driver/support", icon: MessageSquare, label: "Support" },
	{ href: "/driver/profile", icon: User, label: "Profile" },
];

export function UserSidebar({ variant }: { variant: "user" | "driver" }) {
	const pathname = usePathname();
	const items = variant === "driver" ? driverItems : userItems;
	const title = variant === "driver" ? "Driver Portal" : "LogiTrack";

	return (
		<Sidebar>
			<SidebarHeader className="p-4">
				<Link
					href={variant === "driver" ? "/driver" : "/dashboard"}
					className="font-bold text-lg"
				>
					{title}
				</Link>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Menu</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => {
								const Icon = item.icon;
								const active =
									item.href === "/dashboard" || item.href === "/driver"
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
					← Back to site
				</Link>
			</SidebarFooter>
		</Sidebar>
	);
}
