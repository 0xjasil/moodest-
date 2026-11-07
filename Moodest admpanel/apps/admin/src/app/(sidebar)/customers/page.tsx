import React from "react";
import { Metadata } from "next";
import { CustomerListPage } from "@/components/admin/customer/customer-list-page";

export const metadata: Metadata = {
  title: "All Customers - Commerce Admin",
  description: "Manage customer profiles, order history, and contact information.",
};

export default function CustomersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <CustomerListPage />
    </div>
  );
}
