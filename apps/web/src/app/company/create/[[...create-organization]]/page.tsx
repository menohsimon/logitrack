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
import { Input } from "@logitrack/ui/components/input";
import { Label } from "@logitrack/ui/components/label";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthGate } from "@/components/auth-gate";
import Loader from "@/components/loader";
import { asRoute } from "@/lib/routes";

function CreateCompanyContent() {
	const router = useRouter();
	const currentCompany = useQuery(api.companies.getCurrentCompany, {});
	const createCompany = useMutation(api.companies.createCompany);
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (currentCompany?.company) {
			router.replace(asRoute("/company"));
		}
	}, [currentCompany, router]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!name.trim()) {
			toast.error("Company name is required");
			return;
		}

		setIsSubmitting(true);
		try {
			await createCompany({ name });
			toast.success("Company created");
			router.replace(asRoute("/company"));
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to create company",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (currentCompany === undefined) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-muted/30">
				<Loader />
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<header className="flex items-center justify-between border-b bg-background px-6 py-4">
				<Link href="/" className="font-bold text-lg">
					LogiTrack
				</Link>
				<Link
					href={asRoute("/company/onboarding")}
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					Back
				</Link>
			</header>
			<main className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-lg space-y-4">
					<div className="space-y-1 text-center">
						<h1 className="font-bold text-xl">Create your company</h1>
						<p className="text-muted-foreground text-sm">
							This creates a company profile and makes you the owner.
						</p>
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Company details</CardTitle>
							<CardDescription>
								You can complete verification details after creation.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-4" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="company-name">Company name</Label>
									<Input
										id="company-name"
										value={name}
										onChange={(event) => setName(event.target.value)}
										placeholder="Acme Logistics"
										autoComplete="organization"
									/>
								</div>
								<Button
									type="submit"
									className="w-full"
									disabled={isSubmitting}
								>
									{isSubmitting ? "Creating..." : "Create company"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

export default function CreateCompanyPage() {
	return (
		<AuthGate>
			<CreateCompanyContent />
		</AuthGate>
	);
}
