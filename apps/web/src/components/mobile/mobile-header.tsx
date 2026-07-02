"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@logitrack/backend/convex/_generated/api";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@logitrack/ui/components/avatar";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { asRoute } from "@/lib/routes";

export function MobileHeader({ subtitle }: { subtitle?: string }) {
	const { user } = useUser();
	const pathname = usePathname();
	const convexUser = useQuery(api.users.getCurrentUser);
	const unread = useQuery(api.notifications.unreadCount);

	const name = convexUser?.name ?? user?.firstName ?? "User";
	const address =
		subtitle ?? convexUser?.address ?? "Set your address in profile";
	const notificationsHref = pathname.startsWith("/driver")
		? "/driver/notifications"
		: "/dashboard/notifications";

	return (
		<header className="mb-6 flex items-center justify-between lg:hidden">
			<div className="flex items-center gap-3">
				<Avatar className="size-12">
					<AvatarImage src={convexUser?.avatarUrl ?? user?.imageUrl} />
					<AvatarFallback>{name.charAt(0)}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-muted-foreground text-sm">Hello,</p>
					<p className="font-bold text-lg uppercase tracking-tight">{name}</p>
					<p className="text-muted-foreground text-xs">{address}</p>
				</div>
			</div>
			<Link
				href={asRoute(notificationsHref)}
				className="relative rounded-full border bg-background p-2.5 shadow-sm"
			>
				<Bell className="size-5" />
				{unread !== undefined && unread > 0 && (
					<span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
						{unread > 9 ? "9+" : unread}
					</span>
				)}
			</Link>
		</header>
	);
}
