"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpRight,
  Edit2,
  MoreHorizontal,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface InventoryActionMenuProps {
  product: { id: string; name: string };
}

export const InventoryActionMenu = ({ product }: InventoryActionMenuProps) => {
  const router = useRouter();

  const handleViewClick = () => {
    router.push(`/products/${product.id}`);
  };

  const handleEditClick = () => {
    router.push(`/products/edit-product/${product.id}`);
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={handleViewClick}>
            <ArrowUpRight className="size-4 mr-2" />
            View Product
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleEditClick}>
            <Edit2 className="size-4 mr-2" />
            Adjust Stock &amp; Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
