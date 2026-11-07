import OrderDetail from "@/components/admin/order/order-detail-page"; 
import { serverFetch } from "@/lib/api";
import { Metadata } from "next";
import { OrderDetailed } from "@/types/order";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id} Details - Commerce Admin`,
    description: `View full order details, tracking activity, and customer information for order ${id}.`,
  };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const res = await serverFetch<OrderDetailed & { data?: OrderDetailed }>(`/orders/${id}`);
    const orderData = res?.data || res;
    if (orderData) {
      return <OrderDetail order={orderData} />;
    }
  } catch (error) {
    console.error(`[OrderDetailPage] Failed to fetch order ${id} from backend:`, error);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order #{id} Not Found</h2>
      <p className="mt-2 text-sm text-gray-500">
        The requested order could not be retrieved from the backend API.
      </p>
    </div>
  );
}
