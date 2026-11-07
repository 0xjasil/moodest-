"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  CreditCard,
  MapPin,
  Building,
  Home,
  Users,
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
  type: "Home" | "Office" | "Family" | "Other";
  recipient: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethodItem {
  id: string;
  brand: "Mastercard" | "Visa" | "American Express";
  holder: string;
  last4: string;
  expires: string;
  cardType: string;
  issuer: string;
  isPrimary: boolean;
}

const initialAddresses: AddressItem[] = [
  {
    id: "addr-1",
    type: "Home",
    recipient: "Violet Mendoza",
    street: "23 Shatinon Mekalan",
    city: "Melbourne",
    state: "VIC",
    zip: "3000",
    country: "London UK",
    isDefault: true,
  },
  {
    id: "addr-2",
    type: "Office",
    recipient: "Violet Mendoza",
    street: "45 Roker Terrace",
    city: "Westminster",
    state: "London",
    zip: "SW1P 4RG",
    country: "UK",
    isDefault: false,
  },
  {
    id: "addr-3",
    type: "Family",
    recipient: "Robert Hischke",
    street: "512 Water Plant Ave",
    city: "Springfield",
    state: "OR",
    zip: "97477",
    country: "USA",
    isDefault: false,
  },
];

const initialPaymentMethods: PaymentMethodItem[] = [
  {
    id: "pm-1",
    brand: "Mastercard",
    holder: "Violet Mendoza",
    last4: "4487",
    expires: "04/2028",
    cardType: "Mastercard credit card",
    issuer: "VICBANK",
    isPrimary: true,
  },
  {
    id: "pm-2",
    brand: "Visa",
    holder: "Violet Mendoza",
    last4: "8821",
    expires: "11/2027",
    cardType: "Visa debit card",
    issuer: "BARCLAYS",
    isPrimary: false,
  },
];

