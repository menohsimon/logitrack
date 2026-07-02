"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { Button } from "@logitrack/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@logitrack/ui/components/card";
import { useQuery } from "convex/react";
import { Building2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthGate } from "@/components/auth-gate";
import Loader from "@/components/loader";
import { asLinkRender } from "@/lib/render-adapters";
import { asRoute } from "@/lib/routes";

function CompanyOnboardingContent() {
	const router = useRouter();
	const currentCompany = useQuery(api.companies.getCurrentCompany, {});
	const pendingInvites = useQuery(
		api.companies.listPendingInvitesForCurrentUser,
		{},
	);

	useEffect(() => {
		if (currentCompany?.company) {
			router.replace(asRoute("/company"));
		}
	}, [currentCompany, router]);

	if (currentCompany === undefined || currentCompany === null) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-muted/30">
				<Loader />
			</div>
		);
	}

	if (currentCompany.company) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-muted/30">
				<Loader />
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<header className="border-b bg-background px-6 py-4">
				<Link href="/" className="font-bold text-lg">
					LogiTrack
				</Link>
			</header>
			<main className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-lg space-y-6">
					<div className="space-y-2 text-center">
						<h1 className="font-bold text-2xl">Company portal</h1>
						<p className="text-muted-foreground text-sm">
							Create a company profile or accept a pending team invite.
						</p>
					</div>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="size-5" />
								Create a company
							</CardTitle>
							<CardDescription>
								Register a transport company and become the owner.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								render={asLinkRender("/company/create")}
								className="w-full rounded-full"
							>
								Create company
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-3xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="size-5" />
								Join a company
							</CardTitle>
							<CardDescription>
								{pendingInvites && pendingInvites.length > 0
									? `${pendingInvites.length} pending invite${
											pendingInvites.length === 1 ? "" : "s"
										} found for your email.`
									: "Pending invites for your email appear here after they are sent."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								render={asLinkRender("/company/select")}
								variant="outline"
								className="w-full rounded-full"
							>
								View invites and companies
							</Button>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

export default function CompanyOnboardingPage() {
	return (
		<AuthGate>
			<CompanyOnboardingContent />
		</AuthGate>
	);
}
