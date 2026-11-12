"use client";

import React, { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Tag,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Percent,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from "@/components/ui/icon";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { rupee } from "@/constants/values";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minCartAmount: number;
  maxDiscount: number | null;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export function CouponsPageClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minCartAmount, setMinCartAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      // Real NestJS endpoint: GET /api/coupons (ADMIN only)
      const response = await apiFetch("/coupons");
      if (response.ok) {
        const data = await response.json();
        // NestJS returns a plain array, not { success, data }
        setCoupons(Array.isArray(data) ? data : []);
      } else if (response.status === 401 || response.status === 403) {
        toast.error("Admin access required to view coupons");
      } else {
        toast.error("Failed to load coupons");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinCartAmount("");
    setMaxDiscount("");
    setUsageLimit("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Please fill in coupon code and discount value");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minCartAmount ? parseFloat(minCartAmount) : undefined,
        maxUses: usageLimit ? parseInt(usageLimit) : undefined,
        expiresAt: endDate ? new Date(endDate).toISOString() : undefined,
      };

      const response = await apiFetch("/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const created = await response.json();
        toast.success(`Coupon ${(created as { code?: string }).code ?? code} created`);
        setIsCreateOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to create coupon");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const response = await apiFetch(`/coupons/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (response.ok) {
        toast.success(`Coupon ${coupon.code} is now ${!coupon.isActive ? "active" : "inactive"}`);
        setCoupons(prev =>
          prev.map(c => (c.id === coupon.id ? { ...c, isActive: !coupon.isActive } : c))
        );
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to toggle status");
      }
    } catch {
      toast.error("Error updating coupon status");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon ${code}?`)) return;

    try {
      const response = await apiFetch(`/coupons/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success(`Coupon ${code} deleted`);
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to delete coupon");
      }
    } catch {
      toast.error("Error deleting coupon");
    }
  };

  const getValidityString = (coupon: Coupon) => {
    if (!coupon.startDate && !coupon.endDate) return "Always valid";
    const start = coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : "Immediate";
    const end = coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : "No expiry";
    return `${start} - ${end}`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.endDate) return false;
    return new Date(coupon.endDate) < new Date();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage active discount codes and promotional campaigns</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleCreateCoupon}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  New Coupon Campaign
                </DialogTitle>
                <DialogDescription>
                  Define the rules, discount value, and date range for this coupon code.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Coupon Code
                  </label>
                  <Input
                    placeholder="e.g. SUMMER30"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Discount Type
                    </label>
                    <Select
                      value={discountType}
                      onValueChange={(val: "PERCENTAGE" | "FIXED") => setDiscountType(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED">Flat Value ({rupee})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Discount Value
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder={discountType === "PERCENTAGE" ? "20" : "500"}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        required
                      />
                      <div className="absolute right-3 top-2.5 text-muted-foreground h-4 w-4">
                        {discountType === "PERCENTAGE" ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-semibold">{rupee}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limits & Min Subtotal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Min Cart Subtotal
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={minCartAmount}
                      onChange={(e) => setMinCartAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Max Discount Cap
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="No limit"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      disabled={discountType === "FIXED"}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Usage Limit
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="No limit (unlimited uses)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Start Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Expiry Date
                    </label>
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>
            List of your promo codes and their validation constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span>Loading campaigns...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg text-muted-foreground gap-2">
              <Tag className="h-8 w-8" />
              <span className="font-medium">No coupons active</span>
              <span className="text-sm">Create your first campaign to get started.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Cart Subtotal</TableHead>
                  <TableHead>Max Cap</TableHead>
                  <TableHead>Validity Window</TableHead>
                  <TableHead>Usage Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold text-sm">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === "PERCENTAGE" ? (
                          <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 flex items-center w-fit gap-1 font-medium">
                            <Percent className="h-3 w-3" />
                            {coupon.discountValue}% Off
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-700 bg-green-50 border-green-100 flex items-center w-fit gap-1 font-medium">
                            {rupee} {coupon.discountValue} Off
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {rupee} {coupon.minCartAmount}
                      </TableCell>
                      <TableCell>
                        {coupon.maxDiscount ? `${rupee} ${coupon.maxDiscount}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground flex items-center gap-1.5 py-4">
                        <Calendar className="h-3.5 w-3.5" />
                        {getValidityString(coupon)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-semibold text-foreground">
                          {coupon.usedCount}
                        </span>{" "}
                        / {coupon.usageLimit || "∞"}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </Badge>
                        ) : coupon.isActive ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 w-fit">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white flex items-center gap-1 w-fit">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCouponStatus(coupon)}
                            disabled={expired}
                            title={coupon.isActive ? "Deactivate" : "Activate"}
                          >
                            {coupon.isActive ? (
                              <ToggleRight className="h-6 w-6 text-green-600 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-gray-400 cursor-pointer" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
