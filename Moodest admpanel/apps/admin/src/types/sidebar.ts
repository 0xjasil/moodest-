import React from "react";
import { Icon } from "@iconify/react";

export interface SidebarUser {
  name: string;
  role: string;
  avatar: string;
  avatarBg?: string;
}

export interface SidebarChildItem {
  id: string;
  title: string;
  href: string;
  badge?: string | number;
}

export interface SidebarItem {
  id: string;
  title: string;
  icon: string;
  href?: string;
  badge?: string | number;
  children?: SidebarChildItem[];
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
}

export interface SidebarMenuData {
  user: SidebarUser;
  sections: SidebarSection[];
}

export type IconComponent = React.ComponentType<{ className?: string; [key: string]: any }>;

const SIDEBAR_ICON_MAP: Record<string, string> = {
  Home: "lucide:home",
  Users: "lucide:users",
  FileText: "lucide:file-text",
  Calendar: "lucide:calendar",
  BarChart3: "lucide:bar-chart-3",
  Store: "lucide:store",
  Settings: "lucide:settings",
  Tag: "lucide:tag",
  ShoppingCart: "lucide:shopping-cart",
  Megaphone: "lucide:megaphone",
  ScrollText: "lucide:scroll-text",
  Boxes: "lucide:boxes",
  Layers: "lucide:layers",
  Package: "lucide:package",
};

export function getSidebarIcon(name: string): IconComponent {
  const iconId = SIDEBAR_ICON_MAP[name] || `lucide:${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
  return function SidebarIconComponent({ className = "size-5", ...props }: { className?: string; [key: string]: any }) {
    return React.createElement(Icon, { icon: iconId, className, ...props });
  };
}
