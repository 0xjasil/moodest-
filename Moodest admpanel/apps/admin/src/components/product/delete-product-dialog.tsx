"use client";

import { FC, useState } from "react";
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
import { ProductDetail } from "@/types/product";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

interface ProductDeleteDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  product: ProductDetail;
}

export const ProductDeleteDialog: FC<ProductDeleteDialogProps> = ({
  open,
  setOpen,
  product,
}) => {
  const router = useRouter();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleDelete = async () => {
    setIsExecuting(true);
    try {
        const response = await apiFetch(`/products/${product.id}`, {
            method: "DELETE"
        });
        const data = await response.json();
        
        if (response.ok) {
            router.refresh();
            window.dispatchEvent(new CustomEvent("products:updated"));
            toast.success(data.message || "Product deleted successfully");
            setOpen(false);
        } else {
            toast.error(data.error || "Failed to delete product");
        }
    } catch (error) {
        console.error("Error deleting product:", error);
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
