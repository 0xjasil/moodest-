import React from "react";
import { Metadata } from "next";
import { CustomerOverviewPage } from "@/components/admin/customer/customer-overview-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Customer ${id} Overview - Commerce Admin`,
  };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <CustomerOverviewPage />
    </div>
  );
}