'use client';

import { type Brand } from "@/lib/api";
import { ColumnDef, Row } from "@tanstack/react-table";
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
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeleteBrandDialog } from "./delete-brand-dialog";
import { BrandDialogForm } from "./brand-dialog-from";

// ✅ Typed ActionCell
function ActionCell({ row }: { row: Row<Brand> }) {
    const [openDelete, setOpenDelete] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const brand = row.original;

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
                        Edit Brand
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => setOpenDelete(true)}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete Brand
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {openEdit && (
                <BrandDialogForm
                    brand={brand}
                    open={openEdit}
                    onOpenChange={setOpenEdit} // ✅ changed from openChange
                />
            )}


            <DeleteBrandDialog
                open={openDelete}
                setOpen={setOpenDelete}
                brand={brand}
            />
        </div>
    );
}

export const brandColumns: ColumnDef<Brand>[] = [
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
        cell: ({ row }) => (
            <div className="px-4 py-2">{row.getValue("name")}</div>
        ),
    },
    {
        id: "actions",
        cell: (props) => <ActionCell row={props.row} />,
    },
];
