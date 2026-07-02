"use client";

import { AuthGate } from "@/components/auth-gate";
import { BookingFormContent } from "@/components/marketplace/booking-form-content";
import { useParams } from "next/navigation";

export default function BookCompanyPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <AuthGate>
        <BookingFormContent slug={slug} companyBasePath="/companies" />
      </AuthGate>
    </div>
  );
}