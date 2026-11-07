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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Page } from "@/types/page";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api-client";

interface DeletePageDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  page: Page;
}

export const DeletePageDialog: FC<DeletePageDialogProps> = ({
  open,
  setOpen,
  page,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pages/${page.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.refresh();
        toast.success("Page deleted successfully");
        window.dispatchEvent(new CustomEvent("pages:updated"));
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
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
            <span className="font-bold">{page.title}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            asChild
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            <Button variant="destructive" disabled={loading}>
              {loading ? "Loading..." : "Continue"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
