"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogForm } from "./Dialog-form";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; 
import { API_URL } from "@/lib/api-client";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
};

function ActionsCell({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleUnban = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${API_URL}/users/${user.id}/unban`, {
            method: "POST",
            credentials: "include"
        });
        const res = await response.json();
        if (response.ok) {
          toast.success(res.message || "User unbanned");
          window.location.reload(); 
        } else {
          toast.error(res.error || "Failed to unban user");
        }
    } catch (err) {
        toast.error("An error occurred");
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          {/* ✅ Updated View Details */}
          <DropdownMenuItem onClick={() => router.push(`/customers/${user.id}`)}>
            View Details
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {user.banned ? (
            <DropdownMenuItem
              onClick={handleUnban}
              className="text-green-600"
              disabled={loading}
            >
              {loading ? "Unbanning..." : "Unban"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setOpen(true)}
              className="text-red-600"
            >
              Ban
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogForm open={open} setOpen={setOpen} user={user} />
    </>
  );
}


export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.name || "N/A"}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone ?? "—",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => row.original.role ?? "user",
  },
  {
    accessorKey: "banned",
    header: "Status",
    cell: ({ row }) => {
      const { banned, banExpires } = row.original;

      if (!banned) {
        return (
          <span className="px-2 py-1 rounded bg-green-100 text-green-600 text-xs">
            Active
          </span>
        );
      }

      if (banExpires) {
        return (
          <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs">
            Banned until {new Date(banExpires).toLocaleDateString("en-GB")}
          </span>
        );
      }

      return (
        <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs">
          Permanently Banned
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell user={row.original} />,
  },
];
