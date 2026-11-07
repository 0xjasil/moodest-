"use client";

import React, { useState } from "react";
import {
  MapPin,
  Building,
  Home,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  CheckCircle2,
  Phone,
  FileText,
  Smartphone,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CustomerLayoutFrame } from "./customer-layout-frame";

interface AddressItem {
  id: string;
  type: "Home" | "Office" | "Other";
  recipient: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  deliveryNotes?: string;
  isDefault: boolean;
}

interface PaymentMethodItem {
  id: string;
  type: "card" | "apple_pay" | "cod";
  brand?: string;
  last4?: string;
  expires?: string;
  label: string;
  isPrimary: boolean;
}

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: "addr-1",
    type: "Home",
    recipient: "Fatima Al-Zahra",
    phone: "+971 50 123 4567",
    street: "Villa 14, Street 22B, Al Safa 2",
    city: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    deliveryNotes: "Private villa gate, please call upon arrival.",
    isDefault: true,
  },
  {
    id: "addr-2",
    type: "Office",
    recipient: "Fatima Al-Zahra",
    phone: "+971 50 123 4567",
    street: "Floor 18, Al Saada Tower, DIFC Gate Precinct 4",
    city: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    deliveryNotes: "Deliver to reception between 9 AM - 5 PM.",
    isDefault: false,
  },
];

const INITIAL_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: "pm-1",
    type: "card",
    brand: "Visa",
    last4: "4242",
    expires: "08/2028",
    label: "Visa ending in 4242",
    isPrimary: true,
  },
  {
    id: "pm-2",
    type: "apple_pay",
    label: "Apple Pay (Storefront One-Click)",
    isPrimary: false,
  },
  {
    id: "pm-3",
    type: "cod",
    label: "Cash on Delivery (Courier)",
    isPrimary: false,
  },
];

export function CustomerBillingPage() {
  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(INITIAL_PAYMENT_METHODS);

  // Add / Edit Address Dialog State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    type: "Home" as AddressItem["type"],
    recipient: "Fatima Al-Zahra",
    phone: "+971 50 123 4567",
    street: "",
    city: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    deliveryNotes: "",
    isDefault: false,
  });

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setAddressForm({
      type: "Home",
      recipient: "Fatima Al-Zahra",
      phone: "+971 50 123 4567",
      street: "",
      city: "Dubai",
      state: "Dubai",
      country: "United Arab Emirates",
      deliveryNotes: "",
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEdit = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      type: addr.type,
      recipient: addr.recipient,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      country: addr.country,
      deliveryNotes: addr.deliveryNotes || "",
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.street.trim() || !addressForm.city.trim()) {
      toast.error("Please enter street and city");
      return;
    }

    if (editingAddressId) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddressId
            ? { ...a, ...addressForm }
            : addressForm.isDefault
            ? { ...a, isDefault: false }
            : a
        )
      );
      toast.success("Delivery address updated");
    } else {
      const newAddr: AddressItem = {
        id: `addr-${Date.now()}`,
        ...addressForm,
      };
      setAddresses((prev) =>
        addressForm.isDefault
          ? [...prev.map((a) => ({ ...a, isDefault: false })), newAddr]
          : [...prev, newAddr]
      );
      toast.success("New delivery address added");
    }
    setIsAddressModalOpen(false);
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    toast.success("Default shipping address set");
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      toast.error("At least one address must be kept on file");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Address removed");
  };

  return (
    <CustomerLayoutFrame currentTab="address-billing" pageTitle="Address &amp; Delivery">
      <div className="space-y-6">
        {/* 1. Saved Delivery Addresses */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span>Delivery &amp; Shipping Addresses</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Saved shipping destinations used for abaya deliveries and courier fulfillment.
              </p>
            </div>

            <Button
              onClick={handleOpenAdd}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="size-3.5 mr-1.5" />
              Add New Address
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`rounded-xl border p-5 transition-all flex flex-col justify-between space-y-4 ${
                  addr.isDefault
                    ? "border-indigo-600/60 bg-indigo-50/20 dark:bg-indigo-950/10 dark:border-indigo-500/30"
                    : "border-gray-200/80 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {addr.type === "Home" ? (
                        <Home className="size-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Building className="size-4 text-sky-600 dark:text-sky-400" />
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                        {addr.type} Address
                      </span>
                    </div>

                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-600 text-white shadow-2xs">
                        <CheckCircle2 className="size-3" />
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {addr.recipient}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {addr.street}
                    <br />
                    {addr.city}, {addr.state}, {addr.country}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <Phone className="size-3 text-gray-400" />
                    <span>{addr.phone}</span>
                  </div>

                  {addr.deliveryNotes && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400/90 bg-amber-500/10 dark:bg-amber-500/5 p-2 rounded-lg mt-2">
                      <FileText className="size-3.5 shrink-0 mt-0.5" />
                      <span>{addr.deliveryNotes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 dark:border-white/10 text-xs">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-[11px]">
                      Primary delivery address
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Edit address"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete address"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Saved Payment Methods On File */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="size-5 text-indigo-600 dark:text-indigo-400" />
              <span>Checkout Payment Methods</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Payment channels customer has linked for boutique checkouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.02] p-4 flex items-start gap-3.5"
              >
                <div className="size-10 rounded-xl bg-white dark:bg-white/10 border border-gray-200/80 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                  {pm.type === "card" && <CreditCard className="size-5" />}
                  {pm.type === "apple_pay" && <Smartphone className="size-5" />}
                  {pm.type === "cod" && <Banknote className="size-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {pm.label}
                    </p>
                  </div>

                  {pm.expires && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Expires {pm.expires}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2">
                    {pm.isPrimary ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/30">
                        Default Card
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5">
                        Available at checkout
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Address Dialog */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Provide recipient shipping coordinates for abaya orders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAddress} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Recipient Name</Label>
                <Input
                  value={addressForm.recipient}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, recipient: e.target.value })
                  }
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contact Phone</Label>
                <Input
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Street Address / Villa Number</Label>
              <Input
                value={addressForm.street}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, street: e.target.value })
                }
                placeholder="e.g. Villa 14, Street 22B, Al Safa 2"
                className="h-9 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City / Emirate</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, city: e.target.value })
                  }
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Country</Label>
                <Input
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, country: e.target.value })
                  }
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Address Type</Label>
                <Select
                  value={addressForm.type}
                  onValueChange={(val: AddressItem["type"]) =>
                    setAddressForm({ ...addressForm, type: val })
                  }
                >
                  <SelectTrigger className="h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Courier Delivery Notes (Optional)</Label>
              <Input
                value={addressForm.deliveryNotes}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, deliveryNotes: e.target.value })
                }
                placeholder="e.g. Ring front gate, deliver between 10 AM - 2 PM"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-default-address"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, isDefault: e.target.checked })
                }
                className="size-4 rounded border-gray-300 accent-indigo-600"
              />
              <Label htmlFor="is-default-address" className="text-xs font-medium cursor-pointer">
                Set as default shipping address for checkout
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                className="h-9 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Save Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CustomerLayoutFrame>
  );
}
