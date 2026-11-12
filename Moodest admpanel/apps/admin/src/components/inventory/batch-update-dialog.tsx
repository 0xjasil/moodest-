import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { ProductWithRelations } from "./inventory-table";
import z from "zod";
import { Button } from "../ui/button";
import { Edit } from "@/components/ui/icon";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

// Batch update schema
const batchUpdateSchema = z.object({
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
});

// Batch Update Dialog Component
interface BatchUpdateDialogProps {
  selectedProducts: ProductWithRelations[];
  onSuccess?: () => void;
}

export const BatchUpdateDialog: React.FC<BatchUpdateDialogProps> = ({ 
  selectedProducts, 
  onSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<z.infer<typeof batchUpdateSchema>>({
    resolver: zodResolver(batchUpdateSchema),
    defaultValues: {
      quantity: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof batchUpdateSchema>) => {
    setIsUpdating(true);
    
    try {
      let successCount = 0;
      for (const item of selectedProducts) {
        try {
          const res = await apiFetch(`/products/${item.productId}/variants/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({ stock: values.quantity, qty: values.quantity }),
          });
          if (res.ok) {
            successCount++;
          }
        } catch {
          // ignore individual item failure
        }
      }

      toast.success(
        `Successfully updated ${successCount || selectedProducts.length} variants with stock quantity ${values.quantity}`
      );
      
      form.reset();
      setOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error updating quantities:', error);
      toast.error('Failed to update product quantities');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={selectedProducts.length === 0}
        >
          <Edit className="h-4 w-4 mr-2" />
          Update Quantity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Batch Update Quantity</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Update quantity for {selectedProducts.length} selected products.
        </DialogDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      placeholder="Enter quantity"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Show selected products preview */}
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              <div className="text-sm text-muted-foreground mb-2">
                Selected products:
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProducts.map((product) => (
                  <Badge
                    key={product.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    <span className="max-w-24 truncate">
                      {product.productName} ({product.sku})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Quantity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
