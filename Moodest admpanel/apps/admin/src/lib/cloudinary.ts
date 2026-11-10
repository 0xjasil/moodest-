import { compressImage } from "./image-utils";

/**
 * Extract public_id from a Cloudinary URL:
 * e.g. https://res.cloudinary.com/dsaegpb70/image/upload/v1794240615/moodest/categories/yjzxcj73fypiu5u4s3v1.jpg
 * => moodest/categories/yjzxcj73fypiu5u4s3v1
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return null;
  }
  try {
    const match = url.match(/\/image\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?(?:\?.*)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Upload an image file or base64 string to Cloudinary.
 * Compresses large files on the client before uploading.
 * Returns the secure Cloudinary CDN URL.
 */
export async function uploadToCloudinary(
  fileOrBase64: File | Blob | string,
  folder: string = "moodest/products"
): Promise<string> {
  let fileToUpload: File | Blob | string = fileOrBase64;

  // Compress image if it's a File
  if (fileOrBase64 instanceof File && fileOrBase64.type.startsWith("image/")) {
    try {
      fileToUpload = await compressImage(fileOrBase64, 1600, 1600, 0.85);
    } catch (e) {
      console.warn("[Cloudinary] Client compression failed, using original file:", e);
      fileToUpload = fileOrBase64;
    }
  }

  const formData = new FormData();
  formData.append("file", fileToUpload);
  formData.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.secure_url && !data.url) {
    throw new Error("No URL returned from upload");
  }

  return data.secure_url || data.url;
}

/**
 * Delete an image from Cloudinary by its URL or public_id.
 * Safe to call even if the image is not on Cloudinary (no-op).
 */
export async function deleteFromCloudinary(urlOrPublicId?: string | null): Promise<boolean> {
  if (!urlOrPublicId) return false;

  const publicId = urlOrPublicId.includes("cloudinary.com")
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) {
    return false;
  }

  try {
    const res = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("[Cloudinary] Failed to delete image:", err);
      return false;
    }

    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn("[Cloudinary] Error calling delete API:", err);
    return false;
  }
}
