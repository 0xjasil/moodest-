"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowUp, ArrowDown, MoreVertical, ImageIcon,
  ChevronLeft, ChevronRight, Link as LinkIcon, Eye, EyeOff,
} from "lucide-react";
import { API_URL } from "@/lib/api-client";

const PAGE_SIZE = 6;
const MIN_ACTIVE = 2;
const MAX_ACTIVE = 5;

type Banner = {
  id: string;
  title: string;
  image: string;
  tag?: string | null;
  offerPrice?: string | null;
  description?: string | null;
  badge?: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  order: number;
  isActive: boolean;
};

const validateImageSize = (file: File): boolean => {
  if (file.size > 8 * 1024 * 1024) {
    toast.error("Image must be under 8 MB");
    return false;
  }
  return true;
};

// ─── Delete Dialog ──────────────────────────────────────────────────────────
function DeleteBannerDialog({ open, setOpen, banner, onDeleted }: {
  open: boolean; setOpen: (v: boolean) => void; banner: Banner; onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/banners/${banner.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Banner deleted");
      onDeleted();
    } catch { toast.error("Failed to delete banner"); }
    finally { setLoading(false); setOpen(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Banner</AlertDialogTitle>
          <AlertDialogDescription>
            Permanently delete <strong>&ldquo;{banner.title || "this banner"}&rdquo;</strong>? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Toggle Dialog ──────────────────────────────────────────────────────────
function ToggleActiveDialog({ open, setOpen, banner, activeCount, onToggled }: {
  open: boolean; setOpen: (v: boolean) => void;
  banner: Banner; activeCount: number; onToggled: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const nextState = !banner.isActive;
  const isBlockedActivate = nextState && activeCount >= MAX_ACTIVE;
  const isBlockedHide = !nextState && activeCount <= MIN_ACTIVE;

  const handleToggle = async () => {
    if (isBlockedActivate) {
      toast.error(`Maximum ${MAX_ACTIVE} banners can be active. Hide one first.`);
      setOpen(false); return;
    }
    if (isBlockedHide) {
      toast.error(`At least ${MIN_ACTIVE} banners must remain active.`);
      setOpen(false); return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("isActive", String(nextState));
      const res = await fetch(`${API_URL}/banners/${banner.id}`, { method: "PATCH", body: formData });
      if (!res.ok) throw new Error();
      toast.success(`Banner ${nextState ? "activated" : "hidden"}`);
      onToggled();
    } catch { toast.error("Failed to update banner"); }
    finally { setLoading(false); setOpen(false); }
  };

  const isBlocked = isBlockedActivate || isBlockedHide;
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{nextState ? "Activate Banner" : "Hide Banner"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isBlockedActivate
              ? `You already have ${MAX_ACTIVE} active banners. Hide one before activating another.`
              : isBlockedHide
                ? `You need at least ${MIN_ACTIVE} active banners. Add or activate another before hiding this one.`
                : nextState
                  ? (banner.title ? `Make "${banner.title}" visible on the homepage?` : "Make this banner visible on the homepage?")
                  : (banner.title ? `Hide "${banner.title}" from the homepage?` : "Hide this banner from the homepage?")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!isBlocked && (
            <AlertDialogAction asChild>
              <Button variant={nextState ? "default" : "outline"} disabled={loading} onClick={handleToggle}>
                {loading ? "Updating..." : nextState ? "Activate" : "Hide"}
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Edit Dialog ─────────────────────────────────────────────────────────────
function EditBannerDialog({ open, setOpen, banner, onUpdated }: {
  open: boolean; setOpen: (v: boolean) => void; banner: Banner; onUpdated: () => void;
}) {
  const [title, setTitle] = useState(banner.title || "");
  const [tag, setTag] = useState(banner.tag || "");
  const [offerPrice, setOfferPrice] = useState(banner.offerPrice || "");
  const [description, setDescription] = useState(banner.description || "");
  const [buttonText, setButtonText] = useState(banner.buttonText || "");
  const [buttonLink, setButtonLink] = useState(banner.buttonLink || "");
  const [preview, setPreview] = useState<string>(banner.image);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !validateImageSize(f)) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("tag", tag.trim());
      formData.append("offerPrice", offerPrice.trim());
      formData.append("description", description.trim());
      formData.append("buttonText", buttonText.trim());
      formData.append("buttonLink", buttonLink.trim());
      if (file) formData.append("image", file);
      const res = await fetch(`${API_URL}/banners/${banner.id}`, { method: "PATCH", body: formData });
      if (!res.ok) throw new Error();
      toast.success("Banner updated");
      onUpdated(); setOpen(false);
    } catch { toast.error("Failed to update banner"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update hero banner details, CTA button, and image settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Image Upload */}
          <div className="space-y-1.5">
            <Label>Banner Image <span className="text-destructive">*</span></Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-xl cursor-pointer overflow-hidden hover:border-primary transition-colors bg-slate-900/40"
              style={{ height: 160 }}
            >
              <Image src={preview} alt="Preview" fill unoptimized className="object-contain" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-1">
                <ImageIcon className="w-6 h-6 text-white" />
                <span className="text-white text-xs font-medium">Click to change image</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">Title (Optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Signature Tailoring & Outerwear" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category Tag (Optional)</Label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. AUTUMN / WINTER COLLECTION" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Offer Price / Subtitle (Optional)</Label>
              <Input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="e.g. Starting from ₹4,299* or Up to 40% OFF" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Description (Optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Precision-tailored wool overshirts, blazers..." />
          </div>

          {/* Optional Button */}
          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground">CTA Button <span className="font-normal">(optional)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Button Text</Label>
                <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g. Shop Collection" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Button Link</Label>
                <Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="e.g. /product" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────
function BannerActions({ banner, activeCount, onRefresh }: {
  banner: Banner; activeCount: number; onRefresh: () => void;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openToggle, setOpenToggle] = useState(false);
  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>Edit Banner</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenToggle(true)}>
            {banner.isActive ? "Hide Banner" : "Activate Banner"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setOpenDelete(true)}>
            Delete Banner
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openEdit && (
        <EditBannerDialog open={openEdit} setOpen={setOpenEdit} banner={banner}
          onUpdated={() => { setOpenEdit(false); onRefresh(); }} />
      )}
      <ToggleActiveDialog open={openToggle} setOpen={setOpenToggle} banner={banner}
        activeCount={activeCount} onToggled={() => { setOpenToggle(false); onRefresh(); }} />
      <DeleteBannerDialog open={openDelete} setOpen={setOpenDelete} banner={banner}
        onDeleted={() => { setOpenDelete(false); onRefresh(); }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(banners.length / PAGE_SIZE);
  const paginatedBanners = banners.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = banners.filter((b) => b.isActive).length;

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/banners?all=true`).catch(() =>
        fetch(`${API_URL}/banners?all=true`)
      );
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data || json.banners || [];
        setBanners(data);
      }
    } catch (e) {
      console.warn("Failed to load CMS banners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [banners.length, totalPages, currentPage]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !validateImageSize(f)) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!file) { toast.error("Please select a banner image"); return; }
    if (activeCount >= MAX_ACTIVE) {
      toast.error(`Maximum ${MAX_ACTIVE} banners active. Hide one first.`); return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("tag", tag.trim());
      formData.append("offerPrice", offerPrice.trim());
      formData.append("description", description.trim());
      formData.append("buttonText", buttonText.trim());
      formData.append("buttonLink", buttonLink.trim());
      formData.append("image", file);
      const res = await fetch(`${API_URL}/banners`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success("Banner added successfully");
      setTitle(""); setTag(""); setOfferPrice(""); setDescription(""); setButtonText(""); setButtonLink("");
      setFile(null); setPreview(null);
      fetchBanners();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add banner");
    } finally { setUploading(false); }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = banners.findIndex((b) => b.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === banners.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    try {
      const fd1 = new FormData(); fd1.append("order", String(banners[swapIdx].order));
      const fd2 = new FormData(); fd2.append("order", String(banners[idx].order));
      await Promise.all([
        fetch(`${API_URL}/banners/${banners[idx].id}`, { method: "PATCH", body: fd1 }),
        fetch(`${API_URL}/banners/${banners[swapIdx].id}`, { method: "PATCH", body: fd2 }),
      ]);
      fetchBanners();
    } catch { toast.error("Failed to reorder"); }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hero Banners</h1>
              <p className="text-muted-foreground text-sm">
                Manage homepage hero slides. Min {MIN_ACTIVE}, Max {MAX_ACTIVE} active at a time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground">Active:</span>
              <span className={`font-bold tabular-nums ${activeCount >= MAX_ACTIVE ? "text-destructive" : activeCount < MIN_ACTIVE ? "text-amber-600" : "text-green-600"}`}>
                {activeCount} / {MAX_ACTIVE}
              </span>
            </div>
          </div>

          {/* Min warning */}
          {activeCount < MIN_ACTIVE && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium">
              ⚠ At least {MIN_ACTIVE} banners must be active. Please activate more banners.
            </div>
          )}

          {/* Add Banner */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Banner</CardTitle>
              <CardDescription>
                Upload an image banner. All text fields and CTA button are optional.
                {activeCount >= MAX_ACTIVE && (
                  <span className="ml-2 text-destructive font-medium">— Active limit reached ({MAX_ACTIVE}). Hide one first.</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Banner Image <span className="text-destructive">*</span></Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted/20"
                  style={{ height: 200 }}
                >
                  {preview ? (
                    <div className="relative w-full h-full">
                      <Image src={preview} alt="Preview" fill unoptimized className="object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-2">
                        <ImageIcon className="w-6 h-6 text-white" />
                        <span className="text-white text-xs font-semibold">Click to change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                      <ImageIcon className="w-10 h-10" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Click to upload banner image</p>
                        <p className="text-xs">Recommended: 1920×800px or wider. Max 8 MB.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs">Title (Optional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Signature Tailoring & Outerwear"
                  className="max-w-lg"
                />
              </div>

              {/* Tag & Offer Price / Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category Tag (Optional)</Label>
                  <Input
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="e.g. AUTUMN / WINTER COLLECTION"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Offer Price / Subtitle (Optional)</Label>
                  <Input
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. Starting from ₹4,299* or Up to 40% OFF"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 max-w-lg">
                <Label className="text-xs">Description (Optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Precision-tailored wool overshirts, blazers..."
                />
              </div>

              {/* Optional CTA */}
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  CTA Button <span className="text-muted-foreground font-normal">(optional)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Text</Label>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="e.g. EXPLORE NOW"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Link</Label>
                    <Input
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                      placeholder="e.g. /products or https://..."
                    />
                  </div>
                </div>
                {buttonText && !buttonLink && (
                  <p className="text-xs text-amber-600">⚠ Button text is set but link is empty. Please add a link.</p>
                )}
              </div>

              <Button
                onClick={handleAdd}
                disabled={uploading || !file || activeCount >= MAX_ACTIVE}
                className="min-w-[140px]"
              >
                {uploading ? "Uploading..." : "Add Banner"}
              </Button>
            </CardContent>
          </Card>

          {/* Banners List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Banners</CardTitle>
                  <CardDescription className="mt-1">
                    {banners.length} banner{banners.length !== 1 ? "s" : ""} total
                    {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                  </CardDescription>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button key={page} variant={currentPage === page ? "default" : "outline"}
                        size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                        {page}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" className="h-8 w-8"
                      disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center py-14 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No banners yet</p>
                  <p className="text-sm">Add your first hero banner above.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedBanners.map((banner, pageIdx) => {
                      const globalIdx = (currentPage - 1) * PAGE_SIZE + pageIdx;
                      return (
                        <div key={banner.id} className="flex items-center gap-4 border border-border rounded-xl p-3 bg-card hover:bg-muted/30 transition-colors">
                          {/* Thumbnail */}
                          <div className="relative rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border" style={{ width: 120, height: 64 }}>
                            <Image src={banner.image} alt={banner.title || "Banner"} fill unoptimized className="object-cover" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold truncate">
                              {banner.title || <span className="text-muted-foreground italic font-normal">Image Only Banner</span>}
                            </p>
                            {banner.buttonText ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <LinkIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{banner.buttonText} → {banner.buttonLink || "no link"}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No CTA button</p>
                            )}
                            <p className="text-xs text-muted-foreground">Slide #{globalIdx + 1}</p>
                          </div>

                          {/* Status badge */}
                          <Badge
                            variant={banner.isActive ? "default" : "secondary"}
                            className="flex items-center gap-1 shrink-0"
                          >
                            {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {banner.isActive ? "Active" : "Hidden"}
                          </Badge>

                          {/* Reorder */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              disabled={globalIdx === 0} onClick={() => handleReorder(banner.id, "up")}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              disabled={globalIdx === banners.length - 1} onClick={() => handleReorder(banner.id, "down")}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>

                          <BannerActions banner={banner} activeCount={activeCount} onRefresh={fetchBanners} />
                        </div>
                      );
                    })}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, banners.length)} of {banners.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"}
                            size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                            {page}
                          </Button>
                        ))}
                        <Button variant="outline" size="icon" className="h-8 w-8"
                          disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
