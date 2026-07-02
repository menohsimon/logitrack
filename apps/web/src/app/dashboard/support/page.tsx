"use client";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@logitrack/ui/components/dialog";
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@logitrack/ui/components/native-select";
import { Textarea } from "@logitrack/ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { MobileHeader } from "@/components/mobile/mobile-header";
import { StatusPill } from "@/components/mobile/status-pill";
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

type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export default function SupportPage() {
  const router = useRouter();
  const [prefillShipmentId, setPrefillShipmentId] = useState<Id<"shipments"> | null>(
    null,
  );

  const tickets = useQuery(api.support.listForCurrentUser);
  const createTicket = useMutation(api.support.create);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("shipmentId");
    if (id) {
      setPrefillShipmentId(id as Id<"shipments">);
      setOpen(true);
    }
  }, []);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
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
        category,
        shipmentId: prefillShipmentId ?? undefined,
      });
      toast.success("Support ticket created");
      setOpen(false);
      setSubject("");
      setMessage("");
      setCategory("other");
      router.push(`/dashboard/support/${ticketId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <MobileHeader subtitle="Help & support" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Support</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={(props) => (
              <Button size="sm" className="rounded-full gap-1" {...props}>
                <Plus className="size-4" />
                New Ticket
              </Button>
            )}
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-category">Category</Label>
                <NativeSelect
                  id="ticket-category"
                  className="w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                >
                  {TICKET_CATEGORIES.map((cat) => (
                    <NativeSelectOption key={cat} value={cat}>
                      {formatStatus(cat)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-message">Message</Label>
                <Textarea
                  id="ticket-message"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              {prefillShipmentId && (
                <p className="text-xs text-muted-foreground">
                  This ticket will be linked to your current shipment.
                </p>
              )}
              <Button type="submit" className="w-full rounded-full" disabled={submitting}>
                {submitting ? "Creating..." : "Submit Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border bg-background p-8 text-center">
          <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium">No support tickets</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a ticket if you need help with a shipment or booking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              href={`/dashboard/support/${ticket._id}`}
              className="block rounded-3xl border bg-background p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                </div>
                <StatusPill status={ticket.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatStatus(ticket.category)}</span>
                <span>{formatDateTime(ticket.lastMessageAt ?? ticket.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}