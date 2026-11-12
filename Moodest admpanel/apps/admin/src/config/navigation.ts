import React from "react";
import { Icon } from "@iconify/react";

export type IconComponent = React.ComponentType<{ className?: string; [key: string]: any }>;

const makeIcon = (iconName: string): IconComponent => {
  return function NavIcon({ className = "size-5", ...props }: { className?: string; [key: string]: any }) {
    return React.createElement(Icon, { icon: iconName, className, ...props });
  };
};

const Home = makeIcon("lucide:home");
const ShoppingCart = makeIcon("lucide:shopping-cart");
const Tag = makeIcon("lucide:tag");
const Users = makeIcon("lucide:users");
const Megaphone = makeIcon("lucide:megaphone");
const BarChart3 = makeIcon("lucide:bar-chart-3");
const ScrollText = makeIcon("lucide:scroll-text");
const Settings = makeIcon("lucide:settings");
const FileText = makeIcon("lucide:file-text");

export type Role =
  | "super_admin"
  | "admin"
  | "manager"
  | "fulfillment"
  | "editor"
  | "accountant";

export interface NavChildItem {
  id: string;
  title: string;
  /** Omitted for group labels (section headings inside a parent's children) */
  href?: string;
  /** Renders a non-clickable uppercase section heading instead of a link */
  isGroupLabel?: boolean;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "destructive" | "secondary";
  requiredRoles?: Role[];
}

export interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon: IconComponent;
  badge?: string | number;
  badgeVariant?: "default" | "warning" | "destructive" | "secondary";
  children?: NavChildItem[];
  requiredRoles?: Role[];
  pinnedBottom?: boolean;
}

// Mock constants for badges
// TODO: connect to real API for dynamic counts (e.g. open orders, low-stock threshold)
export const OPEN_ORDERS_BADGE_COUNT = 12;

