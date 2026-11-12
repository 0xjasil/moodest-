"use client";

import React from "react";
import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

export interface AppIconProps extends Omit<IconProps, "icon"> {
  icon: string;
  className?: string;
  size?: number | string;
}

export type LucideIcon = React.ComponentType<any>;
export type LucideProps = React.SVGProps<SVGSVGElement> & { size?: number | string; className?: string };

export function Icon({ icon, className, size, ...props }: AppIconProps) {
  return (
    <IconifyIcon
      icon={icon}
      className={className}
      width={size}
      height={size}
      {...props}
    />
  );
}

export function createIcon(iconName: string) {
  const Component = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { size?: number | string; className?: string; [key: string]: any }>(
    function IconWrapper({ className, size, ...props }, ref) {
      return <IconifyIcon icon={iconName} className={className} width={size} height={size} {...(props as any)} />;
    }
  );
  Component.displayName = `Icon(${iconName})`;
  return Component;
}

export const Activity = createIcon("lucide:activity");
export const AlertCircle = createIcon("lucide:alert-circle");
export const AlertTriangle = createIcon("lucide:alert-triangle");
export const ArrowDown = createIcon("lucide:arrow-down");
export const ArrowLeft = createIcon("lucide:arrow-left");
export const ArrowRight = createIcon("lucide:arrow-right");
export const ArrowUp = createIcon("lucide:arrow-up");
export const ArrowUpDown = createIcon("lucide:arrow-up-down");
export const ArrowUpRight = createIcon("lucide:arrow-up-right");
export const Banknote = createIcon("lucide:banknote");
export const Bell = createIcon("lucide:bell");
export const Boxes = createIcon("lucide:boxes");
export const Building = createIcon("lucide:building");
export const Building2 = createIcon("lucide:building-2");
export const Calendar = createIcon("lucide:calendar");
export const CalendarIcon = createIcon("lucide:calendar");
export const Check = createIcon("lucide:check");
export const CheckCheck = createIcon("lucide:check-check");
export const CheckCircle = createIcon("lucide:check-circle");
export const CheckCircle2 = createIcon("lucide:check-circle-2");
export const ChevronDown = createIcon("lucide:chevron-down");
export const ChevronDownIcon = createIcon("lucide:chevron-down");
export const ChevronLeft = createIcon("lucide:chevron-left");
export const ChevronLeftIcon = createIcon("lucide:chevron-left");
export const ChevronRight = createIcon("lucide:chevron-right");
export const ChevronRightIcon = createIcon("lucide:chevron-right");
export const ChevronUp = createIcon("lucide:chevron-up");
export const Circle = createIcon("lucide:circle");
export const Clock = createIcon("lucide:clock");
export const Copy = createIcon("lucide:copy");
export const CreditCard = createIcon("lucide:credit-card");
export const Crown = createIcon("lucide:crown");
export const Database = createIcon("lucide:database");
export const DollarSign = createIcon("lucide:dollar-sign");
export const Download = createIcon("lucide:download");
export const Edit = createIcon("lucide:pencil");
export const Edit2 = createIcon("lucide:edit-2");
export const Edit3 = createIcon("lucide:edit-3");
export const ExternalLink = createIcon("lucide:external-link");
export const Eye = createIcon("lucide:eye");
export const FileSpreadsheet = createIcon("lucide:file-spreadsheet");
export const FileText = createIcon("lucide:file-text");
export const Filter = createIcon("lucide:filter");
export const Gift = createIcon("lucide:gift");
export const Globe = createIcon("lucide:globe");
export const HelpCircle = createIcon("lucide:help-circle");
export const Home = createIcon("lucide:home");
export const Image = createIcon("lucide:image");
export const ImageIcon = createIcon("lucide:image");
export const IndianRupee = createIcon("lucide:indian-rupee");
export const Info = createIcon("lucide:info");
export const KeyRound = createIcon("lucide:key-round");
export const Layers = createIcon("lucide:layers");
export const Loader2 = createIcon("lucide:loader-2");
export const Lock = createIcon("lucide:lock");
export const LogOut = createIcon("lucide:log-out");
export const Mail = createIcon("lucide:mail");
export const MapPin = createIcon("lucide:map-pin");
export const MoreHorizontal = createIcon("lucide:more-horizontal");
export const MoreVertical = createIcon("lucide:more-vertical");
export const Package = createIcon("lucide:package");
export const PackageCheck = createIcon("lucide:package-check");
export const PanelLeft = createIcon("lucide:panel-left");
export const PanelLeftIcon = createIcon("lucide:panel-left");
export const Pencil = createIcon("lucide:pencil");
export const Percent = createIcon("lucide:percent");
export const Phone = createIcon("lucide:phone");
export const Plus = createIcon("lucide:plus");
export const RefreshCcw = createIcon("lucide:refresh-ccw");
export const RefreshCw = createIcon("lucide:refresh-cw");
export const RotateCcw = createIcon("lucide:rotate-ccw");
export const Save = createIcon("lucide:save");
export const Search = createIcon("lucide:search");
export const Settings = createIcon("lucide:settings");
export const Shield = createIcon("lucide:shield");
export const ShieldCheck = createIcon("lucide:shield-check");
export const ShoppingCart = createIcon("lucide:shopping-cart");
export const Smartphone = createIcon("lucide:smartphone");
export const Sparkles = createIcon("lucide:sparkles");
export const Star = createIcon("lucide:star");
export const Tag = createIcon("lucide:tag");
export const ToggleLeft = createIcon("lucide:toggle-left");
export const ToggleRight = createIcon("lucide:toggle-right");
export const Trash2 = createIcon("lucide:trash-2");
export const TrendingUp = createIcon("lucide:trending-up");
export const Truck = createIcon("lucide:truck");
export const User = createIcon("lucide:user");
export const Users = createIcon("lucide:users");
export const X = createIcon("lucide:x");
export const XCircle = createIcon("lucide:x-circle");

// Tabler compatibility aliases
export const IconDownload = Download;
export const IconFileSpreadsheet = FileSpreadsheet;
export const IconLogout = LogOut;

export default Icon;
