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
  
  let orderData: OrderDetailed | null = null;
  try {
    const res = await serverFetch<OrderDetailed & { data?: OrderDetailed }>(`/orders/${id}`);
    orderData = res?.data || res || null;
  } catch (error) {
    console.warn(`[OrderDetailPage] Server-side fetch for ${id} not available, will attempt client-side:`, error);
  }

  return <OrderDetail order={orderData} orderId={id} />;
}
