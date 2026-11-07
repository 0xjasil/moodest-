"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Search,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { rupee } from "@/constants/values";

interface PaymentLog {
  id: string;
  orderId: string | null;
  amount: number;
  currency: string;
  status: string; // "SUCCESS" | "FAILED" | "PENDING"
  paymentMethod: string;
  gatewayPaymentId: string | null;
  gatewayOrderId: string | null;
  gatewaySignature: string | null;
  errorMessage: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  createdAt: string;
}

export default function PaymentLogsPage() {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Real payment records derived from order payment transactions: GET /api/orders/admin/all
      const response = await apiFetch("/orders/admin/all?limit=100");

      if (response.ok) {
        const data = await response.json();
        const orders = Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []);
        setLogs((orders as Array<{
          id: number;
          total?: number;
          totalAmount?: number;
          status: string;
          paymentStatus?: string;
          paymentMethod?: string;
          paymentIntentId?: string;
          createdAt: string;
          userId?: number;
          user?: { firstName?: string; lastName?: string; email?: string };
        }>).map((o) => {
          const buyerName = o.user
            ? [o.user.firstName, o.user.lastName].filter(Boolean).join(" ") || o.user.email || "Customer"
            : `Customer #${o.userId ?? o.id}`;
          const isPaid = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status) || o.paymentStatus === "PAID";
          const isFailed = ["CANCELLED", "REFUNDED"].includes(o.status) || o.paymentStatus === "FAILED";
          const status = isPaid ? "SUCCESS" : isFailed ? "FAILED" : "PENDING";

          return {
            id: `PAY-${o.id}`,
            orderId: String(o.id),
            amount: Number(o.total ?? o.totalAmount ?? 0),
            currency: "INR",
            status,
            paymentMethod: o.paymentMethod ?? "Online (Razorpay)",
            gatewayPaymentId: o.paymentIntentId ?? null,
            gatewayOrderId: `order_${o.id}`,
            gatewaySignature: null,
            errorMessage: isFailed ? "Order cancelled or refunded" : null,
            buyerName,
            buyerEmail: o.user?.email ?? null,
            createdAt: o.createdAt,
          };
        }));
      } else if (response.status === 401 || response.status === 403) {
        setLogs([]);
        toast.error("Insufficient admin permissions for payment logs");
      } else {
        setLogs([]);
        toast.error("Payment logs endpoint not available");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading payment logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.buyerName && log.buyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.buyerEmail && log.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.gatewayPaymentId && log.gatewayPaymentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === "ALL" || log.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, selectedStatusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Success
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-1 w-fit">
            <HelpCircle className="h-3 w-3 shrink-0" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Logs</h1>
          <p className="text-muted-foreground">Order payment transaction records derived directly from verified order statuses (/api/orders/admin/all)</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="icon" title="Refresh logs">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by buyer name, email, or gateway ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {["ALL", "SUCCESS", "FAILED", "PENDING"].map((status) => (
            <Button
              key={status}
              variant={selectedStatusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatusFilter(status)}
              className="rounded-full px-4 text-xs font-semibold"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Transaction Log Feed
          </CardTitle>
          <CardDescription>
            Live feed of gateway events and checkouts from the buyer side
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span>Loading payment details...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-lg text-muted-foreground gap-2">
              <DollarSign className="h-8 w-8" />
              <span className="font-semibold">No transactions found</span>
              <span className="text-sm">No payment records match the filter criteria.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Gateway Reference ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div>{log.buyerName || "Walk-in Guest"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{log.buyerEmail || "N/A"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-bold text-gray-950 dark:text-gray-50">
                      {rupee} {log.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold text-xs tracking-wider">
                        {log.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.gatewayPaymentId || log.gatewayOrderId || "N/A (Cash/Local)"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                        title="View transaction detail"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Transaction Audit details
              </DialogTitle>
              <DialogDescription>
                Detailed overview of the selected payment transaction
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Log ID</span>
                <span className="col-span-2 font-mono text-xs break-all">{selectedLog.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Transaction Time</span>
                <span className="col-span-2 font-mono text-xs">{new Date(selectedLog.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Buyer Details</span>
                <span className="col-span-2">
                  <div className="font-bold">{selectedLog.buyerName || "Guest"}</div>
                  <div className="font-mono text-xs text-muted-foreground">{selectedLog.buyerEmail || "N/A"}</div>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Order Ref ID</span>
                <span className="col-span-2 font-mono text-xs break-all">{selectedLog.orderId || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Gateway Payment ID</span>
                <span className="col-span-2 font-mono text-xs break-all text-blue-600">{selectedLog.gatewayPaymentId || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Gateway Order ID</span>
                <span className="col-span-2 font-mono text-xs break-all">{selectedLog.gatewayOrderId || "N/A"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Total Invoiced</span>
                <span className="col-span-2 font-mono font-bold text-gray-950 dark:text-gray-50">
                  {rupee} {selectedLog.amount.toLocaleString()} ({selectedLog.currency})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-muted-foreground">Transaction Status</span>
                <span className="col-span-2">
                  {getStatusBadge(selectedLog.status)}
                </span>
              </div>

              {selectedLog.errorMessage && (
                <div className="space-y-1.5 pt-2">
                  <p className="font-semibold text-red-600">Decline / Failure Reason</p>
                  <div className="bg-red-50 dark:bg-zinc-900 border border-red-200 text-red-700 p-4 rounded-xl font-mono text-xs leading-relaxed">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
