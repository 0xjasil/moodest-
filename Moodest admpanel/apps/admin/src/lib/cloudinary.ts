import { compressImage } from "./image-utils";

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

