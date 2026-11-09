'use client';

import { FC, useEffect, useState } from "react";
import Image from "next/image";
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
import { toast } from "sonner";
import { type Category } from "@/lib/api";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { apiFetch } from "@/lib/apiFetch";
import { uploadToCloudinary } from "@/lib/cloudinary";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.instanceof(File).optional(),
});

interface CategoryDialogFormProps {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  category?: Category;
}

export const CategoryDialogForm: FC<CategoryDialogFormProps> = ({
  open: isOpen = false,
  onOpenChange,
  category,
}) => {
  const [open, setOpen] = useState(isOpen);
  const [preview, setPreview] = useState<string | null>((category as unknown as { image?: string })?.image || null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => onOpenChange?.(open), [open, onOpenChange]);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    setLoading(true);
    try {
      let imageUrl: string | undefined = undefined;
      if (values.image instanceof File) {
        toast.loading("Uploading image to Cloudinary...", { id: "cat-dialog-upload" });
        imageUrl = await uploadToCloudinary(values.image, "moodest/categories");
        toast.success("Image uploaded successfully!", { id: "cat-dialog-upload" });
      }

      const payload: Record<string, any> = {
        name: values.name,
        slug: values.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      };
      if (imageUrl) {
        payload.image = imageUrl;
      }

      const endpoint = category
        ? `/categories/${category.id}`
        : "/categories";
      const method = category ? "PATCH" : "POST";

      const response = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(category ? "Category updated" : "Category created");
        form.reset();
        setPreview(null);
        router.refresh();
        setOpen(false);
        window.dispatchEvent(new CustomEvent("categories:updated"));
      } else {
        const err = await response.json().catch(() => ({})) as { message?: string };
        toast.error(err.message || "Failed to save category");
      }
    } catch {
        toast.error("An error occurred");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!category && (
        <DialogTrigger asChild>
          <Button variant="outline">Add Category</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit" : "Add"} Category</DialogTitle>
        </DialogHeader>
        <DialogDescription>Fill in the category details below.</DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Image {!category && "*"}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      {...rest}
                      value={undefined}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          setPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </FormControl>

                  {preview && (
                    <div className="mt-2 relative h-24 w-24 rounded-md border overflow-hidden">
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "Loading..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
