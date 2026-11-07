'use client';

import { FC, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type Brand } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

interface DeleteBrandDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  brand: Brand;
}

export const DeleteBrandDialog: FC<DeleteBrandDialogProps> = ({
  open,
  setOpen,
  brand,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
        const response = await apiFetch(`/brands/${brand.id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            router.refresh();
            toast.success("Brand deleted successfully");
            window.dispatchEvent(new CustomEvent("brands:updated"));
        } else {
            const err = await response.json();
            toast.error(err.error || "Failed to delete brand");
        }
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="font-bold">{brand.name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild onClick={(e) => {
              e.preventDefault();
              handleDelete();
          }}>
            <Button variant="destructive" disabled={loading}>
              {loading ? "Loading..." : "Continue"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
