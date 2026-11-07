'use client';
import { useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SubcategoryDialogForm } from "./subcategory-dialog-form";
import { DeleteSubcategoryDialog } from "./delete-subcategory-dialog";
import { SubCategoryWithCategory } from "@/types/subcategory";

// ✅ Action Cell - now uses SubCategoryWithCategory type
function ActionCell({ row }: { row: Row<SubCategoryWithCategory> }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const subcategory = row.original;
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
            <Edit className="mr-2 size-4" /> Edit Subcategory
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onSelect={() => setOpenDelete(true)}>
            <Trash2 className="mr-2 size-4" /> Delete Subcategory
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && <SubcategoryDialogForm subcategory={subcategory} open={openEdit} openChange={setOpenEdit} />}
      {openDelete && <DeleteSubcategoryDialog subcategory={subcategory} open={openDelete} setOpen={setOpenDelete} />}
    </div>
  );
}

// ✅ Updated columns to work with SubCategoryWithCategory type
export const subcategoryColumns: ColumnDef<SubCategoryWithCategory>[] = [
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
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => {
      const categoryName = row.original.category?.name;
      return <div className="px-4 py-2">{categoryName || "No Category"}</div>;
    },
  },
  {
    id: "actions",
    cell: (props) => <ActionCell row={props.row} />,
  },
];
