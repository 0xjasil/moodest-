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
  ChevronLeft, ChevronRight, Link as LinkIcon, Eye, EyeOff, Globe,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

const PAGE_SIZE = 6;
const MIN_ACTIVE = 1;
const MAX_ACTIVE = 8;

export type Banner = {
  id: string;
  title: string;
  image: string;
  alt?: string | null;
  tag?: string | null;
  offerPrice?: string | null;
  description?: string | null;
  badge?: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  order: number;
  isActive: boolean;
};

function resolveBannerUrl(url?: string | null): string {
  if (!url) return "https://modest-eta.vercel.app/banners/top-promo-banner.jpg";
  if (url.startsWith("/")) {
    return `https://modest-eta.vercel.app${url}`;
  }
  return url;
}

const validateImageSize = (file: File): boolean => {
  if (file.size > 10 * 1024 * 1024) {
    toast.error("Image must be under 10 MB");
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
      // Delete image asset from Cloudinary CDN to prevent orphaned storage
      if (banner.image && banner.image.includes("cloudinary.com")) {
        await deleteFromCloudinary(banner.image);
      }
      const res = await apiFetch(`/banners/${banner.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Banner and Cloudinary image deleted");
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
            Permanently delete <strong>&ldquo;{banner.title || "this banner"}&rdquo;</strong> and remove its image from Cloudinary CDN? This cannot be undone.
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
      toast.error(`At least ${MIN_ACTIVE} banner must remain active.`);
      setOpen(false); return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/banners/${banner.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextState }),
      });
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
                ? `You need at least ${MIN_ACTIVE} active banner. Add or activate another before hiding this one.`
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
  const [alt, setAlt] = useState(banner.alt || banner.title || "");
  const [tag, setTag] = useState(banner.tag || "");
  const [offerPrice, setOfferPrice] = useState(banner.offerPrice || "");
  const [description, setDescription] = useState(banner.description || "");
  const [buttonText, setButtonText] = useState(banner.buttonText || "");
  const [buttonLink, setButtonLink] = useState(banner.buttonLink || "");
  const [preview, setPreview] = useState<string>(resolveBannerUrl(banner.image));
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
      let finalImageUrl = banner.image;
      if (file) {
        toast.info("Uploading new image to Cloudinary CDN...");
        const newImageUrl = await uploadToCloudinary(file, "moodest/banners");
        // Remove previous Cloudinary image to keep cloud storage clean
        if (banner.image && banner.image.includes("cloudinary.com")) {
          deleteFromCloudinary(banner.image);
        }
        finalImageUrl = newImageUrl;
      }
      const derivedAlt = alt.trim() || title.trim() || tag.trim() || "Modest Studio Luxury Abaya Hero Banner";
      const res = await apiFetch(`/banners/${banner.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          alt: derivedAlt,
          tag: tag.trim(),
          offerPrice: offerPrice.trim(),
          description: description.trim(),
          buttonText: buttonText.trim(),
          buttonLink: buttonLink.trim(),
          image: finalImageUrl,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Banner updated");
      onUpdated(); setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update hero banner image, SEO alt text, CTA button, and typography.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Image Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Banner Image <span className="text-destructive">*</span></Label>
              <span className="text-[10px] text-muted-foreground">Optimal: 1920×800 px (2.4:1)</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed border-border rounded-xl cursor-pointer overflow-hidden hover:border-primary transition-colors bg-neutral-950"
              style={{ height: 170 }}
            >
              <Image src={preview} alt={alt || "Banner Preview"} fill unoptimized className="object-contain object-center" />
              <div className="absolute top-2 right-2 z-10">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-xs">
                  object-contain
                </span>
              </div>
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-1 z-20">
                <ImageIcon className="w-6 h-6 text-white" />
                <span className="text-white text-xs font-medium">Click to change image (Cloudinary CDN)</span>
              </div>
            </div>
          </div>

          {/* SEO Alt Text Option */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <Label className="text-xs font-medium">Image Alt Text (SEO & Accessibility)</Label>
            </div>
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="e.g. Luxury Handwork Abaya Editorial Hero Banner - Modest Studio"
            />
            <p className="text-[11px] text-muted-foreground">
              Descriptive text read by Google Image search, social crawlers, and screen readers.
            </p>
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
                <Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="e.g. /category/all" />
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
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>Edit Banner & SEO Alt</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenToggle(true)}>
            {banner.isActive ? "Hide Banner" : "Activate Banner"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setOpenDelete(true)}>
            Delete Banner (Remove from Cloud)
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
  const [alt, setAlt] = useState("");
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
      const res = await apiFetch("/banners?all=true");
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
    if (!file && !preview) { toast.error("Please select a banner image"); return; }
    if (activeCount >= MAX_ACTIVE) {
      toast.error(`Maximum ${MAX_ACTIVE} banners active. Hide one first.`); return;
    }
    setUploading(true);
    try {
      let uploadedUrl = preview || "";
      if (file) {
        toast.info("Uploading image to Cloudinary CDN...");
        uploadedUrl = await uploadToCloudinary(file, "moodest/banners");
      }
      const derivedAlt = alt.trim() || title.trim() || tag.trim() || "Modest Studio Luxury Abaya Hero Banner";
      const res = await apiFetch("/banners", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          alt: derivedAlt,
          tag: tag.trim(),
          offerPrice: offerPrice.trim(),
          description: description.trim(),
          buttonText: buttonText.trim(),
          buttonLink: buttonLink.trim(),
          image: uploadedUrl,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to add banner");
      }
      toast.success("Banner added successfully");
      setTitle(""); setAlt(""); setTag(""); setOfferPrice(""); setDescription(""); setButtonText(""); setButtonLink("");
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
    const reordered = [...banners];
    const temp = reordered[idx];
    reordered[idx] = reordered[swapIdx];
    reordered[swapIdx] = temp;
    setBanners(reordered);

    try {
      const bannerIds = reordered.map((b) => b.id);
      await apiFetch("/banners/reorder", {
        method: "PATCH",
        body: JSON.stringify({ bannerIds }),
      });
      fetchBanners();
    } catch {
      toast.error("Failed to reorder");
      fetchBanners();
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="container flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hero Banners (CMS)</h1>
              <p className="text-muted-foreground text-sm">
                Manage storefront hero slider banners. Active banners appear automatically on the homepage with full SEO alt optimization.
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
              ⚠ At least {MIN_ACTIVE} banner should be active for the homepage hero carousel.
            </div>
          )}

          {/* Add Banner */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Hero Banner</CardTitle>
              <CardDescription>
                Upload an image banner. Uploaded images are stored on Cloudinary CDN and will be automatically cleaned up from Cloudinary if deleted.
                {activeCount >= MAX_ACTIVE && (
                  <span className="ml-2 text-destructive font-medium">— Active limit reached ({MAX_ACTIVE}). Hide one first.</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Image Upload */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label>Banner Image <span className="text-destructive">*</span></Label>
                  <span className="text-[11px] text-muted-foreground font-medium">Max 10 MB · WebP, PNG, JPG</span>
                </div>

                {/* Recommended Dimensions Guide */}
                <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <span>📐</span> Suitable Image Size to Fill (Contain Mode)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white dark:bg-black/40 text-indigo-600 dark:text-indigo-300 border-indigo-200">
                      object-contain
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    The storefront renders hero slides in <strong>object-contain</strong> so your abaya designs are never cropped. Upload in the following sizes for optimal screen fill:
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      ★ 1920 × 800 px (2.4:1 Recommended)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10">
                      1920 × 1080 px (16:9)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10">
                      2560 × 1080 px (21:9)
                    </span>
                  </div>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors overflow-hidden bg-neutral-950"
                  style={{ height: 220 }}
                >
                  {preview ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={resolveBannerUrl(preview)}
                        alt={alt || "Banner Preview"}
                        fill
                        unoptimized
                        className="object-contain object-center"
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-xs">
                          Preview: object-contain
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-2 z-20">
                        <ImageIcon className="w-6 h-6 text-white" />
                        <span className="text-white text-xs font-semibold">Click to change banner image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-4">
                      <ImageIcon className="w-10 h-10 text-neutral-500" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-neutral-200">Click to upload hero banner</p>
                        <p className="text-xs text-neutral-400 mt-1">Recommended size: 1920 × 800 px (2.4:1) or 1920 × 1080 px (16:9)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO Alt Text Option */}
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-xs font-medium">Image Alt Text (SEO & Accessibility)</Label>
                </div>
                <Input
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="e.g. Luxury Handwork Abaya Editorial Hero Banner - Modest Studio"
                />
                <p className="text-[11px] text-muted-foreground">
                  Descriptive alt text indexed by search engines for Google Image rankings.
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs">Title (Optional)</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Arrivals Worth The Wait — Luxury Abayas"
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
                    placeholder="e.g. ATELIER 2026 | ALL SIZES 50-62"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Offer Price / Subtitle (Optional)</Label>
                  <Input
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. Free Worldwide Shipping on ₹1,999+"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 max-w-lg">
                <Label className="text-xs">Description (Optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Handcrafted luxury abayas tailored for every occasion..."
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
                      placeholder="e.g. Shop Collection"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Link</Label>
                    <Input
                      value={buttonLink}
                      onChange={(e) => setButtonLink(e.target.value)}
                      placeholder="e.g. /category/all or /category/the-classics"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAdd}
                disabled={uploading || (!file && !preview) || activeCount >= MAX_ACTIVE}
                className="min-w-[140px]"
              >
                {uploading ? "Uploading to Cloudinary..." : "Add Banner"}
              </Button>
            </CardContent>
          </Card>

          {/* Banners List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Hero Banners</CardTitle>
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
                      const bannerAlt = banner.alt || banner.title || "Modest Studio Luxury Abaya Hero Banner";
                      return (
                        <div key={banner.id} className="flex items-center gap-4 border border-border rounded-xl p-3 bg-card hover:bg-muted/30 transition-colors">
                          {/* Thumbnail */}
                          <div className="relative rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border" style={{ width: 120, height: 64 }}>
                            <Image src={resolveBannerUrl(banner.image)} alt={bannerAlt} fill unoptimized className="object-cover" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold truncate">
                              {banner.title || <span className="text-muted-foreground italic font-normal">Image Only Banner</span>}
                            </p>
                            {/* SEO Alt Display */}
                            <div className="flex items-center gap-1.5 text-xs text-primary/80 truncate">
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">Alt: <em>{bannerAlt}</em></span>
                            </div>
                            {banner.buttonText ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <LinkIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{banner.buttonText} → {banner.buttonLink || "/category/all"}</span>
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