export function CustomerBillingPage() {
  const [addresses, setAddresses] = useState<AddressItem[]>(initialAddresses);
  const [openAddressIds, setOpenAddressIds] = useState<Record<string, boolean>>({
    "addr-1": true,
  });

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethodItem[]>(initialPaymentMethods);
  const [openPaymentIds, setOpenPaymentIds] = useState<Record<string, boolean>>({
    "pm-1": true,
  });

  // Add Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    type: "Home" as AddressItem["type"],
    recipient: "Violet Mendoza",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    isDefault: false,
  });

  // Add Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    brand: "Mastercard" as PaymentMethodItem["brand"],
    holder: "Violet Mendoza",
    cardNumber: "",
    expires: "",
    issuer: "CHASE",
    isPrimary: false,
  });

  const toggleAddress = (id: string) => {
    setOpenAddressIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const togglePayment = (id: string) => {
    setOpenPaymentIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    toast.success("Default address updated");
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Address removed from address book");
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.street.trim()) {
      toast.error("Please enter a street address");
      return;
    }

    const newId = `addr-${Date.now()}`;
    const newAddress: AddressItem = {
      id: newId,
      ...addressForm,
    };

    setAddresses((prev) => {
      if (newAddress.isDefault) {
        return [newAddress, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [...prev, newAddress];
    });

    setOpenAddressIds((prev) => ({ ...prev, [newId]: true }));
    setIsAddressModalOpen(false);
    toast.success("New address added successfully");
    setAddressForm({
      type: "Home",
      recipient: "Violet Mendoza",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "USA",
      isDefault: false,
    });
  };

  const handleSetPrimaryPayment = (id: string) => {
    setPaymentMethods((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
    toast.success("Primary payment method updated");
  };

  const handleDeletePayment = (id: string) => {
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
    toast.success("Payment method removed");
  };

  const handleSaveNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = paymentForm.cardNumber.replace(/\s+/g, "");
    if (cleanNumber.length < 4) {
      toast.error("Please enter a valid card number");
      return;
    }

    const last4 = cleanNumber.slice(-4);
    const newId = `pm-${Date.now()}`;
    const newPm: PaymentMethodItem = {
      id: newId,
      brand: paymentForm.brand,
      holder: paymentForm.holder,
      last4,
      expires: paymentForm.expires || "12/28",
      cardType: `${paymentForm.brand} card`,
      issuer: paymentForm.issuer || "BANK",
      isPrimary: paymentForm.isPrimary,
    };

    setPaymentMethods((prev) => {
      if (newPm.isPrimary) {
        return [newPm, ...prev.map((p) => ({ ...p, isPrimary: false }))];
      }
      return [...prev, newPm];
    });

    setOpenPaymentIds((prev) => ({ ...prev, [newId]: true }));
    setIsPaymentModalOpen(false);
    toast.success("New payment method added");
    setPaymentForm({
      brand: "Mastercard",
      holder: "Violet Mendoza",
      cardNumber: "",
      expires: "",
      issuer: "CHASE",
      isPrimary: false,
    });
  };

  const renderBrandIcon = (brand: PaymentMethodItem["brand"]) => {
    if (brand === "Mastercard") {
      return (
        <div className="relative flex size-8 shrink-0 items-center">
          <div className="size-5 rounded-full bg-red-500 opacity-90"></div>
          <div className="-ml-2.5 size-5 rounded-full bg-amber-400 opacity-90"></div>
        </div>
      );
    }
    if (brand === "Visa") {
      return (
        <div className="size-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs tracking-wider">
          VISA
        </div>
      );
    }
    return (
      <div className="size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-[10px]">
        AMEX
      </div>
    );
  };

  return (
    <CustomerLayoutFrame
      currentTab="address-billing"
      pageTitle="Address & Billing"
    >
      <div className="space-y-6">
        {/* 1. Address Book Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Address Book
              </h2>
            </div>
            <Button
              onClick={() => setIsAddressModalOpen(true)}
              className="h-9 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-4 mr-1.5" />
              Add new address
            </Button>
          </div>

          {/* Collapsible Accordion List */}
          <div className="divide-y divide-gray-200/80 dark:divide-white/10 border-t border-gray-200/80 dark:border-white/10">
            {addresses.map((addr) => {
              const isOpen = !!openAddressIds[addr.id];
              return (
                <div key={addr.id} className="py-2">
                  <button
                    type="button"
                    onClick={() => toggleAddress(addr.id)}
                    className="flex w-full items-center justify-between py-2.5 text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`size-4.5 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-gray-700 dark:text-gray-200" : ""
                        }`}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Default Address
                          </span>
                        )}
                        <span className="w-full text-xs text-gray-500 dark:text-gray-400">
                          {addr.street}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isOpen && (
                    <div className="pb-4 pl-8 sm:pl-9 pr-2 space-y-3">
                      <div className="rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 p-4">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                          <span className="font-semibold text-gray-900 dark:text-white block mb-0.5">
                            {addr.recipient}
                          </span>
                          {addr.street},<br />
                          {addr.city}, {addr.state} {addr.zip},<br />
                          {addr.country}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {!addr.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="h-8 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Payment Methods Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Payment Methods
              </h2>
            </div>
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="h-9 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-100 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-4 mr-1.5" />
              Add payment methods
            </Button>
          </div>

          {/* Collapsible Accordion List */}
          <div className="divide-y divide-gray-200/80 dark:divide-white/10 border-t border-gray-200/80 dark:border-white/10">
            {paymentMethods.map((pm) => {
              const isOpen = !!openPaymentIds[pm.id];
              return (
                <div key={pm.id} className="py-2">
                  <button
                    type="button"
                    onClick={() => togglePayment(pm.id)}
                    className="flex w-full items-center justify-between py-2.5 text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`size-4.5 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-gray-700 dark:text-gray-200" : ""
                        }`}
                      />
                      {renderBrandIcon(pm.brand)}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {pm.brand}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Expires {pm.expires}
                        </span>
                        {pm.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isOpen && (
                    <div className="pb-4 pl-8 sm:pl-9 pr-2 space-y-3">
                      <div className="rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 p-4">
                        <div className="grid gap-2 text-xs sm:text-sm md:grid-cols-2">
                          <ul className="grid grid-cols-3 gap-2">
                            <li className="text-gray-500 dark:text-gray-400">
                              Name:
                            </li>
                            <li className="col-span-2 font-semibold text-gray-900 dark:text-white">
                              {pm.holder}
                            </li>
                            <li className="text-gray-500 dark:text-gray-400">
                              Number:
                            </li>
                            <li className="col-span-2 font-mono text-gray-900 dark:text-white">
                              **** {pm.last4}
                            </li>
                            <li className="text-gray-500 dark:text-gray-400">
                              Expires:
                            </li>
                            <li className="col-span-2 text-gray-900 dark:text-white">
                              {pm.expires}
                            </li>
                            <li className="text-gray-500 dark:text-gray-400">
                              Type:
                            </li>
                            <li className="col-span-2 text-gray-900 dark:text-white">
                              {pm.cardType}
                            </li>
                            <li className="text-gray-500 dark:text-gray-400">
                              Issuer:
                            </li>
                            <li className="col-span-2 text-gray-900 dark:text-white">
                              {pm.issuer}
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {!pm.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimaryPayment(pm.id)}
                            className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            Set as Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePayment(pm.id)}
                          className="h-8 px-3 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a new shipping or billing address for this customer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNewAddress} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Address Type</Label>
                <Select
                  value={addressForm.type}
                  onValueChange={(v) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      type: v as AddressItem["type"],
                    }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Family">Family</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Recipient Name</Label>
                <Input
                  value={addressForm.recipient}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      recipient: e.target.value,
                    }))
                  }
                  placeholder="e.g. Violet Mendoza"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Street Address</Label>
              <Input
                value={addressForm.street}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    street: e.target.value,
                  }))
                }
                placeholder="e.g. 23 Shatinon Mekalan"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="Melbourne"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">State / Region</Label>
                <Input
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder="VIC"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Postal Code</Label>
                <Input
                  value={addressForm.zip}
                  onChange={(e) =>
                    setAddressForm((prev) => ({
                      ...prev,
                      zip: e.target.value,
                    }))
                  }
                  placeholder="3000"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Country</Label>
              <Input
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                placeholder="UK / USA"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="default-address-check"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    isDefault: e.target.checked,
                  }))
                }
                className="size-4 rounded accent-indigo-600"
              />
              <Label
                htmlFor="default-address-check"
                className="text-xs text-gray-700 dark:text-gray-300 font-normal cursor-pointer"
              >
                Set as default address
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                Add Address
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a card for automated billing and faster checkout.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNewPayment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Card Brand</Label>
              <Select
                value={paymentForm.brand}
                onValueChange={(v) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    brand: v as PaymentMethodItem["brand"],
                  }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="American Express">American Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cardholder Name</Label>
              <Input
                value={paymentForm.holder}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    holder: e.target.value,
                  }))
                }
                placeholder="Violet Mendoza"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Card Number</Label>
              <Input
                value={paymentForm.cardNumber}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    cardNumber: e.target.value,
                  }))
                }
                placeholder="4487 1234 5678 9012"
                className="rounded-xl text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expires (MM/YY)</Label>
                <Input
                  value={paymentForm.expires}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      expires: e.target.value,
                    }))
                  }
                  placeholder="04/2028"
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Issuer / Bank</Label>
                <Input
                  value={paymentForm.issuer}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      issuer: e.target.value,
                    }))
                  }
                  placeholder="VICBANK"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="primary-card-check"
                checked={paymentForm.isPrimary}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    isPrimary: e.target.checked,
                  }))
                }
                className="size-4 rounded accent-indigo-600"
              />
              <Label
                htmlFor="primary-card-check"
                className="text-xs text-gray-700 dark:text-gray-300 font-normal cursor-pointer"
              >
                Set as primary payment method
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                Save Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CustomerLayoutFrame>
  );
}
