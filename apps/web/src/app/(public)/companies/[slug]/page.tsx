"use client";

import { CompanyProfileContent } from "@/components/marketplace/company-profile-content";
import { useParams } from "next/navigation";

export default function CompanyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <CompanyProfileContent
        slug={slug}
        basePath="/companies"
        backHref="/companies"
        backLabel="Back to marketplace"
      />
    </div>
  );
}