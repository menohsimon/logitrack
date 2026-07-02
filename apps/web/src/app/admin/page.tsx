"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Badge } from "@logitrack/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";

import { Building2, MessageSquare, Package, Truck, Users } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAdminQuery } from "@/hooks/use-admin-access";
import { formatDateTime, formatStatus } from "@/lib/format";
import { asRoute } from "@/lib/routes";

export default function AdminDashboardPage() {
	const stats = useAdminQuery(api.admin.getDashboardStats, {});

	return (
		<DashboardShell variant="admin" title="Admin Dashboard">
			{stats === undefined ? (
				<p className="text-muted-foreground">Loading...</p>
			) : (
				<div className="space-y-8">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{
								label: "Users",
								value: stats.totalUsers,
								icon: Users,
								href: "/admin/users",
							},
							{
								label: "Companies",
								value: stats.totalCompanies,
								icon: Building2,
								href: "/admin/companies",
							},
							{
								label: "Bookings",
								value: stats.totalBookings,
								icon: Package,
								href: "/admin/bookings",
							},
							{
								label: "Shipments",
								value: stats.totalShipments,
								icon: Truck,
								href: "/admin/shipments",
							},
						].map((item) => (
							<Link key={item.label} href={asRoute(item.href)}>
								<Card className="transition-shadow hover:shadow-md">
									<CardHeader className="flex flex-row items-center justify-between pb-2">
										<CardTitle className="font-medium text-muted-foreground text-sm">
											{item.label}
										</CardTitle>
										<item.icon className="size-4 text-muted-foreground" />
									</CardHeader>
									<CardContent>
										<p className="font-bold text-2xl">{item.value}</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-sm">
									Pending Companies
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">{stats.pendingCompanies}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-sm">
									Open Tickets
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">{stats.openTickets}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-sm">
									Active Shipments
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">{stats.activeShipments}</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-sm">
									Awaiting Closure
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">
									{stats.awaitingDriverClosureShipments}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-muted-foreground text-sm">
									Completed Shipments
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl">{stats.completedShipments}</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Pending Verifications
								</CardTitle>
							</CardHeader>
							<CardContent>
								{stats.pendingCompanyList.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No pending companies
									</p>
								) : (
									<div className="space-y-3">
										{stats.pendingCompanyList.map((company) => (
											<Link
												key={company._id}
												href={`/admin/companies/${company._id}`}
												className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
											>
												<span className="font-medium">{company.name}</span>
												<Badge variant="outline">Pending</Badge>
											</Link>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Open Support Tickets
								</CardTitle>
							</CardHeader>
							<CardContent>
								{stats.openTicketList.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										No open tickets
									</p>
								) : (
									<div className="space-y-3">
										{stats.openTicketList.map((ticket) => (
											<Link
												key={ticket._id}
												href={`/admin/support/${ticket._id}`}
												className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
											>
												<div>
													<p className="font-medium text-sm">
														{ticket.subject}
													</p>
													<p className="text-muted-foreground text-xs">
														{ticket.ticketNumber}
													</p>
												</div>
												<MessageSquare className="size-4 text-muted-foreground" />
											</Link>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Recent Admin Actions</CardTitle>
						</CardHeader>
						<CardContent>
							{stats.recentActions.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No recent actions
								</p>
							) : (
								<div className="space-y-2">
									{stats.recentActions.map((action) => (
										<div
											key={action._id}
											className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
										>
											<span>
												{formatStatus(action.actionType)} · {action.targetType}
											</span>
											<span className="text-muted-foreground text-xs">
												{formatDateTime(action.createdAt)}
											</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</DashboardShell>
	);
}
