import { CustomerNotificationsPage } from "@/components/admin/customer/customer-notifications-page";

export const metadata = {
  title: "Customer Notifications - eCommerce Admin",
  description: "Configure customer notification channels across email, browser, and mobile app",
};

export default function Page() {
  return <CustomerNotificationsPage />;
}
