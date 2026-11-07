'use client';

import { FC, useState } from "react";
import { type Category } from "@/lib/api";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

interface DeleteCategoryDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  category: Category;
}

export const DeleteCategoryDialog: FC<DeleteCategoryDialogProps> = ({ open, setOpen, category }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
        const response = await apiFetch(`/categories/${category.id}`, {
            method: "DELETE"
        });
        if (response.ok) {
            router.refresh();
            toast.success("Category deleted successfully");
            window.dispatchEvent(new CustomEvent("categories:updated"));
        } else {
            const err = await response.json();
            toast.error(err.error || "Failed to delete category");
        }
    } catch {
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
            This will permanently delete <strong>{category.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
