"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

const makeIcon = (iconName: string) => function HeaderIcon({ className }: { className?: string }) {
  return <Icon icon={iconName} className={className} />;
};

const LayoutDashboard = makeIcon("lucide:layout-dashboard");
const Tag = makeIcon("lucide:tag");
const Layers = makeIcon("lucide:layers");
const Package = makeIcon("lucide:package");
const Users = makeIcon("lucide:users");
const Settings = makeIcon("lucide:settings");
const BarChart3 = makeIcon("lucide:bar-chart-3");
const ShoppingCart = makeIcon("lucide:shopping-cart");
const FileText = makeIcon("lucide:file-text");
const ChevronRight = makeIcon("lucide:chevron-right");
const Boxes = makeIcon("lucide:boxes");

import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/context/AuthContext";
import { AvatarWithFallback } from "@/components/ui/avatar-with-fallback";
import Link from "next/link";

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
  const { user } = useAuth();
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  useEffect(() => {
    const syncAvatar = () => {
      try {
        const stored = localStorage.getItem("admin_avatar");
        if (stored) setCustomAvatar(stored);
      } catch {}
    };
    syncAvatar();
    window.addEventListener("admin_avatar_updated", syncAvatar);
    return () => window.removeEventListener("admin_avatar_updated", syncAvatar);
  }, []);
  
  // Get current page info or default to dashboard
  const currentPage = pageMap[pathname] || pageMap["/"];
  const Icon = currentPage.icon;

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : "Admin";
  const userAvatar = customAvatar || user?.avatar || user?.image || "/images/avatars/1.webp";

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
        <div className="ml-auto flex items-center space-x-3 sm:space-x-4">
          <ModeToggle />
          
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Admin Profile"
          >
            <AvatarWithFallback
              src={userAvatar}
              name={displayName}
              size={34}
              className="size-8 text-[11px]"
            />
            <span className="hidden md:inline-block text-xs font-semibold text-gray-900 dark:text-white">
              {displayName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
