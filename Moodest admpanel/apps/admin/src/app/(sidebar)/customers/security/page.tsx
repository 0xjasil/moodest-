import { CustomerSecurityPage } from "@/components/admin/customer/customer-security-page";

export const metadata = {
  title: "Customer Security - eCommerce Admin",
  description: "Manage customer security, password, 2FA, and active device sessions",
};

export default function Page() {
  return <CustomerSecurityPage />;
}