export const navigationConfig: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    id: "products",
    title: "Products",
    href: "/products",
    icon: Tag,
    children: [
      {
        id: "product-list",
        title: "Product List",
        href: "/products/list",
      },
      {
        id: "add-product",
        title: "Add Product",
        href: "/products/add",
      },
      {
        id: "categories-list",
        title: "Categories List",
        href: "/products/categories-list",
      },
      {
        id: "hero-banners",
        title: "Hero Banners",
        href: "/banners",
      },
      {
        id: "editorial-gallery",
        title: "Visual Gallery",
        href: "/gallery",
      },
      {
        id: "discount-coupons",
        title: "Discount Coupons",
        href: "/products/discount-coupons",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    badge: OPEN_ORDERS_BADGE_COUNT,
    badgeVariant: "secondary",
    children: [
      {
        id: "order-list",
        title: "Order List",
        href: "/orders",
      },
      {
        id: "order-details",
        title: "Order Details",
        href: "/orders/ORD-9421",
      },
      {
        id: "order-tracking",
        title: "Order Tracking",
        href: "/orders/tracking",
      },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    id: "marketing",
    title: "Marketing",
    href: "/coupons",
    icon: Megaphone,
    children: [
      {
        id: "coupons",
        title: "Coupons",
        href: "/coupons",
      },
      {
        id: "banners",
        title: "Banners",
        href: "/banners",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    id: "logs",
    title: "Logs",
    href: "/activity-logs",
    icon: ScrollText,
    children: [
      {
        id: "activity-logs",
        title: "Activity Logs",
        href: "/activity-logs",
      },
      {
        id: "payment-logs",
        title: "Payment Logs",
        href: "/payment-logs",
      },
    ],
  },
  {
    id: "pages",
    title: "Pages",
    href: "/pages",
    icon: FileText,
    children: [
      // ── User Profile ──
      {
        id: "group-user-profile",
        title: "User Profile",
        isGroupLabel: true,
      },
      {
        id: "profile",
        title: "Profile",
        href: "/profile",
      },
      {
        id: "profile-teams",
        title: "Teams",
        href: "/profile/teams",
      },
      {
        id: "profile-projects",
        title: "Projects",
        href: "/profile/projects",
      },
      {
        id: "profile-connections",
        title: "Connections",
        href: "/profile/connections",
      },
      // ── Miscellaneous ──
      {
        id: "group-miscellaneous",
        title: "Miscellaneous",
        isGroupLabel: true,
      },
      {
        id: "misc-404",
        title: "404 Error",
        href: "/misc/404",
      },
      {
        id: "misc-403",
        title: "403 Forbidden",
        href: "/misc/403",
      },
      {
        id: "misc-maintenance",
        title: "Maintenance",
        href: "/misc/maintenance",
      },
      {
        id: "misc-500",
        title: "500 Server Error",
        href: "/misc/500",
      },
      {
        id: "misc-401",
        title: "401 Unauthorized",
        href: "/misc/401",
      },
      // ── Authentication Basic ──
      {
        id: "group-auth-basic",
        title: "Authentication Basic",
        isGroupLabel: true,
      },
      {
        id: "auth-login",
        title: "Login",
        href: "/auth/login",
      },
      {
        id: "auth-register",
        title: "Register",
        href: "/auth/register",
      },
      {
        id: "auth-verify-email",
        title: "Verify Email",
        href: "/auth/verify-email",
      },
      {
        id: "auth-reset-password",
        title: "Reset Password",
        href: "/auth/reset-password",
      },
      {
        id: "auth-forgot-password",
        title: "Forgot Password",
        href: "/auth/forgot-password",
      },
      {
        id: "auth-two-steps",
        title: "Two Steps",
        href: "/auth/two-steps",
      },
      // ── Authentication Cover ──
      {
        id: "group-auth-cover",
        title: "Authentication Cover",
        isGroupLabel: true,
      },
      {
        id: "auth-cover-login",
        title: "Cover Login",
        href: "/auth-cover/login",
      },
      {
        id: "auth-cover-register",
        title: "Cover Register",
        href: "/auth-cover/register",
      },
      {
        id: "auth-cover-verify-email",
        title: "Cover Verify",
        href: "/auth-cover/verify-email",
      },
      {
        id: "auth-cover-reset-password",
        title: "Cover Reset",
        href: "/auth-cover/reset-password",
      },
      {
        id: "auth-cover-forgot-password",
        title: "Cover Forgot",
        href: "/auth-cover/forgot-password",
      },
      {
        id: "auth-cover-two-steps",
        title: "Cover Two Steps",
        href: "/auth-cover/two-steps",
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
    pinnedBottom: true,
    children: [
      {
        id: "settings-store-details",
        title: "Store Details",
        href: "/settings/store-details",
      },
      {
        id: "settings-payments",
        title: "Payments",
        href: "/settings/payments",
      },
      {
        id: "settings-checkout",
        title: "Checkout",
        href: "/settings/checkout",
      },
      {
        id: "settings-shipping",
        title: "Shipping",
        href: "/settings/shipping",
      },
      {
        id: "settings-locations",
        title: "Locations",
        href: "/settings/locations",
      },
      {
        id: "settings-notifications",
        title: "Notifications",
        href: "/settings/notifications",
      },
    ],
  },
];

/**
 * Filter navigation items based on the user's role.
 * If no role is provided, it fails open (returns all items) for development convenience.
 * TODO: Enforce strict role-based gating once permissions are finalized in production.
 */
export function filterNavByRole(
  config: NavItem[],
  role?: string | null
): NavItem[] {
  if (!role) {
    return config;
  }

  return config
    .filter((item) => {
      if (item.requiredRoles && !item.requiredRoles.includes(role as Role)) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((child) => {
        if (child.requiredRoles && !child.requiredRoles.includes(role as Role)) {
          return false;
        }
        return true;
      });
      return {
        ...item,
        children: filteredChildren,
      };
    })
    .filter((item) => {
      // If an item had children and all were filtered out and it has no href, omit it
      if (item.children && item.children.length === 0 && !item.href) {
        return false;
      }
      return true;
    });
}
