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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteDialogProps {
  title?: string;
  itemName: string;
  itemType: string; // e.g., "attribute", "attribute value", "product", etc.
  onDelete: () => Promise<void>;
  warningMessage?: string;
  variant?: "ghost" | "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showOnHover?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export default function DeleteDialog({
  title,
  itemName,
  itemType,
  onDelete,
  warningMessage,
  variant = "ghost",
  size = "sm",
  className = "",
  showOnHover = false,
  successMessage,
  errorMessage,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      toast.success(
        successMessage || `${itemType} "${itemName}" deleted successfully`
      );
      setOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(errorMessage || `Failed to delete ${itemType}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`${className} ${
            showOnHover ? "transition-opacity cursor-pointer hover:text-destructive" : ""
          }`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || `Delete ${itemType}`}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
              Are you sure you want to delete the {itemType}{" "}
              <span className="font-semibold text-foreground">
                &quot;{itemName}&quot;
              </span>
              ?
            {warningMessage && (
              <p className="text-destructive font-medium">{warningMessage}</p>
            )}
            <p>This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
