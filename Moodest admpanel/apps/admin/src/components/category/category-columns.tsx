
'use client';

import { useState } from "react";
import { type Category } from "@/lib/api";
import { ColumnDef, Row } from "@tanstack/react-table";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Edit,
  MoreVertical,
  Trash2
} from "lucide-react";
import { CategoryDialogForm } from "./category-dialog-form";
import { DeleteCategoryDialog } from "./delete-category-dialog";

// ✅ Typed ActionCell
function ActionCell({ row }: { row: Row<Category> }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const category = row.original;

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            <Edit className="mr-2 size-4" /> Edit Category
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setOpenDelete(true)}
          >
            <Trash2 className="mr-2 size-4" /> Delete Category
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {openEdit && (
        <CategoryDialogForm
          category={category}
          open={openEdit}
          onOpenChange={setOpenEdit} // ShadCN uses onOpenChange
        />
      )}

      <DeleteCategoryDialog
        open={openDelete}
        setOpen={setOpenDelete}
        category={category}
      />
    </div>
  );
}


export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("image") as string | null;
      return imageUrl ? (
        <div className="relative h-12 w-12 rounded-md overflow-hidden border">
          <Image
            src={imageUrl}
            alt={row.getValue("name")}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-12 w-12 flex items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          N/A
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      const sort = column.getIsSorted();
      const renderIcon = () => {
        if (!sort) return <ArrowUpDown />;
        if (sort === "asc") return <ArrowUp />;
        if (sort === "desc") return <ArrowDown />;
      };
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(sort === "asc")}>
          Name {renderIcon()}
        </Button>
      );
    },
    cell: ({ row }) => <div className="px-4 py-2">{row.getValue("name")}</div>,
  },
  {
    id: "actions",
    cell: (props) => <ActionCell row={props.row} />,
  },
];
