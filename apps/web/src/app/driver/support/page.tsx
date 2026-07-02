"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { Button } from "@logitrack/ui/components/button";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function DriverSupportPage() {
	const searchParams = useSearchParams();
	const shipmentIdParam = searchParams.get("shipmentId");

	const tickets = useQuery(api.support.listForCurrentUser);
	const createTicket = useMutation(api.support.create);
	const addMessage = useMutation(api.support.addMessage);

	const [subject, setSubject] = useState(
		shipmentIdParam ? "Help with shipment" : "",
	);
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [selectedTicketId, setSelectedTicketId] =
		useState<Id<"supportTickets"> | null>(null);
	const [reply, setReply] = useState("");
	const [replying, setReplying] = useState(false);

	const ticketDetail = useQuery(
		api.support.getById,
		selectedTicketId ? { ticketId: selectedTicketId } : "skip",
	);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!subject.trim() || !message.trim()) {
			toast.error("Subject and message are required");
			return;
		}

		setSubmitting(true);
		try {
			const ticketId = await createTicket({
				subject: subject.trim(),
				message: message.trim(),
				category: "driver_issue",
				shipmentId: shipmentIdParam
					? (shipmentIdParam as Id<"shipments">)
					: undefined,
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
			setSubmitting(false);
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
		<div>
			<MobileHeader subtitle="Driver support" />

			<section className="mb-6 rounded-3xl border bg-background p-4">
				<h2 className="mb-3 font-bold">New Ticket</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="subject">Subject</Label>
						<Input
							id="subject"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="What do you need help with?"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="message">Message</Label>
						<Textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Describe the issue..."
							rows={4}
						/>
					</div>
					<Button
						type="submit"
						className="w-full rounded-full"
						disabled={submitting}
					>
						{submitting ? "Submitting..." : "Submit Ticket"}
					</Button>
				</form>
			</section>

			<section>
				<h2 className="mb-3 font-bold">Your Tickets</h2>
				{tickets === undefined ? (
					<p className="text-muted-foreground text-sm">Loading tickets...</p>
				) : tickets.length === 0 ? (
					<div className="rounded-3xl border bg-background p-8 text-center">
						<MessageSquare className="mx-auto mb-3 size-10 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							No support tickets yet
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{tickets.map((ticket) => (
							<button
								key={ticket._id}
								type="button"
								className="w-full rounded-2xl border bg-background p-4 text-left"
								onClick={() => setSelectedTicketId(ticket._id)}
							>
								<div className="flex items-center justify-between gap-2">
									<p className="truncate font-medium text-sm">
										{ticket.subject}
									</p>
									<span className="shrink-0 text-muted-foreground text-xs capitalize">
										{ticket.status.replaceAll("_", " ")}
									</span>
								</div>
								<p className="mt-1 text-muted-foreground text-xs">
									{ticket.ticketNumber} · {formatDateTime(ticket.createdAt)}
								</p>
							</button>
						))}
					</div>
				)}
			</section>

			{selectedTicketId && (
				<section className="mt-6 rounded-3xl border bg-background p-4">
					{ticketDetail === undefined ? (
						<p className="text-muted-foreground text-sm">Loading ticket...</p>
					) : !ticketDetail ? (
						<p className="text-muted-foreground text-sm">Ticket not found</p>
					) : (
						<div className="space-y-4">
							<div>
								<h2 className="font-bold">{ticketDetail.ticket.subject}</h2>
								<p className="text-muted-foreground text-xs">
									{ticketDetail.ticket.ticketNumber} ·{" "}
									{formatStatus(ticketDetail.ticket.status)}
								</p>
							</div>
							<div className="space-y-3">
								{ticketDetail.messages.map((msg) => (
									<div
										key={msg._id}
										className={`rounded-2xl p-3 text-sm ${
											msg.senderRole === "admin"
												? "ml-5 bg-muted"
												: "mr-5 bg-primary/5"
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
									<Button
										className="w-full rounded-full"
										disabled={replying}
										onClick={handleReply}
									>
										{replying ? "Sending..." : "Send reply"}
									</Button>
								</div>
							)}
						</div>
					)}
				</section>
			)}

			<Link
				href="/driver"
				className="mt-6 block text-center text-primary text-sm"
			>
				Back to driver home
			</Link>
		</div>
	);
}
