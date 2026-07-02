"use client";

import { CompanyProfileContent } from "@/components/marketplace/company-profile-content";
import { useParams } from "next/navigation";

export default function DashboardCompanyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <CompanyProfileContent
      slug={slug}
      basePath="/dashboard/companies"
      backHref="/dashboard/explore"
      backLabel="Back to explore"
    />
  );
}