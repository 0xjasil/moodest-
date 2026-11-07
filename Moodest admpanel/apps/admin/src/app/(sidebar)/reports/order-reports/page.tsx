"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportOrdersPDF } from "@/components/admin/analytics/analytic-pdf";
import AdminLoader from "@/components/admin/AdminLoader";
import { IconDownload, IconFileSpreadsheet } from "@tabler/icons-react";
import { toast } from "sonner";

interface OrderSummary {
  id: string;
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  createdAt: Date;
}

export default function OrderReportsPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await apiFetch("/admin/orders?limit=50");
        if (response.ok) {
          const resData = await response.json();
          const items = Array.isArray(resData) ? resData : (resData.data || []);
          const transformed: OrderSummary[] = items.map(
            (o: {
              id?: number | string;
              user?: { firstName?: string; lastName?: string; name?: string; email?: string } | null;
              totalAmount?: number;
              status?: string;
              paymentMethod?: string;
              createdAt?: string;
            }) => ({
              id: String(o.id || ""),
              userName: o.user
                ? (o.user.firstName ? `${o.user.firstName} ${o.user.lastName || ""}`.trim() : (o.user.name || "Customer"))
                : "Customer",
              userEmail: o.user?.email || "-",
              totalAmount: Number(o.totalAmount || 0),
              status: o.status || "PENDING",
              paymentMethod: o.paymentMethod || "ONLINE",
              createdAt: new Date(o.createdAt || Date.now()),
            })
          );
          setOrders(transformed);
        }
      } catch (error) {
        console.error("Failed to fetch order summary:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleExportPDF = () => {
    exportOrdersPDF(orders, "All Time");
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Exporting revenue CSV...", { id: "csv" });
      const res = await apiFetch("/admin/export/revenue.csv?days=30");
      if (!res.ok) throw new Error("Revenue CSV export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "revenue-report-30d.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Revenue CSV downloaded successfully", { id: "csv" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV", { id: "csv" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <AdminLoader />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order &amp; Revenue Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Showing {orders.length} recent orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <IconFileSpreadsheet size={18} /> Export Revenue CSV
          </Button>
          <Button onClick={handleExportPDF} className="flex items-center gap-2">
            <IconDownload size={18} /> Export PDF
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-xs">{order.id}</TableCell>
                <TableCell>{order.userName}</TableCell>
                <TableCell>{order.userEmail}</TableCell>
                <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${order.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
