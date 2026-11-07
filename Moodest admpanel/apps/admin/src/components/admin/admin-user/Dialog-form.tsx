"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User } from "./Columns";
import { API_URL } from "@/lib/api-client";

export function DialogForm({
  open,
  setOpen,
  user,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: User;
}) {
  const [reason, setReason] = useState("");
  const [expires, setExpires] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/users/${user.id}/ban`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                reason,
                expires: expires ? new Date(expires) : undefined,
            })
        });
        
        const res = await response.json();

        if (response.ok) {
          toast.success(res.message || "User banned successfully");
          setOpen(false);
          window.location.reload(); // 🔄 reload list after banning
        } else {
          toast.error(res.error || "Failed to ban user");
        }
    } catch (err) {
        console.error(err);
        toast.error("Something went wrong while banning user");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Provide reason and optional expiry date for banning{" "}
            <span className="font-semibold">{user.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
            />
          </div>
          <div>
            <Label htmlFor="expires">Expiry Date</Label>
            <Input
              id="expires"
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleBan}
          >
            {loading ? "Banning..." : "Confirm Ban"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
