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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { rupee } from "@/constants/values";

interface ShippingMethod {
  id: string;
  name: string;
  zones: string;
  rate: number;
  eta: string;
  enabled: boolean;
}

const initialMethods: ShippingMethod[] = [
  {
    id: "sh1",
    name: "Standard Ground",
    zones: "Domestic",
    rate: 49,
    eta: "4–6 business days",
    enabled: true,
  },
  {
    id: "sh2",
    name: "Express",
    zones: "Domestic",
    rate: 149,
    eta: "1–2 business days",
    enabled: true,
  },
  {
    id: "sh3",
    name: "Free Shipping",
    zones: "Orders above ₹999",
    rate: 0,
    eta: "5–7 business days",
    enabled: true,
  },
  {
    id: "sh4",
    name: "International",
    zones: "Worldwide",
    rate: 999,
    eta: "7–14 business days",
    enabled: false,
  },
];

export default function ShippingSettingsPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>(initialMethods);

  const toggle = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
    toast.success("Shipping method updated");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Shipping</h1>
              <p className="text-muted-foreground">
                Delivery methods, rates and estimated times
              </p>
            </div>
            <Button
              onClick={() => toast.success("Shipping method added (demo)")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Methods</CardTitle>
              <CardDescription>
                Toggle a method to offer it at checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.zones}
                      </TableCell>
                      <TableCell>
                        {m.rate === 0 ? "Free" : `${rupee}${m.rate}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.eta}
                      </TableCell>
                      <TableCell>
                        {m.enabled ? (
                          <span className="text-sm font-medium text-green-600">
                            Active
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Disabled
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={m.enabled}
                          aria-label={`Toggle ${m.name}`}
                          onClick={() => toggle(m.id)}
                          className="inline-flex"
                        >
                          {m.enabled ? (
                            <ToggleRight className="h-7 w-7 text-green-600 cursor-pointer" />
                          ) : (
                            <ToggleLeft className="h-7 w-7 text-gray-400 cursor-pointer" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
