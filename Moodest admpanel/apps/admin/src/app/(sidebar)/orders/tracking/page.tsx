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
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, MapPin, Package, Search, Truck } from "lucide-react";

const trackingSteps = [
  {
    label: "Order Placed",
    description: "We received your order",
    time: "Oct 10, 2026 · 2:20 PM",
    done: true,
  },
  {
    label: "Packed",
    description: "Items packed at our warehouse",
    time: "Oct 10, 2026 · 6:45 PM",
    done: true,
  },
  {
    label: "Shipped",
    description: "Handed over to Express logistics",
    time: "Oct 11, 2026 · 9:15 AM",
    done: true,
  },
  {
    label: "Out for Delivery",
    description: "Courier is on the way to you",
    time: "Oct 12, 2026 · 8:05 AM",
    done: true,
  },
  {
    label: "Delivered",
    description: "Delivered to the front door",
    time: "Expected by Oct 12, 6:00 PM",
    done: false,
  },
];

export default function OrderTrackingPage() {
  const [input, setInput] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) {
      toast.error("Please enter an order ID");
      return;
    }
    setOrderId(value);
    toast.success(`Tracking ${value}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Order Tracking
            </h1>
            <p className="text-muted-foreground">
              Track any shipment by its order ID
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Track an order</CardTitle>
              <CardDescription>
                Enter the order ID (e.g. ORD-9421) to see its latest status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleTrack}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ORD-9421"
                    className="pl-8"
                  />
                </div>
                <Button type="submit">Track Order</Button>
              </form>
            </CardContent>
          </Card>

          {orderId && (
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shipment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-semibold">{orderId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Carrier</span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4" /> Express Logistics
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Out for Delivery
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Receiver</span>
                    <span>Sophia Carter</span>
                  </div>
                  <div className="flex items-start gap-1.5 pt-1 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>742 Evergreen Terrace, Springfield, OR 97477</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                  <CardDescription>
                    Latest scanning events for this shipment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="relative space-y-6 border-l border-gray-200 pl-6 dark:border-gray-800">
                    {trackingSteps.map((step) => (
                      <li key={step.label} className="relative">
                        <span
                          className={
                            "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-black " +
                            (step.done ? "text-green-600" : "text-gray-400")
                          }
                        >
                          {step.done ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p
                            className={
                              "text-sm font-semibold " +
                              (step.done
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-muted-foreground")
                            }
                          >
                            {step.label}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {step.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          )}

          {!orderId && (
            <Card>
              <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
                <Package className="h-5 w-5" />
                <p className="text-sm">
                  Enter an order ID above to view its tracking timeline. Try{" "}
                  <span className="font-mono font-semibold text-foreground">
                    ORD-9421
                  </span>
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
