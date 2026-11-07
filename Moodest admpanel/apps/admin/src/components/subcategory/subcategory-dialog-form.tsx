"use client";

import { FC, useEffect, useState } from "react";
import { type Category } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/apiFetch";

const subcategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  // parentId as string for Select compatibility, converted to number on submit
  parentId: z.string().min(1, "Parent category is required"),
});

interface SubcategoryItem {
  id: string | number;
  name: string;
  parentId?: string | number | null;
}

interface SubcategoryDialogFormProps {
  /** Top-level categories to pick a parent from */
  categories?: Category[];
  open?: boolean;
  openChange?: (v: boolean) => void;
  subcategory?: SubcategoryItem;
}

export const SubcategoryDialogForm: FC<SubcategoryDialogFormProps> = ({
  categories: categoriesProp = [],
  open: isOpen = false,
  openChange,
  subcategory,
}) => {
  const [open, setOpen] = useState(isOpen);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    openChange?.(open);
  }, [open, openChange]);

  const form = useForm<z.infer<typeof subcategorySchema>>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: subcategory?.name || "",
      parentId: subcategory?.parentId ? String(subcategory.parentId) : "",
    },
  });

  const onSubmit = async (values: z.infer<typeof subcategorySchema>) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, "-"),
        parentId: Number(values.parentId),
      };

      // NestJS: PATCH /categories/:id for edit, POST /categories for create
      const endpoint = subcategory
        ? `/categories/${subcategory.id}`
        : "/categories";
      const method = subcategory ? "PATCH" : "POST";

      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(subcategory ? "Subcategory updated" : "Subcategory created");
        form.reset();
        router.refresh();
        setOpen(false);
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to save subcategory");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!subcategory && (
        <DialogTrigger asChild>
          <Button variant="outline">Add Subcategory</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {subcategory ? "Edit" : "Add"} Subcategory
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Subcategories are categories with a parent category.
        </DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Serums" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesProp.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
