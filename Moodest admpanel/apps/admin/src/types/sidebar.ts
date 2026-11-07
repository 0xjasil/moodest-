import {
  Home,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Store,
  Settings,
  Tag,
  ShoppingCart,
  Megaphone,
  ScrollText,
  Boxes,
  Layers,
  type LucideIcon,
} from "lucide-react";

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

export const iconMap: Record<string, LucideIcon> = {
  Home,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Store,
  Settings,
  Tag,
  ShoppingCart,
  Megaphone,
  ScrollText,
  Boxes,
  Layers,
};

export function getSidebarIcon(name: string): LucideIcon {
  return iconMap[name] || FileText;
}
