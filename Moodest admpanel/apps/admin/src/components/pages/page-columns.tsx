'use client';

import { Page } from "@/types/page";
import { ColumnDef, Column, Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreVertical,
  Trash2,
} from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DeletePageDialog } from "./delete-page-dialog";
import { PageDialogForm } from "./page-dialog-form";

function ActionCell({ row }: { row: Row<Page> }) {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const page = row.original;

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
            <Edit className="mr-2 size-4" />
            Edit Page
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setOpenDelete(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Delete Page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {openEdit && (
        <PageDialogForm page={page} open={openEdit} onOpenChange={setOpenEdit} />
      )}

      <DeletePageDialog
        open={openDelete}
        setOpen={setOpenDelete}
        page={page}
      />
    </div>
  );
}

function SortableHeader({ column, label }: { column: Column<Page>; label: string }) {
  const sort = column.getIsSorted();
  const renderIcon = () => {
    if (!sort) return <ArrowUpDown />;
    if (sort === "asc") return <ArrowUp />;
    if (sort === "desc") return <ArrowDown />;
  };
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sort === "asc")}
    >
      {label} {renderIcon()}
    </Button>
  );
}

export const pageColumns: ColumnDef<Page>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <div className="px-4 py-2 font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <div className="px-4 py-2 font-mono text-xs text-muted-foreground">
        /{row.getValue("slug")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return status === "published" ? (
        <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center w-fit gap-1 font-medium">
          Published
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center w-fit gap-1 font-medium"
        >
          Draft
        </Badge>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Updated" />
    ),
    cell: ({ row }) => (
      <div className="px-4 py-2 text-sm text-muted-foreground">
        {new Date(row.getValue("updatedAt")).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    ),
  },
  {
    id: "actions",
    cell: (props) => <ActionCell row={props.row} />,
  },
];
