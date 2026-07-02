"use client";
import { asLinkRender } from "@/lib/render-adapters";

import type { Id } from "@logitrack/backend/convex/_generated/dataModel";
import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import { Textarea } from "@logitrack/ui/components/textarea";
import { cn } from "@logitrack/ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/mobile/status-pill";
import { formatDateTime, formatStatus } from "@/lib/format";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as Id<"supportTickets">;

  const data = useQuery(api.support.getById, { ticketId });
  const addMessage = useMutation(api.support.addMessage);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await addMessage({ ticketId, message: message.trim() });
      toast.success("Message sent");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  if (data === undefined) {
    return <p className="text-sm text-muted-foreground py-8">Loading ticket...</p>;
  }

  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button
          render={asLinkRender("/dashboard/support")}
          variant="outline"
          className="mt-4"
        >
          Back to support
        </Button>
      </div>
    );
  }

  const { ticket, messages } = data;
  const isClosed = ["resolved", "closed"].includes(ticket.status);

  return (
    <div className="flex flex-col min-h-[calc(100svh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Button
          render={asLinkRender("/dashboard/support")}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
          <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
        </div>
        <StatusPill status={ticket.status} />
      </div>

      <div className="rounded-2xl border bg-background px-3 py-2 mb-4 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>{formatStatus(ticket.category)}</span>
        <span>Priority: {formatStatus(ticket.priority)}</span>
        <span>Opened {formatDateTime(ticket.createdAt)}</span>
      </div>

      <div className="flex-1 space-y-3 mb-4">
        {messages.map((msg) => {
          const isUser = msg.senderRole === "user";
          return (
            <div
              key={msg._id}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  isUser
                    ? "bg-foreground text-background rounded-br-md"
                    : "bg-background border rounded-bl-md",
                )}
              >
                <p className="text-[10px] opacity-70 mb-1">
                  {formatStatus(msg.senderRole)} · {formatDateTime(msg.createdAt)}
                </p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!isClosed ? (
        <form onSubmit={handleSend} className="sticky bottom-0 bg-muted/30 pt-2 pb-1">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="flex-1 min-h-0"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0 self-end"
              disabled={sending || !message.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-center text-muted-foreground py-4">
          This ticket is {formatStatus(ticket.status).toLowerCase()}
        </p>
      )}
    </div>
  );
}