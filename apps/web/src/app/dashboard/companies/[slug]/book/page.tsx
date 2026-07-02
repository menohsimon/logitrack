"use client";

import { useParams } from "next/navigation";
import { BookingFormContent } from "@/components/marketplace/booking-form-content";

export default function DashboardBookCompanyPage() {
	const params = useParams<{ slug: string }>();
	const slug = params.slug;

	return (
		<div>
			<BookingFormContent slug={slug} companyBasePath="/dashboard/companies" />
		</div>
	);
}
