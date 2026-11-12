"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

const makeIcon = (iconName: string) => function GalleryIcon({ className }: { className?: string }) {
  return <Icon icon={iconName} className={className} />;
};

const UploadCloud = makeIcon("lucide:upload-cloud");
const CheckCircle2 = makeIcon("lucide:check-circle-2");
const RefreshCw = makeIcon("lucide:refresh-cw");
const ExternalLink = makeIcon("lucide:external-link");
const Layers = makeIcon("lucide:layers");
const Sparkles = makeIcon("lucide:sparkles");
const Smartphone = makeIcon("lucide:smartphone");
const Monitor = makeIcon("lucide:monitor");
import { apiFetch } from "@/lib/apiFetch";
import { uploadToCloudinary } from "@/lib/cloudinary";

export interface GallerySlot {
  tag: "GALLERY_1" | "GALLERY_2" | "GALLERY_3" | "GALLERY_4";
  slotName: string;
  defaultTitle: string;
  defaultHref: string;
  defaultImage: string;
  deviceNote: string;
  isDesktopOnly?: boolean;
}

const GALLERY_SLOTS: GallerySlot[] = [
  {
    tag: "GALLERY_1",
    slotName: "Slot 1 — Left Tall Card",
    defaultTitle: "Syrian Edits",
    defaultHref: "/category/syrian-collection",
    defaultImage: "https://modest-eta.vercel.app/abaya/hero/hero-6.jpg",
    deviceNote: "Full height on Mobile & Desktop",
  },
  {
    tag: "GALLERY_2",
    slotName: "Slot 2 — Top Right Card",
    defaultTitle: "The Classics",
    defaultHref: "/category/the-classics",
    defaultImage: "https://modest-eta.vercel.app/abaya/hero/hero-2.jpg",
    deviceNote: "Top card on Mobile & Desktop",
  },
  {
    tag: "GALLERY_3",
    slotName: "Slot 3 — Bottom Right Card",
    defaultTitle: "The Luxe Edit",
    defaultHref: "/category/the-luxe-edit",
    defaultImage: "https://modest-eta.vercel.app/abaya/hero/hero-3.jpg",
    deviceNote: "Bottom card on Mobile & Desktop",
  },
  {
    tag: "GALLERY_4",
    slotName: "Slot 4 — Right Tall Card",
    defaultTitle: "Occasion Wear",
    defaultHref: "/category/occasion-wear",
    defaultImage: "https://modest-eta.vercel.app/abaya/hero/hero-4.jpg",
    deviceNote: "Desktop only (Hidden on small screens)",
    isDesktopOnly: true,
  },
];

interface SlotState {
  id?: string;
  title: string;
  buttonLink: string;
  image: string;
  isUploading: boolean;
  isSaving: boolean;
}

