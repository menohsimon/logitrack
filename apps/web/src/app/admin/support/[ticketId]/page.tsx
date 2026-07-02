"use client";
import { asLinkRender } from "@/lib/render-adapters";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Badge } from "@logitrack/ui/components/badge";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Checkbox } from "@logitrack/ui/components/checkbox";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function AdminTicketDetailPage() {
	const params = useParams();
	const ticketId = params.ticketId as Id<"supportTickets">;

	const data = useQuery(api.support.getById, { ticketId });
	const addMessage = useMutation(api.support.addMessage);
	const updateStatus = useMutation(api.support.updateStatus);

	const [reply, setReply] = useState("");
	const [internalOnly, setInternalOnly] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleReply() {
		if (!reply.trim()) return;
		setLoading(true);
		try {
			await addMessage({
				ticketId,
				message: reply.trim(),
				internalOnly,
			});
			setReply("");
			setInternalOnly(false);
			toast.success("Reply sent");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to send reply");
		} finally {
			setLoading(false);
		}
	}

	async function handleStatus(status: "resolved" | "closed" | "under_review") {
		setLoading(true);
		try {
			await updateStatus({ ticketId, status });
			toast.success(`Ticket marked as ${formatStatus(status)}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update status");
		} finally {
			setLoading(false);
		}
	}

	return (
		<DashboardShell variant="admin" title="Ticket Detail">
			<Button
				render={asLinkRender("/admin/support")}
				variant="ghost"
				size="sm"
				className="mb-4 -ml-2"
			>
				← Back to support
			</Button>

			{data === undefined ? (
				<p className="text-muted-foreground">Loading...</p>
			) : data === null ? (
				<p className="text-muted-foreground">Ticket not found</p>
			) : (
				<div className="max-w-3xl space-y-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="font-bold text-xl">{data.ticket.subject}</h2>
							<p className="text-muted-foreground text-sm">
								{data.ticket.ticketNumber}
							</p>
							<div className="mt-2 flex gap-2">
								<Badge variant="outline">
									{formatStatus(data.ticket.status)}
								</Badge>
								<Badge variant="outline">
									{formatStatus(data.ticket.category)}
								</Badge>
								<Badge
									variant={
										data.ticket.priority === "urgent" ||
										data.ticket.priority === "high"
											? "destructive"
											: "secondary"
									}
								>
									{formatStatus(data.ticket.priority)}
								</Badge>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								size="sm"
								variant="outline"
								disabled={loading}
								onClick={() => handleStatus("under_review")}
							>
								Under Review
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={loading}
								onClick={() => handleStatus("resolved")}
							>
								Resolve
							</Button>
							<Button
								size="sm"
								variant="destructive"
								disabled={loading}
								onClick={() => handleStatus("closed")}
							>
								Close
							</Button>
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Conversation</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{data.messages.map((msg) => (
								<div
									key={msg._id}
									className={`rounded-lg p-4 text-sm ${
										msg.senderRole === "admin"
											? "ml-8 border border-primary/20 bg-primary/5"
											: "mr-8 bg-muted/50"
									}`}
								>
									<div className="mb-1 flex items-center justify-between">
										<span className="font-medium capitalize">
											{msg.senderRole}
										</span>
										<span className="text-muted-foreground text-xs">
											{formatDateTime(msg.createdAt)}
										</span>
									</div>
									<p className="whitespace-pre-wrap">{msg.message}</p>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Reply</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<Textarea
								value={reply}
								onChange={(e) => setReply(e.target.value)}
								placeholder="Type your reply..."
								rows={4}
							/>
							<div className="flex items-center gap-2">
								<Checkbox
									id="internalOnly"
									checked={internalOnly}
									onCheckedChange={(checked) =>
										setInternalOnly(checked === true)
									}
								/>
								<Label htmlFor="internalOnly">Internal note</Label>
							</div>
							<Button disabled={loading || !reply.trim()} onClick={handleReply}>
								Send Reply
							</Button>
						</CardContent>
					</Card>
				</div>
			)}
		</DashboardShell>
	);
}
