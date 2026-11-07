"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  Hash,
  CheckCircle2,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  SearchX,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  INITIAL_ATTRIBUTES,
  CATEGORIES,
  type AttributeItem,
  type VariationCategory,
} from "./variations.mock";

export default function VariationsPage() {
  const [attributes, setAttributes] = useState<AttributeItem[]>(INITIAL_ATTRIBUTES);
  const [selectedCategory, setSelectedCategory] = useState<VariationCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isAddAttrOpen, setIsAddAttrOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrCategory, setNewAttrCategory] = useState<AttributeItem["category"]>("Apparel");
  const [newAttrType, setNewAttrType] = useState<AttributeItem["type"]>("text");

  // Add value modal state
  const [addValueTargetId, setAddValueTargetId] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState("");
  const [newValueColor, setNewValueColor] = useState("#6366F1");

  // Edit attribute modal state
  const [editingAttr, setEditingAttr] = useState<AttributeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<AttributeItem["category"]>("Apparel");

  // Stats calculation
  const totalAttributes = attributes.length;
  const totalValues = useMemo(
    () => attributes.reduce((acc, a) => acc + a.values.length, 0),
    [attributes]
  );
  const activeCount = useMemo(
    () => attributes.filter((a) => a.status === "active").length,
    [attributes]
  );
  const unusedCount = useMemo(
    () => attributes.filter((a) => a.status === "hidden").length,
    [attributes]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: attributes.length };
    CATEGORIES.filter((c) => c !== "All").forEach((cat) => {
      counts[cat] = attributes.filter((a) => a.category === cat).length;
    });
    return counts;
  }, [attributes]);

  // Filtered and sorted attributes
  const filteredAttributes = useMemo(() => {
    return attributes
      .filter((attr) => {
        if (selectedCategory !== "All" && attr.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = attr.name.toLowerCase().includes(q);
          const matchCategory = attr.category.toLowerCase().includes(q);
          const matchValue = attr.values.some((v) =>
            v.name.toLowerCase().includes(q)
          );
          if (!matchName && !matchCategory && !matchValue) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "products-desc") return b.productCount - a.productCount;
        if (sortBy === "values-desc") return b.values.length - a.values.length;
        return 0;
      });
  }, [attributes, selectedCategory, searchQuery, sortBy]);

  // Handlers
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Variations up to date");
    }, 450);
  };

  const handleExport = () => {
    try {
      const rows = [
        ["Attribute Name", "Category", "Status", "Product Count", "Values"],
        ...attributes.map((a) => [
          a.name,
          a.category,
          a.status,
          a.productCount.toString(),
          a.values.map((v) => v.name).join("; "),
        ]),
      ];
      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "variation_attributes.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Variation attributes exported to CSV");
    } catch {
      toast.error("Failed to export attributes");
    }
  };

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) {
      toast.error("Please enter an attribute name");
      return;
    }
    const newAttr: AttributeItem = {
      id: `attr-${Date.now()}`,
      name: newAttrName.trim(),
      category: newAttrCategory,
      productCount: 0,
      status: "active",
      type: newAttrType,
      values: [],
    };
    setAttributes((prev) => [newAttr, ...prev]);
    setNewAttrName("");
    setIsAddAttrOpen(false);
    toast.success(`Attribute "${newAttr.name}" created`);
  };

  const handleToggleStatus = (id: string) => {
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status === "active" ? "hidden" : "active";
          toast.success(
            `"${a.name}" set to ${nextStatus === "active" ? "Active" : "Hidden"}`
          );
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleDeleteAttribute = (id: string) => {
    const target = attributes.find((a) => a.id === id);
    setAttributes((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Attribute "${target?.name || id}" removed`);
  };

  const handleOpenAddValue = (attributeId: string) => {
    setAddValueTargetId(attributeId);
    setNewValueName("");
    setNewValueColor("#6366F1");
  };

  const handleSaveNewValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValueName.trim() || !addValueTargetId) {
      toast.error("Please enter a value name");
      return;
    }
    const target = attributes.find((a) => a.id === addValueTargetId);
    if (!target) return;

    const newValue = {
      id: `val-${Date.now()}`,
      name: newValueName.trim(),
      ...(target.type === "color" ? { colorHex: newValueColor } : {}),
    };

    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id === addValueTargetId) {
          return {
            ...a,
            values: [...a.values, newValue],
          };
        }
        return a;
      })
    );
    setAddValueTargetId(null);
    setNewValueName("");
    toast.success(`Added value "${newValue.name}" to ${target.name}`);
  };

  const handleStartEdit = (attr: AttributeItem) => {
    setEditingAttr(attr);
    setEditName(attr.name);
    setEditCategory(attr.category);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttr || !editName.trim()) return;
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === editingAttr.id
          ? { ...a, name: editName.trim(), category: editCategory }
          : a
      )
    );
    setEditingAttr(null);
    toast.success("Attribute updated successfully");
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
  };

  const targetAttributeForValue = attributes.find((a) => a.id === addValueTargetId);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* 1. Page Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Variations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage attributes and values
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            aria-label="Export attributes to CSV"
            className="h-9 px-3.5 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-white/5 font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            <Download className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAddAttrOpen(true)}
            aria-label="Add new attribute"
            className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add attribute
          </Button>
        </div>
      </div>

      {/* 2. Stats Strip: 4 small tiles (Attributes, Values, Active, Unused) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Attributes */}
        <div className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Attributes</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-0.5">
              {totalAttributes}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Total variation types
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        {/* Tile 2: Values */}
        <div className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Values</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-0.5">
              {totalValues}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Options across catalog
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
            <Hash className="h-5 w-5" />
          </div>
        </div>

        {/* Tile 3: Active */}
        <div className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Active</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-0.5">
              {activeCount}
            </p>
            <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Live on storefront
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Tile 4: Unused */}
        <div className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Unused</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-0.5">
              {unusedCount}
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Hidden or draft
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
            <EyeOff className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar: category tabs, search box, sort dropdown, Refresh */}
      <div className="flex flex-col gap-3">
        {/* Category tabs (scrolls horizontally on mobile) */}
        <div className="overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          <div className="flex items-center gap-1.5 min-w-max">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs font-semibold"
                      : "bg-white dark:bg-[#141414] text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <span>{cat}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10.5px] font-medium leading-none",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Sort, and Refresh controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Filter variations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm rounded-lg border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] focus-visible:ring-indigo-500"
              aria-label="Filter variations by keyword"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search input"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-44">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  aria-label="Sort variation attributes"
                  className="h-9 w-full rounded-lg border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] text-xs font-medium focus-visible:ring-indigo-500"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="name-asc" className="text-xs">
                    Name: A to Z
                  </SelectItem>
                  <SelectItem value="name-desc" className="text-xs">
                    Name: Z to A
                  </SelectItem>
                  <SelectItem value="products-desc" className="text-xs">
                    Most products
                  </SelectItem>
                  <SelectItem value="values-desc" className="text-xs">
                    Most values
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh variations"
              className="h-9 px-3 rounded-lg border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-white/5 font-medium text-gray-700 dark:text-gray-200 shrink-0"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-2", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Attribute Grid & States */}
      {isLoading ? (
        // Skeleton loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 flex flex-col justify-between h-[210px] animate-pulse"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-md" />
                    <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800/60 rounded-md" />
                  </div>
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded-md" />
                </div>
                <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-800/60 rounded-md mt-2" />
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <div className="h-7 w-16 bg-gray-100 dark:bg-gray-800 rounded-md" />
                  <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                  <div className="h-7 w-14 bg-gray-100 dark:bg-gray-800 rounded-md" />
                  <div className="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-md" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between mt-auto">
                <div className="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : attributes.length === 0 ? (
        // Empty state
        <div className="rounded-[14px] border border-dashed border-gray-300 dark:border-white/15 bg-white dark:bg-[#141414] p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center mb-3">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No attributes yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Get started by creating your first product variation attribute like
            Size, Color, or Material.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddAttrOpen(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add attribute
          </Button>
        </div>
      ) : filteredAttributes.length === 0 ? (
        // No results state
        <div className="rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-12 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 flex items-center justify-center mb-3">
            <SearchX className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            No attributes found
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            No variation attributes match &quot;
            {searchQuery || selectedCategory}&quot;.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        // Responsive grid of attribute cards: 3 cols desktop, 2 tablet, 1 mobile
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttributes.map((attr) => (
            <div
              key={attr.id}
              className="group relative rounded-[14px] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 transition-all duration-200 flex flex-col justify-between hover:border-indigo-500/60 dark:hover:border-indigo-500/60"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {attr.name}
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50">
                        {attr.category}
                      </span>
                    </div>
                    {/* Subline: 13px muted */}
                    <p className="text-[13px] text-muted-foreground mt-1">
                      {attr.values.length}{" "}
                      {attr.values.length === 1 ? "value" : "values"} ·{" "}
                      {attr.productCount} products
                    </p>
                  </div>

                  {/* "⋯" menu: appears on hover/focus */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Options for ${attr.name}`}
                        className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl">
                      <DropdownMenuItem
                        onClick={() => handleStartEdit(attr)}
                        className="text-xs cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit attribute
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenAddValue(attr.id)}
                        className="text-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Add value
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(attr.id)}
                        className="text-xs cursor-pointer"
                      >
                        {attr.status === "active" ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-2" />
                            Hide attribute
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Set active
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteAttribute(attr.id)}
                        className="text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card Body: wrapping value chips with NO inner scrollbar */}
                <div className="py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        {v.colorHex && (
                          <span
                            className="h-3 w-3 rounded-full border border-black/15 dark:border-white/20 shrink-0 shadow-2xs"
                            style={{ backgroundColor: v.colorHex }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{v.name}</span>
                      </span>
                    ))}
                    {attr.values.length === 0 && (
                      <span className="text-xs text-muted-foreground italic py-1">
                        No values yet. Click &quot;Add value&quot; below.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: dashed "+ Add value" chip and Active/Hidden badge */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => handleOpenAddValue(attr.id)}
                  aria-label={`Add value to ${attr.name}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add value</span>
                </button>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                    attr.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      attr.status === "active" ? "bg-emerald-500" : "bg-gray-400"
                    )}
                  />
                  {attr.status === "active" ? "Active" : "Hidden"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Attribute Modal */}
      <Dialog open={isAddAttrOpen} onOpenChange={setIsAddAttrOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add attribute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new product variation attribute for your catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAttribute} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="attr-name" className="text-xs font-medium">
                Name
              </Label>
              <Input
                id="attr-name"
                placeholder="e.g. Size, Scent, Pattern"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className="h-9 rounded-lg"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="attr-category" className="text-xs font-medium">
                  Category
                </Label>
                <Select
                  value={newAttrCategory}
                  onValueChange={(val) =>
                    setNewAttrCategory(val as AttributeItem["category"])
                  }
                >
                  <SelectTrigger id="attr-category" className="h-9 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Apparel">Apparel</SelectItem>
                    <SelectItem value="Footwear">Footwear</SelectItem>
                    <SelectItem value="Home & Living">Home & Living</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="attr-type" className="text-xs font-medium">
                  Display type
                </Label>
                <Select
                  value={newAttrType}
                  onValueChange={(val) =>
                    setNewAttrType(val as AttributeItem["type"])
                  }
                >
                  <SelectTrigger id="attr-type" className="h-9 w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="text">Text label</SelectItem>
                    <SelectItem value="color">Color swatch</SelectItem>
                    <SelectItem value="button">Button pill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAttrOpen(false)}
                className="rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newAttrName.trim()}
                className="rounded-lg h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create attribute
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Add Value to Attribute Modal */}
      <Dialog
        open={Boolean(addValueTargetId)}
        onOpenChange={(open) => !open && setAddValueTargetId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Add value to {targetAttributeForValue?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new selectable option for this attribute.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewValue} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="value-name" className="text-xs font-medium">
                Value name
              </Label>
              <Input
                id="value-name"
                placeholder={
                  targetAttributeForValue?.type === "color"
                    ? "e.g. Cobalt Blue, Forest Green"
                    : "e.g. XL, 256 GB, Velvet"
                }
                value={newValueName}
                onChange={(e) => setNewValueName(e.target.value)}
                className="h-9 rounded-lg"
                autoFocus
              />
            </div>

            {targetAttributeForValue?.type === "color" && (
              <div className="space-y-1.5">
                <Label htmlFor="color-hex" className="text-xs font-medium">
                  Swatch color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color-hex"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="h-9 w-12 rounded-lg border border-gray-200 dark:border-gray-800 p-0.5 bg-transparent cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="h-9 rounded-lg font-mono text-xs flex-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddValueTargetId(null)}
                className="rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newValueName.trim()}
                className="rounded-lg h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Add value
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Attribute Modal */}
      <Dialog
        open={Boolean(editingAttr)}
        onOpenChange={(open) => !open && setEditingAttr(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Edit attribute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update attribute name and category classification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-medium">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-9 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs font-medium">
                Category
              </Label>
              <Select
                value={editCategory}
                onValueChange={(val) =>
                  setEditCategory(val as AttributeItem["category"])
                }
              >
                <SelectTrigger id="edit-category" className="h-9 w-full rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Footwear">Footwear</SelectItem>
                  <SelectItem value="Home & Living">Home & Living</SelectItem>
                  <SelectItem value="Beauty">Beauty</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAttr(null)}
                className="rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editName.trim()}
                className="rounded-lg h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