export default function VisualGalleryAdminPage() {
  const [slots, setSlots] = useState<Record<string, SlotState>>({
    GALLERY_1: {
      title: GALLERY_SLOTS[0].defaultTitle,
      buttonLink: GALLERY_SLOTS[0].defaultHref,
      image: GALLERY_SLOTS[0].defaultImage,
      isUploading: false,
      isSaving: false,
    },
    GALLERY_2: {
      title: GALLERY_SLOTS[1].defaultTitle,
      buttonLink: GALLERY_SLOTS[1].defaultHref,
      image: GALLERY_SLOTS[1].defaultImage,
      isUploading: false,
      isSaving: false,
    },
    GALLERY_3: {
      title: GALLERY_SLOTS[2].defaultTitle,
      buttonLink: GALLERY_SLOTS[2].defaultHref,
      image: GALLERY_SLOTS[2].defaultImage,
      isUploading: false,
      isSaving: false,
    },
    GALLERY_4: {
      title: GALLERY_SLOTS[3].defaultTitle,
      buttonLink: GALLERY_SLOTS[3].defaultHref,
      image: GALLERY_SLOTS[3].defaultImage,
      isUploading: false,
      isSaving: false,
    },
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load existing gallery banners from DB
  const loadGalleryFromDB = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch("/banners");
      if (res.ok) {
        const banners = await res.json();
        if (Array.isArray(banners)) {
          setSlots((prev) => {
            const next = { ...prev };
            GALLERY_SLOTS.forEach((slotDef, idx) => {
              // Match by tag or by order
              const found = banners.find(
                (b: any) =>
                  b.tag === slotDef.tag ||
                  (b.tag?.startsWith("GALLERY_") && b.order === idx + 1)
              );
              if (found) {
                next[slotDef.tag] = {
                  ...next[slotDef.tag],
                  id: found.id,
                  title: found.title || slotDef.defaultTitle,
                  buttonLink: found.buttonLink || found.linkUrl || slotDef.defaultHref,
                  image: found.image || found.imageUrl || slotDef.defaultImage,
                };
              }
            });
            return next;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load gallery from backend, using defaults:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryFromDB();
  }, []);

  // Upload handler for single slot
  const handleFileUpload = async (slotTag: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file must be under 10 MB");
      return;
    }

    setSlots((prev) => ({
      ...prev,
      [slotTag]: { ...prev[slotTag], isUploading: true },
    }));

    try {
      const toastId = toast.loading(`Uploading image for ${slotTag}...`);
      const secureUrl = await uploadToCloudinary(file, "moodest/gallery");
      toast.dismiss(toastId);

      setSlots((prev) => ({
        ...prev,
        [slotTag]: {
          ...prev[slotTag],
          image: secureUrl,
          isUploading: false,
        },
      }));
      toast.success("Image uploaded to Cloudinary CDN successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
      setSlots((prev) => ({
        ...prev,
        [slotTag]: { ...prev[slotTag], isUploading: false },
      }));
    }
  };

  // Save handler for single slot
  const handleSaveSlot = async (slotDef: GallerySlot, slotIndex: number) => {
    const slotData = slots[slotDef.tag];
    if (!slotData) return;

    setSlots((prev) => ({
      ...prev,
      [slotDef.tag]: { ...prev[slotDef.tag], isSaving: true },
    }));

    try {
      const payload = {
        title: slotData.title || slotDef.defaultTitle,
        image: slotData.image || slotDef.defaultImage,
        buttonLink: slotData.buttonLink || slotDef.defaultHref,
        tag: slotDef.tag,
        order: slotIndex + 1,
        isActive: true,
      };

      if (slotData.id) {
        // Update existing banner
        const res = await apiFetch(`/banners/${slotData.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        // Create new banner entry
        const res = await apiFetch("/banners", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Creation failed");
        const created = await res.json();
        if (created?.id) {
          setSlots((prev) => ({
            ...prev,
            [slotDef.tag]: { ...prev[slotDef.tag], id: created.id },
          }));
        }
      }

      toast.success(`${slotDef.slotName} saved and live on homepage!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save gallery slot");
    } finally {
      setSlots((prev) => ({
        ...prev,
        [slotDef.tag]: { ...prev[slotDef.tag], isSaving: false },
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Visual Gallery Manager
            </h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              Live Home Mosaic
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Upload images, edit titles, and configure target links for the 4 signature editorial cards on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadGalleryFromDB}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            asChild
            className="flex items-center gap-1.5"
          >
            <a href="https://modest-eta.vercel.app" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              View Storefront
            </a>
          </Button>
        </div>
      </div>

      {/* 4 Gallery Cards Grid matching storefront layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {GALLERY_SLOTS.map((slotDef, idx) => {
          const current = slots[slotDef.tag];
          const fileInputRef = useRef<HTMLInputElement>(null);

          return (
            <Card key={slotDef.tag} className="flex flex-col h-full border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between">
                  <Badge variant={slotDef.isDesktopOnly ? "secondary" : "default"} className="text-[11px] font-semibold">
                    {slotDef.isDesktopOnly ? (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> Desktop Only
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" /> Mobile & Desktop
                      </span>
                    )}
                  </Badge>
                  <span className="text-xs text-neutral-400 font-mono">#{idx + 1}</span>
                </div>
                <CardTitle className="text-base font-semibold mt-2">{slotDef.slotName}</CardTitle>
                <CardDescription className="text-xs">{slotDef.deviceNote}</CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
                {/* Image Preview & Upload Container */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Card Cover Image</Label>
                  <div className="relative aspect-[3/4] w-full rounded-md border overflow-hidden bg-neutral-100 dark:bg-neutral-800 group">
                    {current.image ? (
                      <img
                        src={current.image}
                        alt={current.title || slotDef.defaultTitle}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-neutral-400">
                        <UploadCloud className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs">No image selected</span>
                      </div>
                    )}

                    {/* Overlay Upload Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={current.isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="shadow-lg text-xs font-semibold"
                      >
                        <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                        {current.isUploading ? "Uploading..." : "Change Image"}
                      </Button>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(slotDef.tag, f);
                    }}
                  />

                  {/* Direct Image URL input */}
                  <div className="mt-2">
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={current.image}
                      onChange={(e) =>
                        setSlots((prev) => ({
                          ...prev,
                          [slotDef.tag]: { ...prev[slotDef.tag], image: e.target.value },
                        }))
                      }
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                {/* Title & Link Inputs */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Overlay Title</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Syrian Edits"
                      value={current.title}
                      onChange={(e) =>
                        setSlots((prev) => ({
                          ...prev,
                          [slotDef.tag]: { ...prev[slotDef.tag], title: e.target.value },
                        }))
                      }
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Target Category Link</Label>
                    <Input
                      type="text"
                      placeholder="e.g. /category/syrian-collection"
                      value={current.buttonLink}
                      onChange={(e) =>
                        setSlots((prev) => ({
                          ...prev,
                          [slotDef.tag]: { ...prev[slotDef.tag], buttonLink: e.target.value },
                        }))
                      }
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                {/* Save Button for Slot */}
                <div className="pt-2">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full text-xs font-semibold"
                    disabled={current.isSaving || current.isUploading}
                    onClick={() => handleSaveSlot(slotDef, idx)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {current.isSaving ? "Saving..." : "Save Card"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

