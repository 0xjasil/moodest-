"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  SearchX,
  ExternalLink,
  Package,
  Layers,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  MOCK_ABAYA_PRODUCTS,
  type AttributeItem,
  type VariationCategory,
  type VariationValue,
  type VariationProduct,
} from "./variations.mock";

export default function VariationsPage() {
  const [attributes, setAttributes] = useState<AttributeItem[]>(INITIAL_ATTRIBUTES);
  const [selectedCategory, setSelectedCategory] = useState<VariationCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isLoading, setIsLoading] = useState(false);

  // Tab View Mode: "attributes" or "products-by-variant"
  const [viewMode, setViewMode] = useState<"attributes" | "products-by-variant">("attributes");

  // Selected variant for dedicated "Products with Variant" Modal
  const [selectedVariantForModal, setSelectedVariantForModal] = useState<{
    attrName: string;
    valueName: string;
    colorHex?: string;
    description?: string;
    products: VariationProduct[];
  } | null>(null);

  // State for Explorer Tab (Products by Variant)
  const [explorerSelectedAttrId, setExplorerSelectedAttrId] = useState<string>("attr-size");
  const [explorerSelectedValId, setExplorerSelectedValId] = useState<string>("val-sz-54");
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");

  // Modals state: Add attribute
  const [isAddAttrOpen, setIsAddAttrOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrCategory, setNewAttrCategory] = useState<AttributeItem["category"]>("Abayas");
  const [newAttrType, setNewAttrType] = useState<AttributeItem["type"]>("button");
  const [newAttrDesc, setNewAttrDesc] = useState("");

  // Modals state: Add value
  const [addValueTargetId, setAddValueTargetId] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState("");
  const [newValueColor, setNewValueColor] = useState("#000000");
  const [newValueDesc, setNewValueDesc] = useState("");

  // Modals state: Edit attribute
  const [editingAttr, setEditingAttr] = useState<AttributeItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<AttributeItem["category"]>("Abayas");
  const [editDesc, setEditDesc] = useState("");

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
  const totalCatalogProducts = Object.keys(MOCK_ABAYA_PRODUCTS).length;

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
          const matchDesc = attr.description?.toLowerCase().includes(q);
          const matchValue = attr.values.some((v) =>
            v.name.toLowerCase().includes(q)
          );
          if (!matchName && !matchCategory && !matchValue && !matchDesc) return false;
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

  // Active Explorer Attribute & Value
  const currentExplorerAttr = useMemo(() => {
    return attributes.find((a) => a.id === explorerSelectedAttrId) || attributes[0];
  }, [attributes, explorerSelectedAttrId]);

  const currentExplorerValue = useMemo(() => {
    if (!currentExplorerAttr) return null;
    return (
      currentExplorerAttr.values.find((v) => v.id === explorerSelectedValId) ||
      currentExplorerAttr.values[0] ||
      null
    );
  }, [currentExplorerAttr, explorerSelectedValId]);

  // Products linked to current explorer value
  const explorerProducts = useMemo(() => {
    if (!currentExplorerValue || !currentExplorerValue.products) return [];
    const list = currentExplorerValue.products;
    if (!productSearchQuery.trim()) return list;
    const q = productSearchQuery.toLowerCase().trim();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [currentExplorerValue, productSearchQuery]);

  // Handlers
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Abaya variations synchronized with store catalog");
    }, 400);
  };

  const handleExport = () => {
    try {
      const rows = [
        ["Attribute Name", "Category", "Status", "Product Count", "Values", "Description"],
        ...attributes.map((a) => [
          a.name,
          a.category,
          a.status,
          a.productCount.toString(),
          a.values.map((v) => v.name).join("; "),
          a.description || "",
        ]),
      ];
      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "moodest-abaya-variations.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported variations to CSV");
    } catch {
      toast.error("Failed to export variations");
    }
  };

  const handleToggleStatus = (id: string) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === id) {
          const next = attr.status === "active" ? "hidden" : "active";
          toast.success(`"${attr.name}" marked as ${next}`);
          return { ...attr, status: next };
        }
        return attr;
      })
    );
  };

  const handleDeleteAttribute = (id: string) => {
    const target = attributes.find((a) => a.id === id);
    setAttributes((prev) => prev.filter((a) => a.id !== id));
    toast.success(`Attribute "${target?.name || id}" removed`);
  };

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    const newAttr: AttributeItem = {
      id: `attr-${Date.now()}`,
      name: newAttrName.trim(),
      category: newAttrCategory,
      status: "active",
      productCount: 0,
      type: newAttrType,
      description: newAttrDesc.trim(),
      values: [],
    };

    setAttributes((prev) => [newAttr, ...prev]);
    setNewAttrName("");
    setNewAttrDesc("");
    setIsAddAttrOpen(false);
    toast.success(`Created attribute "${newAttr.name}"`);
  };

  const handleStartEdit = (attr: AttributeItem) => {
    setEditingAttr(attr);
    setEditName(attr.name);
    setEditCategory(attr.category);
    setEditDesc(attr.description || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttr || !editName.trim()) return;

    setAttributes((prev) =>
      prev.map((a) =>
        a.id === editingAttr.id
          ? {
              ...a,
              name: editName.trim(),
              category: editCategory,
              description: editDesc.trim(),
            }
          : a
      )
    );
    toast.success("Attribute updated");
    setEditingAttr(null);
  };

  const handleOpenAddValue = (attrId: string) => {
    setAddValueTargetId(attrId);
    setNewValueName("");
    setNewValueColor("#000000");
    setNewValueDesc("");
  };

  const handleSaveNewValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addValueTargetId || !newValueName.trim()) return;

    const target = attributes.find((a) => a.id === addValueTargetId);
    if (!target) return;

    const exists = target.values.some(
      (v) => v.name.toLowerCase() === newValueName.trim().toLowerCase()
    );
    if (exists) {
      toast.error(`Value "${newValueName.trim()}" already exists in this attribute.`);
      return;
    }

    const newVal: VariationValue = {
      id: `val-${Date.now()}`,
      name: newValueName.trim(),
      description: newValueDesc.trim(),
      colorHex: target.type === "color" ? newValueColor : undefined,
      products: [],
    };

    setAttributes((prev) =>
      prev.map((a) =>
        a.id === addValueTargetId
          ? { ...a, values: [...a.values, newVal] }
          : a
      )
    );

    toast.success(`Added value "${newVal.name}" to ${target.name}`);
    setAddValueTargetId(null);
  };

  const handleClearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
  };

  const targetAttributeForValue = useMemo(() => {
    if (!addValueTargetId) return null;
    return attributes.find((a) => a.id === addValueTargetId) || null;
  }, [attributes, addValueTargetId]);

  // Open modal with products for a specific value
  const handleOpenProductsModal = (attrName: string, val: VariationValue) => {
    setSelectedVariantForModal({
      attrName,
      valueName: val.name,
      colorHex: val.colorHex,
      description: val.description,
      products: val.products || [],
    });
  };

  // Open modal with all products for an attribute
  const handleOpenAttributeProductsModal = (attr: AttributeItem) => {
    const allProdMap = new Map<string, VariationProduct>();
    attr.values.forEach((v) => {
      (v.products || []).forEach((p) => allProdMap.set(p.id, p));
    });
    setSelectedVariantForModal({
      attrName: attr.name,
      valueName: `All ${attr.values.length} Values`,
      description: attr.description,
      products: Array.from(allProdMap.values()),
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Product Variations
            </h1>
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
              Abaya Boutique
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage abaya lengths (50–62), custom flexible sizing, boutique colorways, fabrics, and explore linked products.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("attributes")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                viewMode === "attributes"
                  ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Attributes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("products-by-variant")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                viewMode === "products-by-variant"
                  ? "bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Package className="size-3.5" />
              <span>Products by Variant</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 px-3 rounded-xl border-gray-200/80 dark:border-white/10 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddAttrOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Attribute
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 shadow-2xs">
          <p className="text-xs text-muted-foreground font-medium">Total Attributes</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {totalAttributes}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              {activeCount} Active
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 shadow-2xs">
          <p className="text-xs text-muted-foreground font-medium">Variation Options</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {totalValues}
            </span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Sizes, Colors &amp; Cuts
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 shadow-2xs">
          <p className="text-xs text-muted-foreground font-medium">Linked Products</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {totalCatalogProducts}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              In Active Store
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-4 shadow-2xs">
          <p className="text-xs text-muted-foreground font-medium">Flexible Sizing</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              Enabled
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
              Free &amp; Custom
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: ATTRIBUTES GRID */}
      {viewMode === "attributes" && (
        <div className="space-y-5">
          {/* Category Tabs & Controls */}
          <div className="space-y-3">
            <div className="border-b border-gray-200/80 dark:border-white/10">
              <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer",
                        isSelected
                          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      <span>{cat}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px]",
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
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

            {/* Search, Sort, Refresh controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search sizes, colors, fabrics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs sm:text-sm rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="w-44">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-full rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] text-xs font-medium">
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
                  className="h-9 px-3 rounded-xl border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] text-xs font-medium shrink-0"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Attributes Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 h-[230px] animate-pulse space-y-3"
                >
                  <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/60 rounded-md" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    <div className="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    <div className="h-7 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-12 text-center flex flex-col items-center justify-center">
              <SearchX className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No variation attributes found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                No attributes match &quot;{searchQuery || selectedCategory}&quot;.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={handleClearFilters}
                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAttributes.map((attr) => (
                <div
                  key={attr.id}
                  className="group relative rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 transition-all duration-200 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-xs"
                >
                  {/* Card Top */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                            {attr.name}
                          </h2>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {attr.category}
                          </span>
                        </div>
                        {attr.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {attr.description}
                          </p>
                        )}
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                          {attr.values.length} options · {attr.productCount} products carrying this variant
                        </p>
                      </div>

                      {/* Dropdown Options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem
                            onClick={() => handleOpenAttributeProductsModal(attr)}
                            className="text-xs cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                            View linked products
                          </DropdownMenuItem>
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
                            Add new value
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
                            className="text-xs text-red-600 dark:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Interactive Value Chips — Click to View Products */}
                    <div className="py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values.map((v) => {
                          const isFree = v.name.toLowerCase().includes("free");
                          const isCustom =
                            v.name.toLowerCase().includes("custom") ||
                            v.name.toLowerCase().includes("measure");
                          const prodCount = v.products ? v.products.length : 0;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleOpenProductsModal(attr.name, v)}
                              title={`Click to view ${prodCount} products with ${v.name}`}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer group/chip",
                                isFree
                                  ? "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
                                  : isCustom
                                  ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
                                  : "bg-gray-50 hover:bg-indigo-50 dark:bg-gray-800/60 dark:hover:bg-indigo-950/40 text-gray-800 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-300 border-gray-200/70 dark:border-gray-700/60 hover:border-indigo-200"
                              )}
                            >
                              {v.colorHex && (
                                <span
                                  className="h-3 w-3 rounded-full border border-black/15 dark:border-white/20 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: v.colorHex }}
                                />
                              )}
                              <span>{v.name}</span>
                              {prodCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 font-mono font-semibold">
                                  {prodCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: View Products & Status */}
                  <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenAttributeProductsModal(attr)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <ShoppingBag className="size-3.5" />
                      <span>View Products ({attr.productCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddValue(attr.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Value</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: PRODUCTS BY VARIANT EXPLORER */}
      {viewMode === "products-by-variant" && (
        <div className="space-y-6 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="size-5 text-indigo-600" />
              Products by Variant Explorer
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select any abaya size, colorway, or cut to instantly see all products configured with that variant in real time.
            </p>
          </div>

          {/* 1. Attribute Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {attributes.map((attr) => (
              <button
                key={attr.id}
                type="button"
                onClick={() => {
                  setExplorerSelectedAttrId(attr.id);
                  if (attr.values.length > 0) {
                    setExplorerSelectedValId(attr.values[0].id);
                  }
                }}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer",
                  explorerSelectedAttrId === attr.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100"
                )}
              >
                {attr.name}
              </button>
            ))}
          </div>

          {/* 2. Values Selector Chips */}
          {currentExplorerAttr && (
            <div className="p-4 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Select {currentExplorerAttr.name}:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {currentExplorerAttr.values.length} available options
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentExplorerAttr.values.map((v) => {
                  const isSelected = explorerSelectedValId === v.id;
                  const count = v.products ? v.products.length : 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setExplorerSelectedValId(v.id)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-indigo-400"
                      )}
                    >
                      {v.colorHex && (
                        <span
                          className="size-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{v.name}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Products List Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Products offering &quot;{currentExplorerValue?.name}&quot;</span>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {explorerProducts.length} Product{explorerProducts.length === 1 ? "" : "s"}
                </Badge>
              </h3>
              {currentExplorerValue?.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentExplorerValue.description}
                </p>
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* 4. Products Table */}
          {explorerProducts.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-2xl border-gray-200 dark:border-white/10">
              <Layers className="size-8 mx-auto text-muted-foreground opacity-50 mb-2" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                No products found for this variant
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Add this variant to your products via the product edit page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Variant SKU</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {explorerProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                      {/* Product Name & Thumbnail */}
                      <td className="py-3 px-3 align-middle font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-gray-200/60 dark:border-white/10 flex items-center justify-center shrink-0">
                            <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{p.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">ID: {p.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {p.category}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 align-middle font-mono font-medium text-gray-700 dark:text-gray-300">
                        {p.sku}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                          {p.offerPrice && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold line-through">
                              ₹{p.offerPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            p.stock > 15
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200"
                              : p.stock > 0
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200"
                              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200"
                          )}
                        >
                          {p.stock} in stock
                        </span>
                      </td>

                      {/* Action: Link to Product */}
                      <td className="py-3 px-3 align-middle text-right">
                        <Link
                          href={`/products`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 transition-colors"
                        >
                          <span>Edit Product</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW PRODUCTS WITH VARIANT                                      */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(selectedVariantForModal)}
        onOpenChange={(open) => !open && setSelectedVariantForModal(null)}
      >
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedVariantForModal?.colorHex && (
                <span
                  className="size-4 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: selectedVariantForModal.colorHex }}
                />
              )}
              <DialogTitle className="text-base font-bold">
                Products with &quot;{selectedVariantForModal?.valueName}&quot;
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Attribute: <strong>{selectedVariantForModal?.attrName}</strong>
              {selectedVariantForModal?.description && ` · ${selectedVariantForModal.description}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {(!selectedVariantForModal?.products ||
              selectedVariantForModal.products.length === 0) ? (
              <div className="text-center py-8 border border-dashed rounded-xl border-gray-200 dark:border-white/10">
                <p className="text-xs text-muted-foreground">
                  No products currently configured with this variant value.
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                {selectedVariantForModal.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] hover:border-indigo-400 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-gray-200/60 dark:border-white/10 flex items-center justify-center shrink-0">
                        <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {p.sku} · {p.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                          ₹{p.price.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {p.stock} in stock
                        </p>
                      </div>

                      <Link
                        href={`/products`}
                        onClick={() => setSelectedVariantForModal(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs"
                      >
                        <span>Edit</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedVariantForModal(null)}
              className="text-xs h-9 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD ATTRIBUTE                                                    */}
      {/* ========================================================================= */}
      <Dialog open={isAddAttrOpen} onOpenChange={setIsAddAttrOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Variation Attribute</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new abaya variation attribute (such as Sleeve Cut, Neckline, or Lining).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAttribute} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-attr-name" className="text-xs font-medium">
                Attribute Name
              </Label>
              <Input
                id="new-attr-name"
                placeholder="e.g. Sleeve Cut, Neckline, Hijab Match"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className="h-9 rounded-xl text-xs"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-attr-desc" className="text-xs font-medium">
                Description (Optional)
              </Label>
              <Input
                id="new-attr-desc"
                placeholder="e.g. Flare, Elasticated, or French Lace"
                value={newAttrDesc}
                onChange={(e) => setNewAttrDesc(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-attr-cat" className="text-xs font-medium">
                  Category
                </Label>
                <Select
                  value={newAttrCategory}
                  onValueChange={(val) => setNewAttrCategory(val as AttributeItem["category"])}
                >
                  <SelectTrigger id="new-attr-cat" className="h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Abayas" className="text-xs">Abayas</SelectItem>
                    <SelectItem value="Occasion Wear" className="text-xs">Occasion Wear</SelectItem>
                    <SelectItem value="Fabrics & Silhouettes" className="text-xs">Fabrics &amp; Silhouettes</SelectItem>
                    <SelectItem value="Custom & Tailored" className="text-xs">Custom &amp; Tailored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-attr-type" className="text-xs font-medium">
                  Display Type
                </Label>
                <Select
                  value={newAttrType}
                  onValueChange={(val) => setNewAttrType(val as AttributeItem["type"])}
                >
                  <SelectTrigger id="new-attr-type" className="h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="button" className="text-xs">Button Pill</SelectItem>
                    <SelectItem value="color" className="text-xs">Color Swatch</SelectItem>
                    <SelectItem value="text" className="text-xs">Text Label</SelectItem>
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
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newAttrName.trim()}
                className="rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Create Attribute
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD VALUE TO ATTRIBUTE                                           */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(addValueTargetId)}
        onOpenChange={(open) => !open && setAddValueTargetId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Add Value to {targetAttributeForValue?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new option (e.g. new length, color swatch, or cut).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewValue} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-val-name" className="text-xs font-medium">
                Value Name
              </Label>
              <Input
                id="new-val-name"
                placeholder={
                  targetAttributeForValue?.type === "color"
                    ? "e.g. Royal Emerald, Pearl White"
                    : "e.g. Size 55, Butterfly Cut"
                }
                value={newValueName}
                onChange={(e) => setNewValueName(e.target.value)}
                className="h-9 rounded-xl text-xs"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-val-desc" className="text-xs font-medium">
                Description (Optional)
              </Label>
              <Input
                id="new-val-desc"
                placeholder="e.g. 55 inch length or lustrous finish"
                value={newValueDesc}
                onChange={(e) => setNewValueDesc(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {targetAttributeForValue?.type === "color" && (
              <div className="space-y-1.5">
                <Label htmlFor="color-hex" className="text-xs font-medium">
                  Color Swatch
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="color-hex"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="h-9 w-12 rounded-lg border border-gray-200 dark:border-white/10 p-0.5 bg-transparent cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="h-9 rounded-xl font-mono text-xs flex-1"
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
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newValueName.trim()}
                className="rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Add Value
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT ATTRIBUTE                                                   */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(editingAttr)}
        onOpenChange={(open) => !open && setEditingAttr(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Attribute</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update attribute name, description, and category classification.
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
                className="h-9 rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc" className="text-xs font-medium">
                Description
              </Label>
              <Input
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs font-medium">
                Category
              </Label>
              <Select
                value={editCategory}
                onValueChange={(val) => setEditCategory(val as AttributeItem["category"])}
              >
                <SelectTrigger id="edit-category" className="h-9 w-full rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Abayas" className="text-xs">Abayas</SelectItem>
                  <SelectItem value="Occasion Wear" className="text-xs">Occasion Wear</SelectItem>
                  <SelectItem value="Fabrics & Silhouettes" className="text-xs">Fabrics &amp; Silhouettes</SelectItem>
                  <SelectItem value="Custom & Tailored" className="text-xs">Custom &amp; Tailored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingAttr(null)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!editName.trim()}
                className="rounded-xl h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
