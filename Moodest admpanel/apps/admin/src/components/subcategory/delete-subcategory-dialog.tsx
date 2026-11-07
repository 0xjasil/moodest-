'use client';

import { FC, useState } from "react";
import type { SubCategoryWithCategory } from "@/types/subcategory";
import { 
  AlertDialog, 
  AlertDialogContent,
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction, 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

interface DeleteSubcategoryDialogProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  subcategory: SubCategoryWithCategory;
}

export const DeleteSubcategoryDialog: FC<DeleteSubcategoryDialogProps> = ({ 
  open, 
  setOpen, 
  subcategory 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // NestJS: DELETE /categories/:id (works for both top-level and subcategories)
      const response = await apiFetch(`/categories/${subcategory.id}`, {
          method: "DELETE"
      });
      if (response.ok) {
        toast.success("Subcategory deleted successfully");
        router.refresh();
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to delete subcategory");
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
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
            This will permanently delete <span className="font-bold">{subcategory.name}</span>.
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
