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
import { useMutation } from "convex/react";
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanySetup } from "@/components/company/company-setup";
import { StatusBadge } from "@/components/company/status-badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatDateTime } from "@/lib/format";
import { asLinkRender } from "@/lib/render-adapters";

function VerificationContent({
	companyId,
	company,
}: {
	companyId: Id<"companies">;
	company: {
		name: string;
		contactEmail?: string;
		status: string;
		verificationStatus: string;
		verificationNotes?: string;
		operatingRegions: string[];
		cargoCategories: string[];
		updatedAt: number;
	};
}) {
	const submitForVerification = useMutation(
		api.companies.submitForVerification,
	);
	const [submitting, setSubmitting] = useState(false);

	const canSubmit =
		["draft", "rejected"].includes(company.status) &&
		["not_submitted", "rejected"].includes(company.verificationStatus);

	const profileComplete = Boolean(
		company.name &&
			company.contactEmail &&
			company.operatingRegions.length > 0 &&
			company.cargoCategories.length > 0,
	);

	async function handleSubmit() {
		setSubmitting(true);
		try {
			await submitForVerification({ companyId });
			toast.success(
				"Verification submitted. Our team will review your application.",
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Failed to submit");
		} finally {
			setSubmitting(false);
		}
	}

	const statusIcon =
		{
			not_submitted: AlertCircle,
			pending: Clock,
			approved: CheckCircle2,
			rejected: XCircle,
		}[company.verificationStatus] ?? AlertCircle;

	const StatusIcon = statusIcon;

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Verification status</CardTitle>
					<CardDescription>
						Approved companies appear in the public marketplace and can receive
						bookings.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-start gap-4 rounded-2xl border p-4">
						<StatusIcon className="size-8 shrink-0 text-muted-foreground" />
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge status={company.verificationStatus} />
								<StatusBadge status={company.status} />
							</div>
							<p className="text-muted-foreground text-sm">
								Last updated {formatDateTime(company.updatedAt)}
							</p>
							{company.verificationNotes && (
								<div className="rounded-xl bg-muted p-3 text-sm">
									<p className="mb-1 font-medium">Admin notes</p>
									<p className="text-muted-foreground">
										{company.verificationNotes}
									</p>
								</div>
							)}
						</div>
					</div>

					{company.verificationStatus === "pending" && (
						<p className="text-muted-foreground text-sm">
							Your application is under review. You will be notified once a
							decision is made.
						</p>
					)}

					{company.verificationStatus === "approved" && (
						<p className="text-emerald-700 text-sm">
							Your company is verified and visible in the marketplace.
						</p>
					)}

					{company.verificationStatus === "rejected" && (
						<p className="text-destructive text-sm">
							Your verification was rejected. Update your profile and resubmit
							when ready.
						</p>
					)}
				</CardContent>
			</Card>

			{canSubmit && (
				<Card>
					<CardHeader>
						<CardTitle>Submit for verification</CardTitle>
						<CardDescription>
							Complete your contact details, operating regions, and cargo
							categories before submitting.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{!profileComplete && (
							<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
								<p className="font-medium">Profile incomplete</p>
								<p>
									Add a contact email, at least one operating region, and at
									least one cargo category before submitting.
								</p>
								<Button
									render={asLinkRender("/company/profile")}
									variant="outline"
									size="sm"
									className="mt-2"
								>
									Edit profile
								</Button>
							</div>
						)}
						<Button
							onClick={handleSubmit}
							disabled={submitting || !profileComplete}
						>
							{submitting ? "Submitting..." : "Submit for verification"}
						</Button>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Requirements</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
						<li>Company display name and contact email</li>
						<li>Operating regions and cargo categories</li>
						<li>Valid business documentation (reviewed by admin)</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

export default function CompanyVerificationPage() {
	return (
		<DashboardShell variant="company" title="Verification">
			<CompanySetup>
				{({ companyId, company }) => (
					<VerificationContent companyId={companyId} company={company} />
				)}
			</CompanySetup>
		</DashboardShell>
	);
}
