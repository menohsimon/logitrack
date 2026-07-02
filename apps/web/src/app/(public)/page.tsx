"use client";

import { api } from "@logitrack/backend/convex/_generated/api";
import { buttonVariants } from "@logitrack/ui/components/button";
import { cn } from "@logitrack/ui/lib/utils";
import { useQuery } from "convex/react";
import { ArrowRight, Package, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { PendingInvitesPanel } from "@/components/company/pending-invites-panel";
import { PendingInvitesToast } from "@/components/company/pending-invites-toast";
import { CompanyCard } from "@/components/marketplace/company-card";
import { groupCompaniesByLocation } from "@/lib/company-location";
import { asRoute } from "@/lib/routes";

export default function HomePage() {
	const companies = useQuery(api.companies.listApproved, {});
	const featuredGroups = useMemo(
		() => groupCompaniesByLocation((companies ?? []).slice(0, 6)),
		[companies],
	);

	return (
		<div>
			<PendingInvitesToast />
			<section className="container mx-auto px-4 py-16 md:py-24">
				<div className="max-w-2xl">
					<h1 className="mb-4 font-bold text-4xl tracking-tight md:text-5xl">
						Track every shipment. Trust every company.
					</h1>
					<p className="mb-8 text-lg text-muted-foreground">
						LogiTrack is a marketplace for verified transport companies. Book
						and track your cargo from pickup to delivery with proof at every
						step.
					</p>
					<div className="flex flex-wrap gap-3">
						<Link
							href="/companies"
							className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
						>
							Explore <ArrowRight className="ml-2 size-4" />
						</Link>
						<Link
							href={asRoute("/sign-in?redirect_url=/company/onboarding")}
							className={cn(
								buttonVariants({ variant: "outline", size: "lg" }),
								"rounded-full",
							)}
						>
							For companies
						</Link>
						<Link
							href={asRoute("/track")}
							className={cn(
								buttonVariants({ variant: "ghost", size: "lg" }),
								"rounded-full",
							)}
						>
							Track Shipment
						</Link>
					</div>
				</div>
			</section>

			<PendingInvitesPanel className="container mx-auto mb-10" />

			<section className="border-t bg-muted/30 py-16">
				<div className="container mx-auto px-4">
					<h2 className="mb-8 font-bold text-2xl">Why LogiTrack</h2>
					<div className="grid gap-6 md:grid-cols-3">
						{[
							{
								icon: Shield,
								title: "Verified Companies",
								desc: "Every company is admin-approved before listing.",
							},
							{
								icon: Package,
								title: "Proof at Every Step",
								desc: "Photo proof at pickup and delivery.",
							},
							{
								icon: Truck,
								title: "Live Status Timeline",
								desc: "Track your shipment in real time.",
							},
						].map((item) => (
							<div
								key={item.title}
								className="rounded-2xl border bg-background p-6"
							>
								<item.icon className="mb-3 size-8 text-primary" />
								<h3 className="mb-1 font-semibold">{item.title}</h3>
								<p className="text-muted-foreground text-sm">{item.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="container mx-auto px-4 py-16">
				<div className="mb-8 flex items-center justify-between">
					<h2 className="font-bold text-2xl">Featured Companies</h2>
					<Link
						href="/companies"
						className="text-primary text-sm hover:underline"
					>
						View all
					</Link>
				</div>
				{companies === undefined ? (
					<p className="text-muted-foreground">Loading...</p>
				) : companies.length === 0 ? (
					<p className="text-muted-foreground">
						No companies yet. Check back soon!
					</p>
				) : (
					<div className="space-y-8">
						{featuredGroups.map((group) => (
							<section key={group.location}>
								<div className="mb-3 flex items-center justify-between">
									<h3 className="font-semibold">{group.location}</h3>
									<span className="text-muted-foreground text-sm">
										{`${group.companies.length} ${
											group.companies.length === 1 ? "company" : "companies"
										}`}
									</span>
								</div>
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{group.companies.map((company) => (
										<CompanyCard key={company._id} company={company} />
									))}
								</div>
							</section>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
