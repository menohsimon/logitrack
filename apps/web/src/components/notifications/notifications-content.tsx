"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { cn } from "@logitrack/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { asRoute } from "@/lib/routes";

type NotificationArea = "dashboard" | "driver";

function getNotificationLink(
	notification: {
		relatedShipmentId?: string;
		relatedBookingId?: string;
		relatedTicketId?: string;
	},
	area: NotificationArea,
): string | null {
	if (area === "driver") {
		if (notification.relatedShipmentId) {
			return `/driver/shipments/${notification.relatedShipmentId}`;
		}
		if (notification.relatedTicketId) {
			return "/driver/support";
		}
		return null;
	}

	if (notification.relatedShipmentId) {
		return `/dashboard/shipments/${notification.relatedShipmentId}`;
	}
	if (notification.relatedBookingId) {
		return `/dashboard/bookings/${notification.relatedBookingId}`;
	}
	if (notification.relatedTicketId) {
		return `/dashboard/support/${notification.relatedTicketId}`;
	}
	return null;
}

export function NotificationsContent({
	area,
	backHref,
}: {
	area: NotificationArea;
	backHref: string;
}) {
	const notifications = useQuery(api.notifications.listForCurrentUser, {
		limit: 50,
	});
	const router = useRouter();
	const markAsRead = useMutation(api.notifications.markAsRead);
	const markAllAsRead = useMutation(api.notifications.markAllAsRead);
	const acceptInvite = useMutation(api.companies.acceptInvite);
	const declineInvite = useMutation(api.companies.declineInvite);

	const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;

	async function handleMarkRead(notificationId: Id<"notifications">) {
		try {
			await markAsRead({ notificationId });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to mark as read",
			);
		}
	}

	async function handleMarkAllRead() {
		try {
			await markAllAsRead({});
			toast.success("All notifications marked as read");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to mark all as read",
			);
		}
	}

	async function handleAcceptInvite(inviteId: Id<"companyInvites">) {
		try {
			const result = await acceptInvite({ inviteId });
			toast.success("Invite accepted");
			router.replace(asRoute(result.redirectTo));
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to accept invite",
			);
		}
	}

	async function handleDeclineInvite(inviteId: Id<"companyInvites">) {
		try {
			await declineInvite({ inviteId });
			toast.success("Invite declined");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to decline invite",
			);
		}
	}

	return (
		<div>
			<div className="mb-6 flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					className="rounded-full"
					onClick={() => {
						if (window.history.length > 1) {
							router.back();
						} else {
							router.push(asRoute(backHref));
						}
					}}
				>
					<ArrowLeft className="size-5" />
				</Button>
				<div className="flex-1">
					<h1 className="font-bold text-xl">Notifications</h1>
					{unreadCount > 0 && (
						<p className="text-muted-foreground text-xs">
							{unreadCount} unread
						</p>
					)}
				</div>
				{unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						className="rounded-full"
						onClick={handleMarkAllRead}
					>
						Mark all read
					</Button>
				)}
			</div>

			{notifications === undefined ? (
				<p className="text-muted-foreground text-sm">
					Loading notifications...
				</p>
			) : notifications.length === 0 ? (
				<div className="rounded-3xl border bg-background p-8 text-center">
					<Bell className="mx-auto mb-3 size-10 text-muted-foreground" />
					<p className="font-medium">No notifications</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Updates about your shipments and bookings will appear here
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{notifications.map((notification) => {
						const href = getNotificationLink(notification, area);
						const isUnread = !notification.readAt;
						const inviteId =
							notification.type === "company_invite"
								? notification.relatedCompanyInviteId
								: undefined;

						const content = (
							<div
								className={cn(
									"rounded-2xl border p-4 transition-colors",
									isUnread
										? "border-primary/20 bg-background"
										: "bg-background/60",
								)}
							>
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0 flex-1">
										<p className={cn("text-sm", isUnread && "font-semibold")}>
											{notification.title}
										</p>
										{notification.body && (
											<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
												{notification.body}
											</p>
										)}
										<p className="mt-2 text-muted-foreground text-xs">
											{formatDateTime(notification.createdAt)}
										</p>
										{inviteId && (
											<div className="mt-3 flex flex-wrap gap-2">
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleDeclineInvite(inviteId)}
												>
													Decline
												</Button>
												<Button
													size="sm"
													onClick={() => handleAcceptInvite(inviteId)}
												>
													Accept
												</Button>
											</div>
										)}
									</div>
									{isUnread && (
										<span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
									)}
								</div>
							</div>
						);

						if (inviteId) {
							return <div key={notification._id}>{content}</div>;
						}

						if (href) {
							return (
								<Link
									key={notification._id}
									href={asRoute(href)}
									onClick={() => {
										if (isUnread) handleMarkRead(notification._id);
									}}
								>
									{content}
								</Link>
							);
						}

						return (
							<button
								key={notification._id}
								type="button"
								className="w-full text-left"
								onClick={() => {
									if (isUnread) handleMarkRead(notification._id);
								}}
							>
								{content}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
