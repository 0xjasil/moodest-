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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleRow } from "@/components/ui/toggle-row";

const options = [
  {
    key: "guest",
    label: "Guest checkout",
    description: "Allow orders without creating an account",
    defaultOn: true,
  },
  {
    key: "notes",
    label: "Order notes",
    description: "Show a note field on the checkout page",
    defaultOn: true,
  },
  {
    key: "phone",
    label: "Require phone number",
    description: "Collect a contact number with every order",
    defaultOn: true,
  },
  {
    key: "coupon",
    label: "Coupon code field",
    description: "Let customers apply discount codes at checkout",
    defaultOn: true,
  },
  {
    key: "inventory-hold",
    label: "Hold inventory during checkout",
    description: "Reserve items for 10 minutes while paying",
    defaultOn: false,
  },
];

export default function CheckoutSettingsPage() {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    options.forEach((o) => {
      initial[o.key] = o.defaultOn;
    });
    return initial;
  });
  const [minOrder, setMinOrder] = useState("0");
  const [term, setTerm] = useState("single");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Checkout settings saved");
    }, 500);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
              <p className="text-muted-foreground">
                Tune the checkout experience for your shoppers
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Options</CardTitle>
                <CardDescription>
                  Behaviour of the checkout flow
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                {options.map((o) => (
                  <ToggleRow
                    key={o.key}
                    label={o.label}
                    description={o.description}
                    value={values[o.key]}
                    onChange={(v) =>
                      setValues((prev) => ({ ...prev, [o.key]: v }))
                    }
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rules</CardTitle>
                <CardDescription>Order-level constraints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="min-order">
                    Minimum order amount (₹)
                  </Label>
                  <Input
                    id="min-order"
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Terms acceptance</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">
                        Single acceptance covers all orders
                      </SelectItem>
                      <SelectItem value="every">
                        Accept on every order
                      </SelectItem>
                      <SelectItem value="none">Not required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
