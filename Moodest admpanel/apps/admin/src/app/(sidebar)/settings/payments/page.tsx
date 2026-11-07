"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleRow } from "@/components/ui/toggle-row";

const providers = [
  {
    key: "razorpay",
    label: "Razorpay",
    description: "UPI, cards, netbanking and wallets",
    defaultOn: true,
  },
  {
    key: "stripe",
    label: "Stripe",
    description: "International credit and debit cards",
    defaultOn: true,
  },
  {
    key: "paypal",
    label: "PayPal",
    description: "PayPal wallet and pay-later options",
    defaultOn: false,
  },
  {
    key: "cod",
    label: "Cash on Delivery",
    description: "Collect payment when the order arrives",
    defaultOn: true,
  },
];

export default function PaymentSettingsPage() {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    providers.forEach((p) => {
      initial[p.key] = p.defaultOn;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Payment settings saved");
    }, 500);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
              <p className="text-muted-foreground">
                Enable payment providers and configure settlements
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Providers</CardTitle>
                <CardDescription>
                  Choose how customers can pay at checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                {providers.map((p) => (
                  <ToggleRow
                    key={p.key}
                    label={p.label}
                    description={p.description}
                    value={values[p.key]}
                    onChange={(v) =>
                      setValues((prev) => ({ ...prev, [p.key]: v }))
                    }
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Settlement</CardTitle>
                <CardDescription>Current payout schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Schedule</span>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  >
                    T + 2 days
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Next payout</span>
                  <span className="font-medium">Oct 14, 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending amount</span>
                  <span className="font-medium">₹48,320.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gateway fee</span>
                  <span className="font-medium">2.0% per transaction</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.success("Payout request submitted")}
                >
                  Request Manual Payout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
