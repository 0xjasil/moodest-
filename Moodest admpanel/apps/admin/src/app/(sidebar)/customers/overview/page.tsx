import React from "react";
import { Metadata } from "next";
import { CustomerOverviewPage } from "@/components/admin/customer/customer-overview-page";

export const metadata: Metadata = {
  title: "Customer Overview - Commerce Admin",
  description: "View comprehensive customer profile, balance, loyalty status, wishlist, and orders placed.",
};

export default function OverviewPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <CustomerOverviewPage />
    </div>
  );
}
