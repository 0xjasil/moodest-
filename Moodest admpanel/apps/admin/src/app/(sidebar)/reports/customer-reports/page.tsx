"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportCustomersPDF, CustomerSummary } from "@/components/admin/analytics/analytic-pdf";
import AdminLoader from "@/components/admin/AdminLoader";
import { IconDownload } from "@tabler/icons-react";

export default function CustomerReportsPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await apiFetch("/admin/customer-analytics");
        if (response.ok) {
          const data = await response.json();
          const transformed: CustomerSummary[] = (data.topCustomers || []).map(
            (c: { userId?: number | string; firstName?: string; email?: string; order_count?: number; total_spend?: number }) => ({
              id: String(c.userId || ""),
              name: c.firstName || "Verified Customer",
              email: c.email || "-",
              phone: "-",
              joinedAt: new Date(),
              totalOrders: Number(c.order_count || 0),
              totalSpent: Number(c.total_spend || 0),
            })
          );
          setCustomers(transformed);
          setTotalCustomers(data.overview?.totalCustomers || transformed.length);
        }
      } catch (error) {
        console.error("Failed to fetch customer analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const handleExport = () => {
    exportCustomersPDF(customers, "All Time");
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
          <h1 className="text-2xl font-bold">Customer Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Total Customers: {totalCustomers}</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <IconDownload size={18} /> Export to PDF
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined At</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Total Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{new Date(customer.joinedAt).toLocaleDateString()}</TableCell>
                <TableCell>{customer.totalOrders}</TableCell>
                <TableCell>₹{customer.totalSpent.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
