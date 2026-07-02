"use client";

import { useAuth } from "@clerk/nextjs";
import { buttonVariants } from "@logitrack/ui/components/button";
import { cn } from "@logitrack/ui/lib/utils";
import Link from "next/link";

import { asRoute } from "@/lib/routes";
import { ModeToggle } from "./mode-toggle";

export function PublicHeader() {
	const { isSignedIn } = useAuth();

	const companyHref = isSignedIn
		? "/company"
		: "/sign-in?redirect_url=/company/onboarding";

	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<Link href="/" className="font-bold text-lg">
					LogiTrack
				</Link>
				<nav className="hidden items-center gap-4 text-sm sm:flex sm:gap-6">
					<Link
						href="/companies"
						className="text-muted-foreground hover:text-foreground"
					>
						Explore
					</Link>
					<Link
						href={asRoute(companyHref)}
						className="hidden text-muted-foreground hover:text-foreground sm:inline"
					>
						For companies
					</Link>
					<Link
						href="/dashboard"
						className="hidden text-muted-foreground hover:text-foreground md:inline"
					>
						My Shipments
					</Link>
				</nav>
				<div className="flex items-center gap-2">
					<ModeToggle />
					{isSignedIn ? (
						<>
							<Link
								href={asRoute("/company")}
								className={cn(
									buttonVariants({ variant: "outline", size: "sm" }),
									"hidden rounded-full sm:inline-flex",
								)}
							>
								Company
							</Link>
							<Link
								href={asRoute("/dashboard")}
								className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
							>
								Dashboard
							</Link>
						</>
					) : (
						<>
							<Link
								href={asRoute(companyHref)}
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									"hidden rounded-full sm:inline-flex",
								)}
							>
								Companies
							</Link>
							<Link
								href={asRoute("/sign-in")}
								className={cn(
									buttonVariants({ variant: "ghost", size: "sm" }),
									"rounded-full",
								)}
							>
								Sign In
							</Link>
							<Link
								href={asRoute("/sign-up")}
								className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
							>
								Sign Up
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
