"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-client";

interface InventoryDeleteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  product: { id: string; name: string };
}

export const InventoryDeleteDialog = ({
  open,
  setOpen,
  product,
}: InventoryDeleteDialogProps) => {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleDelete = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(`${API_URL}/inventory/${product.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        window.dispatchEvent(new CustomEvent("inventory:updated"));
        toast.success(data.message || "Inventory item deleted successfully");
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to delete inventory item");
      }
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast.error("An error occurred");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{product.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild onClick={(e) => {
            e.preventDefault();
            handleDelete();
          }}>
            <Button variant="destructive" disabled={isExecuting}>
              {isExecuting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
