import { CommerceoOrderList } from "@/components/admin/order/CommerceoOrderList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order List - Commerce Admin",
  description: "Manage customer orders, track payments, fulfillment status, and delivery logistics.",
};

export default function AdminOrdersPage() {
  return <CommerceoOrderList />;
}

