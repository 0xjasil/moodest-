"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Tag,
  Layers,
  Package,
  Users,
  Settings,
  BarChart3,
  ShoppingCart,
  FileText,
  ChevronRight,
  Boxes,
} from "lucide-react";

import { ModeToggle } from "@/components/ui/mode-toggle";

interface AdminHeaderProps {
  className?: string;
}

interface PageInfo {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const pageMap: Record<string, PageInfo> = {
  "/": {
    title: "Dashboard",
    description: "Overview of your store",
    icon: LayoutDashboard,
  },
  "/products": {
    title: "Products",
    description: "Manage your product inventory",
    icon: Package,
  },
  "/brand": {
    title: "Brands",
    description: "Manage product brands",
    icon: Tag,
  },
  "/category": {
    title: "Categories",
    description: "Organize product categories",
    icon: Layers,
  },
  "/subcategory": {
    title: "Subcategories",
    description: "Manage product subcategories",
    icon: FileText,
  },
  "/orders": {
    title: "Orders",
    description: "View and manage customer orders",
    icon: ShoppingCart,
  },
  "/customers": {
    title: "Customers",
    description: "Manage customer information",
    icon: Users,
  },
  "/inventory": {
    title: "Inventory",
    description: "View and manage product inventory",
    icon: Boxes,
  },
  "/variations": {
    title: "Variations",
    description: "Manage product variations",
    icon: Layers,
  },
  "/analytics": {
    title: "Analytics",
    description: "View store performance metrics",
    icon: BarChart3,
  },
  "/settings": {
    title: "Settings",
    description: "Configure store settings",
    icon: Settings,
  },
};

export function AdminHeader({ className }: AdminHeaderProps) {
  const pathname = usePathname();
  
  // Get current page info or default to dashboard
  const currentPage = pageMap[pathname] || pageMap["/"];
  const Icon = currentPage.icon;

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center pl-16 pr-4 lg:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Dashboard</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{currentPage.title}</span>
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <div className="flex items-center space-x-3 border-l pl-4 border-sidebar-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-foreground leading-none">
                {currentPage.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {currentPage.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
