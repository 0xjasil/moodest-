"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarContext } from "@/context/sidebar-context";
import defaultMenuData from "@/config/sidebar-menu";
import {
  SidebarMenuData,
  SidebarItem,
  getSidebarIcon,
} from "@/types/sidebar";

interface AdminSidebarProps {
  className?: string;
  menuData?: SidebarMenuData;
}

/**
 * Route matching logic: check exact match or parent prefix
 */
function isPathActive(pathname: string, href?: string): boolean {
  if (!href) return false;
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  className = "",
  menuData = defaultMenuData as SidebarMenuData,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const {
    isCollapsed,
    toggleCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    toggleMobileMenu,
  } = useSidebarContext();

  // Track expanded parent items (Accordion behavior)
  const [openParentIds, setOpenParentIds] = useState<Record<string, boolean>>({});

  // Automatically expand parent of active route on page load / path change
  useEffect(() => {
    menuData.sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) =>
            isPathActive(pathname, child.href)
          );
          const isParentActive = isPathActive(pathname, item.href);
          if (hasActiveChild || isParentActive) {
            setOpenParentIds((prev) => ({
              ...prev,
              [item.id]: true,
            }));
          }
        }
      });
    });
  }, [pathname, menuData]);

  const toggleParent = (itemId: string) => {
    setOpenParentIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderSidebarContent = (isMini: boolean) => (
    <div className="flex flex-col h-full select-none">
      {/* 1. Header / User Profile Section */}
      <div className="relative pt-4 pb-3 px-3.5">
        {/* Toggle Collapse Chevron Button at top-right corner */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden lg:flex size-6 rounded-md bg-white dark:bg-[#1C202B] border border-gray-200/80 dark:border-white/10 shadow-xs items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer absolute ${
            isMini ? "top-3 right-1.5" : "top-3.5 right-3"
          }`}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isMini ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </button>

        {isMini ? (
          /* Mini / Collapsed Profile Avatar */
          <div className="flex flex-col items-center mt-3">
            <div
              style={{ backgroundColor: menuData.user.avatarBg || "#FCA5A5" }}
              className="size-10 rounded-full overflow-hidden p-0.5 border border-white dark:border-white/10 shadow-2xs shrink-0 flex items-center justify-center"
            >
              <Image
                src={menuData.user.avatar}
                alt={menuData.user.name}
                width={40}
                height={40}
                priority
                className="size-full object-cover rounded-full"
              />
            </div>
          </div>
        ) : (
          /* Expanded User Profile Details */
          <div className="flex items-center gap-3 pr-7">
            <div
              style={{ backgroundColor: menuData.user.avatarBg || "#FCA5A5" }}
              className="size-10 rounded-full overflow-hidden p-0.5 border border-white dark:border-white/10 shadow-2xs shrink-0 flex items-center justify-center"
            >
              <Image
                src={menuData.user.avatar}
                alt={menuData.user.name}
                width={40}
                height={40}
                priority
                className="size-full object-cover rounded-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-400 uppercase block truncate">
                {menuData.user.role}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white block truncate leading-tight">
                {menuData.user.name}
              </span>
            </div>
          </div>
        )}

        {/* Divider under header */}
        <div className="border-b border-gray-100 dark:border-white/5 mt-4" />
      </div>

      {/* 2. Scrollable Navigation Menu Sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-4 scrollbar-none">
        <TooltipProvider delayDuration={50}>
          {menuData.sections.map((section) => (
            <div key={section.id} className="space-y-1">
              {/* Section Heading (MAIN / SETTINGS) */}
              {isMini ? (
                <div className="text-[9px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase text-center py-1">
                  {section.label}
                </div>
              ) : (
                <div className="text-[11px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase px-3 pt-1 pb-1">
                  {section.label}
                </div>
              )}

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const IconComponent = getSidebarIcon(item.icon);
                  const hasChildren = item.children && item.children.length > 0;
                  const isOpen = !!openParentIds[item.id];

                  const isChildActive =
                    hasChildren &&
                    item.children?.some((child) => isPathActive(pathname, child.href));
                  const isItemActive = isPathActive(pathname, item.href);
                  const isHighlighted = isChildActive || (isItemActive && !hasChildren);

                  if (isMini) {
                    /* Mini / Collapsed Icon Item with Tooltip */
                    return (
                      <div key={item.id} className="flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleParent(item.id);
                                  toggleCollapsed(); // Clicking in mini mode expands to show children
                                }}
                                className={`size-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                                  isHighlighted
                                    ? "bg-gray-100 dark:bg-[#1E2330] text-gray-900 dark:text-white shadow-2xs"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                }`}
                                aria-label={item.title}
                              >
                                <IconComponent className="size-5" />
                              </button>
                            ) : (
                              <Link
                                href={item.href || "/"}
                                className={`size-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                  isHighlighted
                                    ? "bg-gray-100 dark:bg-[#1E2330] text-gray-900 dark:text-white shadow-2xs"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                }`}
                                aria-label={item.title}
                              >
                                <IconComponent className="size-5" />
                              </Link>
                            )}
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            sideOffset={10}
                            className="bg-[#0B0E14] dark:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border-none"
                          >
                            <span>{item.title}</span>
                            {hasChildren && item.children && (
                              <div className="mt-1.5 pt-1.5 border-t border-white/10 space-y-0.5 text-left font-normal">
                                {item.children.map((child) => (
                                  <Link
                                    key={child.id}
                                    href={child.href}
                                    className="block text-gray-300 hover:text-white py-0.5 text-[11px]"
                                  >
                                    {child.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  }

                  /* Expanded Item */
                  return (
                    <div key={item.id} className="space-y-1">
                      {hasChildren ? (
                        /* Parent Header Button with Chevron */
                        <button
                          type="button"
                          onClick={() => toggleParent(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                            isOpen || isHighlighted
                              ? "bg-gray-100/80 dark:bg-[#1E2330] text-gray-900 dark:text-white font-semibold shadow-2xs"
                              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`size-4.5 shrink-0 transition-colors ${
                                isOpen || isHighlighted
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                                {item.badge}
                              </span>
                            )}
                            <ChevronDown
                              className={`size-3.5 text-gray-400 transition-transform duration-200 ${
                                isOpen ? "rotate-180 text-gray-700 dark:text-gray-200" : ""
                              }`}
                            />
                          </div>
                        </button>
                      ) : (
                        /* Leaf Link Item (e.g. Dashboard) */
                        <Link
                          href={item.href || "/"}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            isItemActive
                              ? "bg-gray-100/80 dark:bg-[#1E2330] text-gray-900 dark:text-white font-semibold shadow-2xs"
                              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`size-4.5 shrink-0 transition-colors ${
                                isItemActive
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>

                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Children Submenu with Tree-Line Branch Hierarchy (Matching Reference Image) */}
                      {hasChildren && isOpen && (
                        <div className="relative pl-7 pr-1 pt-1 pb-1 ml-2.5">
                          {/* Continuous Vertical Tree Line */}
                          <div className="absolute left-2.5 top-0 bottom-2.5 w-px bg-gray-200 dark:bg-white/10" />

                          <div className="space-y-1">
                            {item.children?.map((child) => {
                              const isChildSelected = isPathActive(
                                pathname,
                                child.href
                              );

                              return (
                                <div key={child.id} className="relative">
                                  {/* Branch connector tick from tree line */}
                                  <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-3.5 h-px bg-gray-200 dark:bg-white/10" />

                                  <Link
                                    href={child.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-150 ${
                                      isChildSelected
                                        ? "bg-gray-100 dark:bg-[#222838] text-gray-900 dark:text-white font-semibold shadow-2xs"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <span className="truncate">{child.title}</span>
                                    {child.badge && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                                        {child.badge}
                                      </span>
                                    )}
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Menu Trigger Button (Visible on screens < lg) */}
      <div className="lg:hidden fixed top-3.5 left-4 z-40">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="size-9 rounded-xl bg-white dark:bg-[#14171F] border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* 2. Mobile Drawer Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 bg-white dark:bg-[#12151D] border-r border-gray-200/80 dark:border-white/10"
        >
          <SheetTitle className="sr-only">Sidebar Navigation Menu</SheetTitle>
          {renderSidebarContent(false)}
        </SheetContent>
      </Sheet>

      {/* 3. Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ease-in-out bg-white dark:bg-[#12151D] border-r border-gray-200/80 dark:border-white/10 shadow-xs ${
          isCollapsed ? "w-[76px]" : "w-[260px]"
        } ${className}`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>
    </>
  );
}
