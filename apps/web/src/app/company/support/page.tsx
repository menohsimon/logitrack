"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@logitrack/ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@logitrack/ui/components/table";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDateTime, formatStatus } from "@/lib/format";

const TICKET_CATEGORIES = [
	"lost_cargo",
	"damaged_cargo",
	"delayed_shipment",
	"driver_issue",
	"company_issue",
	"booking_issue",
	"account_issue",
	"review_issue",
	"verification_issue",
	"other",
] as const;

function SupportDesk({ companyId }: { companyId: Id<"companies"> }) {
	const tickets = useQuery(api.support.listForCompany, { companyId });
	const createTicket = useMutation(api.support.create);
	const addMessage = useMutation(api.support.addMessage);

	const [selectedTicketId, setSelectedTicketId] =
		useState<Id<"supportTickets"> | null>(null);
	const ticketDetail = useQuery(
		api.support.getById,
		selectedTicketId ? { ticketId: selectedTicketId } : "skip",
	);

	const [subject, setSubject] = useState("");
	const [category, setCategory] = useState<string>("other");
	const [message, setMessage] = useState("");
	const [creating, setCreating] = useState(false);
	const [reply, setReply] = useState("");
	const [replying, setReplying] = useState(false);

	async function handleCreate(e: FormEvent) {
		e.preventDefault();
		if (!subject.trim() || !message.trim()) {
			toast.error("Subject and message are required");
			return;
		}
		setCreating(true);
		try {
			const ticketId = await createTicket({
				subject: subject.trim(),
				message: message.trim(),
				category: category as (typeof TICKET_CATEGORIES)[number],
				companyId,
			});
			toast.success("Support ticket created");
			setSubject("");
			setMessage("");
			setSelectedTicketId(ticketId);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create ticket",
			);
		} finally {
			setCreating(false);
		}
	}

	async function handleReply() {
		if (!selectedTicketId || !reply.trim()) return;
		setReplying(true);
		try {
			await addMessage({ ticketId: selectedTicketId, message: reply.trim() });
			toast.success("Reply sent");
			setReply("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to send reply");
		} finally {
			setReplying(false);
		}
	}

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>New ticket</CardTitle>
						<CardDescription>
							Contact LogiTrack support about company issues.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleCreate} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="subject">Subject</Label>
								<Input
									id="subject"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<p className="font-medium text-sm">Category</p>
								<Select
									value={category}
									onValueChange={(v) => setCategory(v ?? "other")}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TICKET_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{formatStatus(cat)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="message">Message</Label>
								<Textarea
									id="message"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={4}
									required
								/>
							</div>
							<Button type="submit" disabled={creating}>
								{creating ? "Creating..." : "Create ticket"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Company tickets</CardTitle>
					</CardHeader>
					<CardContent>
						{tickets === undefined ? (
							<p className="text-muted-foreground text-sm">
								Loading tickets...
							</p>
						) : tickets.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No support tickets yet
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Ticket</TableHead>
										<TableHead>Subject</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tickets.map((ticket) => (
										<TableRow
											key={ticket._id}
											className="cursor-pointer"
											onClick={() => setSelectedTicketId(ticket._id)}
										>
											<TableCell className="font-medium">
												{ticket.ticketNumber}
											</TableCell>
											<TableCell className="max-w-[180px] truncate">
												{ticket.subject}
											</TableCell>
											<TableCell>
												<StatusBadge status={ticket.status} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>

			<Card className="h-fit">
				<CardHeader>
					<CardTitle>Ticket detail</CardTitle>
					<CardDescription>
						{selectedTicketId
							? "View conversation and reply"
							: "Select a ticket to view"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!selectedTicketId ? (
						<p className="text-muted-foreground text-sm">
							Click a ticket from the list to view messages.
						</p>
					) : ticketDetail === undefined ? (
						<p className="text-muted-foreground text-sm">Loading...</p>
					) : !ticketDetail ? (
						<p className="text-muted-foreground text-sm">Ticket not found</p>
					) : (
						<div className="space-y-4">
							<div>
								<p className="font-medium">{ticketDetail.ticket.subject}</p>
								<div className="mt-1 flex flex-wrap items-center gap-2">
									<StatusBadge status={ticketDetail.ticket.status} />
									<span className="text-muted-foreground text-xs">
										{formatStatus(ticketDetail.ticket.category)} ·{" "}
										{formatDateTime(ticketDetail.ticket.createdAt)}
									</span>
								</div>
							</div>

							<div className="max-h-80 space-y-3 overflow-y-auto">
								{ticketDetail.messages.map((msg) => (
									<div
										key={msg._id}
										className={`rounded-2xl p-3 text-sm ${
											msg.senderRole === "admin"
												? "ml-4 bg-muted"
												: "mr-4 bg-primary/5"
										}`}
									>
										<p className="mb-1 text-muted-foreground text-xs">
											{formatStatus(msg.senderRole)} ·{" "}
											{formatDateTime(msg.createdAt)}
										</p>
										<p>{msg.message}</p>
									</div>
								))}
							</div>

							{!["resolved", "closed"].includes(ticketDetail.ticket.status) && (
								<div className="space-y-2 border-t pt-4">
									<Label htmlFor="reply">Reply</Label>
									<Textarea
										id="reply"
										value={reply}
										onChange={(e) => setReply(e.target.value)}
										rows={3}
									/>
									<Button disabled={replying} onClick={handleReply}>
										{replying ? "Sending..." : "Send reply"}
									</Button>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanySupportPage() {
	return (
		<DashboardShell variant="company" title="Support">
			<CompanySetup>
				{({ companyId }) => <SupportDesk companyId={companyId} />}
			</CompanySetup>
		</DashboardShell>
	);
}
