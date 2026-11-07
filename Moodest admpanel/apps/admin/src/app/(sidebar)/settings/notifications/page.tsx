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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ToggleRow } from "@/components/ui/toggle-row";

const alerts = [
  {
    key: "new-order",
    label: "New order placed",
    description: "Notify the team for every paid order",
    defaultOn: true,
  },
  {
    key: "low-stock",
    label: "Low stock warning",
    description: "When a variant drops below 5 units",
    defaultOn: true,
  },
  {
    key: "new-review",
    label: "New review submitted",
    description: "When a customer leaves product feedback",
    defaultOn: false,
  },
  {
    key: "refund",
    label: "Refund requested",
    description: "Customer-initiated return or refund",
    defaultOn: true,
  },
  {
    key: "payout",
    label: "Payout processed",
    description: "Gateway settlement confirmation",
    defaultOn: false,
  },
];

export default function SettingsNotificationsPage() {
  const [values, setValues] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    alerts.forEach((a) => {
      initial[a.key] = a.defaultOn;
    });
    return initial;
  });
  const [digest, setDigest] = useState("daily");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Notification settings saved");
    }, 500);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                What your team gets notified about
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Admin Alerts</CardTitle>
                <CardDescription>
                  Sent to the admin team by email and in-app
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                {alerts.map((a) => (
                  <ToggleRow
                    key={a.key}
                    label={a.label}
                    description={a.description}
                    value={values[a.key]}
                    onChange={(v) =>
                      setValues((prev) => ({ ...prev, [a.key]: v }))
                    }
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Digest</CardTitle>
                <CardDescription>
                  Summary emails for quieter inboxes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Email digest frequency</Label>
                  <Select value={digest} onValueChange={setDigest}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="daily">Daily summary</SelectItem>
                      <SelectItem value="weekly">Weekly summary</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digests include orders, stock, reviews and payout activity
                  from the selected period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
