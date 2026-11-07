import { CustomerBillingPage } from "@/components/admin/customer/customer-billing-page";

export const metadata = {
  title: "Customer Address & Billing - eCommerce Admin",
  description: "Manage customer addresses, default shipping, and saved payment methods",
};

export default function Page() {
  return <CustomerBillingPage />;
}
