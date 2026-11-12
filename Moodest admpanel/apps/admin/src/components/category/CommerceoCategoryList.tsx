"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";

const makeIcon = (iconName: string) => function CatIcon({ className }: { className?: string }) {
  return <Icon icon={iconName} className={className} />;
};

const Search = makeIcon("lucide:search");
const Plus = makeIcon("lucide:plus");
const MoreVertical = makeIcon("lucide:more-vertical");
const Edit = makeIcon("lucide:pencil");
const Trash2 = makeIcon("lucide:trash-2");
const PieChart = makeIcon("lucide:pie-chart");
const Home = makeIcon("lucide:home");
const ChevronRight = makeIcon("lucide:chevron-right");
const ChevronLeft = makeIcon("lucide:chevron-left");
const Upload = makeIcon("lucide:upload");
const Check = makeIcon("lucide:check");
const Loader2 = makeIcon("lucide:loader-2");
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiFetch, API_URL } from "@/lib/apiFetch";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
export interface MockCategory {
  id: string;
  name: string;
  slug?: string;
  description: string;
  image: string;
  totalProducts: number;
  totalEarnings: string;
  subcategories?: string[];
  status?: "Active" | "Inactive" | "Scheduled";
  createdAt: Date;
  updatedAt: Date;
}


export function CommerceoCategoryList() {
  const [categories, setCategories] = useState<MockCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await apiFetch("/categories");
      if (res.ok) {
        const list = await res.json();
        const items = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : [];
        if (items.length > 0) {
          setCategories(
            items.map((c: any, idx: number) => {
              const subNames = Array.isArray(c.children)
                ? c.children.map((sub: any) => sub.name)
                : Array.isArray(c.subcategories)
                ? c.subcategories.map((sub: any) => sub.name)
                : undefined;
              return {
                id: String(c.id),
                name: c.name,
                slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
                description: c.description || (c.parentId ? `Subcategory of #${c.parentId}` : "Modest collection category"),
                image: c.image || "",
                totalEarnings: c.totalEarnings || "₹0.00",
                totalProducts: c.totalProducts || c.productCount || 0,
                subcategories: subNames,
                status: "Active" as const,
                createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
                updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
              };
            })
          );
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.warn("[CommerceoCategoryList] Could not load categories from API:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer / Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MockCategory | null>(null);

  // Delete state
  const [deletingCategory, setDeletingCategory] = useState<MockCategory | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Form fields for Add / Edit
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formImage, setFormImage] = useState<string>("");
  const [formFileName, setFormFileName] = useState("");
  const [formParent, setFormParent] = useState("none");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive" | "Scheduled">("Active");
  const [formDescription, setFormDescription] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormTitle("");
    setFormSlug("");
    setFormImage("");
    setFormFileName("");
    setFormParent("none");
    setFormStatus("Active");
    setFormDescription("");
    setIsUploadingImage(false);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (cat: MockCategory) => {
    setEditingCategory(cat);
    setFormTitle(cat.name);
    setFormSlug(cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"));
    setFormImage(cat.image || "");
    setFormFileName("");
    setFormParent("none");
    setFormStatus(cat.status || "Active");
    setFormDescription(cat.description || "");
    setIsUploadingImage(false);
    setIsSheetOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingCategory) {
      setFormSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFileName(file.name);
      try {
        setIsUploadingImage(true);
        toast.loading("Uploading category image to Cloudinary CDN...", { id: "cat-upload" });
        const cdnUrl = await uploadToCloudinary(file, "moodest/categories");
        setFormImage(cdnUrl);
        toast.success("Image uploaded to Cloudinary CDN successfully!", { id: "cat-upload" });
      } catch (err: any) {
        console.error("Cloudinary upload error:", err);
        toast.error(err.message || "Failed to upload to Cloudinary", { id: "cat-upload" });
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setFormImage(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a category title");
      return;
    }

    let finalImageUrl = formImage.trim();

    // If still in base64 format, ensure uploaded to Cloudinary before saving
    if (finalImageUrl.startsWith("data:")) {
      try {
        toast.loading("Syncing image to Cloudinary...", { id: "cat-save" });
        finalImageUrl = await uploadToCloudinary(finalImageUrl, "moodest/categories");
      } catch (e) {
        console.warn("Base64 upload to Cloudinary failed:", e);
      }
    }

    const payload: Record<string, any> = {
      name: formTitle.trim(),
      slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: formDescription.trim(),
      image: finalImageUrl,
    };

    if (formParent !== "none" && formParent) {
      payload.parentId = formParent;
      payload.categoryId = formParent;
    }

    try {
      if (editingCategory) {
        const res = await apiFetch(`/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success(`Category "${formTitle}" updated successfully`, { id: "cat-save" });
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || "Failed to update category", { id: "cat-save" });
        }
      } else {
        const res = await apiFetch(`/categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success(`Category "${formTitle}" created successfully`, { id: "cat-save" });
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || "Failed to create category", { id: "cat-save" });
        }
      }
    } catch {
      toast.error("Network error saving category", { id: "cat-save" });
    }

    await fetchCategories();
    setIsSheetOpen(false);
  };

  const formatEarnings = (val: string | number | undefined) => {
    if (!val) return "$0.00";
    if (typeof val === "string") {
      return val.startsWith("$") ? val : `$${val}`;
    }
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      if (deletingCategory.image && deletingCategory.image.includes("cloudinary.com")) {
        deleteFromCloudinary(deletingCategory.image);
      }
      const res = await apiFetch(`/categories/${deletingCategory.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Category "${deletingCategory.name}" and cloud assets deleted`);
      } else {
        toast.error("Failed to delete category");
      }
    } catch {
      toast.error("Network error deleting category");
    }
    await fetchCategories();
    setSelectedIds((prev) => prev.filter((id) => id !== deletingCategory.id));
    setDeletingCategory(null);
  };

  const handleBulkDeleteConfirm = () => {
    setCategories((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    toast.success(`${selectedIds.length} categories deleted`);
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };

  // Filter & Search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        (cat.slug && cat.slug.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, safeCurrentPage, pageSize]);

  const startEntry = filteredCategories.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, filteredCategories.length);

  // Selection
  const isAllSelected =
    paginatedCategories.length > 0 &&
    paginatedCategories.every((cat) => selectedIds.includes(cat.id));
  const isSomeSelected =
    paginatedCategories.some((cat) => selectedIds.includes(cat.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = new Set(paginatedCategories.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedCategories.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-1 flex-col space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link
          href="/"
          className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          title="Home"
        >
          <Home className="size-3.5" />
        </Link>
        <span>/</span>
        <Link
          href="/products/list"
          className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Category List</span>
      </nav>

      {/* Page Title & Subtitle */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Category List
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Manage product categories, catalog hierarchy, earnings, and inventory.
        </p>
      </div>

      {/* Main Card with Search Toolbar, Table & Pagination */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-sm shadow-2xs focus-visible:ring-indigo-500"
              />
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 animate-in fade-in">
                <span>{selectedIds.length} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10 w-20 bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleOpenAdd}
              className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="size-4" />
              <span>Add Category</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200/70 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] h-12 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                <th className="w-12 px-4 sm:px-6 align-middle">
                  <Checkbox
                    checked={Boolean(isAllSelected || isSomeSelected)}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[280px]">
                  Categories
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[140px]">
                  Total Products
                </th>
                <th className="px-4 py-3 align-middle font-semibold min-w-[140px]">
                  Total Earnings
                </th>
                <th className="px-4 sm:px-6 py-3 align-middle font-semibold text-right w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skel-cat-${i}`} className="animate-pulse h-16">
                    <td className="px-4 sm:px-6 align-middle"><div className="size-4 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3 align-middle"><div className="h-10 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" /></td>
                    <td className="px-4 py-3 align-middle"><div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 py-3 align-middle"><div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" /></td>
                    <td className="px-4 sm:px-6 py-3 align-middle text-right"><div className="h-8 w-8 ml-auto bg-gray-200 dark:bg-white/10 rounded" /></td>
                  </tr>
                ))
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No categories found matching &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors h-16 ${
                        isSelected ? "bg-indigo-50/30 dark:bg-indigo-500/[0.05]" : ""
                      }`}
                    >
                      <td className="px-4 sm:px-6 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(cat.id)}
                          aria-label={`Select ${cat.name}`}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative">
                            {cat.image ? (
                              <img
                                src={
                                  cat.image.startsWith("http") || cat.image.startsWith("data:")
                                    ? cat.image
                                    : `https://modest-eta.vercel.app${cat.image.startsWith("/") ? "" : "/"}${cat.image}`
                                }
                                alt={cat.name}
                                className="size-full object-cover aspect-square"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector(".fallback-initials")) {
                                    const span = document.createElement("span");
                                    span.className = "fallback-initials text-xs font-semibold text-muted-foreground";
                                    span.innerText = cat.name.slice(0, 2).toUpperCase();
                                    parent.appendChild(span);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {cat.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                              {cat.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs sm:max-w-md truncate mt-0.5">
                              {cat.description}
                            </p>
                            {cat.subcategories && cat.subcategories.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                {cat.subcategories.map((sub) => (
                                  <span
                                    key={sub}
                                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40"
                                  >
                                    ↳ {sub}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cat.totalProducts.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatEarnings(cat.totalEarnings)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg"
                              aria-label="Row actions"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-md border-gray-200/80 dark:border-white/10">
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(cat)}
                              className="cursor-pointer gap-2"
                            >
                              <Edit className="size-4 text-indigo-600 dark:text-indigo-400" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingCategory(cat)}
                              className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                            >
                              <Trash2 className="size-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-50/30 dark:bg-white/[0.01]">
          <div>
            Showing <span className="font-medium text-gray-900 dark:text-white">{startEntry}</span> to{" "}
            <span className="font-medium text-gray-900 dark:text-white">{endEntry}</span> of{" "}
            <span className="font-medium text-gray-900 dark:text-white">{filteredCategories.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-8 rounded-lg p-0 border-gray-200 dark:border-white/10"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === safeCurrentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`size-8 rounded-lg text-xs font-semibold p-0 ${
                    isActive
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-xs"
                      : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-8 rounded-lg p-0 border-gray-200 dark:border-white/10"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-Over Drawer Sheet for Add / Edit Category */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-white dark:bg-[#141414] border-l border-gray-200 dark:border-white/10"
        >
          {/* Drawer Header */}
          <SheetHeader className="p-5 border-b border-gray-200/80 dark:border-white/10 pr-12">
            <div>
              <SheetTitle className="text-base font-bold text-gray-900 dark:text-white">
                {editingCategory ? "Edit Category" : "Add Category"}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {editingCategory
                  ? "Update category details and catalog properties"
                  : "Create a new product category in your catalog"}
              </SheetDescription>
            </div>
          </SheetHeader>

          {/* Form Body */}
          <form
            id="category-form"
            onSubmit={handleSaveCategory}
            className="flex-1 overflow-y-auto p-5 space-y-4"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Title
              </label>
              <Input
                placeholder="Enter category title"
                value={formTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Slug
              </label>
              <Input
                placeholder="Enter slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Attachment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Attachment / Category Image
                </label>
                <span className="text-[10px] text-muted-foreground font-medium">2:3 Portrait Recommended</span>
              </div>

              {/* Suitable Size Guide */}
              <div className="rounded-lg border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-indigo-950 dark:text-indigo-200 text-xs mb-1">
                  📐 Suitable Size to Fill (Contain Mode)
                </p>
                <p>
                  Storefront category cards use <strong>2:3 portrait ratio</strong> with <strong>object-contain</strong>.
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                    ★ 600 × 900 px (2:3)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-[10px]">
                    800 × 1200 px
                  </span>
                </div>
              </div>

              <div className="relative flex items-center rounded-xl border border-gray-200 dark:border-white/10 shadow-2xs overflow-hidden h-10 bg-white dark:bg-[#181818]">
                <label className="bg-gray-100 dark:bg-white/5 px-3.5 py-2 text-xs font-medium border-r border-gray-200 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10 cursor-pointer h-full flex items-center shrink-0 transition-colors">
                  <Upload className="size-3.5 mr-1.5 text-gray-600 dark:text-gray-300" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
                <span className="px-3 text-xs text-muted-foreground truncate flex-1">
                  {formFileName || "No file chosen"}
                </span>
              </div>

              {isUploadingImage && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 py-1 font-medium animate-pulse">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Uploading to Cloudinary CDN...</span>
                </div>
              )}

              {formImage && (
                <div className="flex items-center gap-2 pt-1.5">
                  <div className="relative size-12 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-neutral-900 flex-shrink-0">
                    <img
                      src={
                        formImage.startsWith("http") || formImage.startsWith("data:")
                          ? formImage
                          : `https://modest-eta.vercel.app${formImage.startsWith("/") ? "" : "/"}${formImage}`
                      }
                      alt="Preview"
                      className="size-full object-contain object-center"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="size-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Or enter Image URL"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="h-8 rounded-lg text-xs bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10"
                    />
                    {formImage.includes("cloudinary.com") && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                        ✓ Hosted on Cloudinary CDN
                      </span>
                    )}
                  </div>
                </div>
              )}


            </div>

            {/* Parent Category (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Parent Category <span className="text-gray-400 font-normal lowercase">(Optional)</span>
                </label>
                {formParent !== "none" && (
                  <button
                    type="button"
                    onClick={() => setFormParent("none")}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                  >
                    Clear (Make Top-Level)
                  </button>
                )}
              </div>
              <Select value={formParent} onValueChange={setFormParent}>
                <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10">
                  <SelectValue placeholder="None (Independent Top-Level Category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    None (Independent Top-Level Category)
                  </SelectItem>
                  {categories
                    .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Optional: Choose a parent to create a sub-category under it, or keep &quot;None&quot; for an independent top-level category.
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as "Active" | "Inactive" | "Scheduled")}
              >
                <SelectTrigger className="w-full h-10 rounded-xl text-sm bg-white dark:bg-[#181818] border-gray-200 dark:border-white/10">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Write text..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#181818] px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 resize-y"
              />
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-gray-200/80 dark:border-white/10 flex items-center gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
            <Button
              type="submit"
              form="category-form"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-10 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              {editingCategory ? "Update Category" : "Add Category"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSheetOpen(false)}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60 px-5 h-10 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Discard
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Single Delete Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete category &quot;{deletingCategory?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert Dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-gray-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} categories? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl"
            >
              Delete All Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
