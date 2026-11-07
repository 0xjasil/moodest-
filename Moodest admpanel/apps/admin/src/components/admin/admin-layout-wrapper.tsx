"use client";

import React from "react";
import { SidebarProvider, useSidebarContext } from "@/context/sidebar-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { cn } from "@/lib/utils";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-700">
      <AdminSidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-[76px]" : "lg:pl-[260px]"
        )}
      >
        <AdminHeader />
        <main className="p-6 md:p-8 flex-1 w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
