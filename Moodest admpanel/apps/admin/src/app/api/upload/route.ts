import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dsaegpb70";
const API_KEY = process.env.CLOUDINARY_API_KEY || "498614581613933";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "n2lMcS-svW5-mUh61vt8-4xIGPE";

/**
 * Extract public_id from Cloudinary URL:
 * e.g. https://res.cloudinary.com/dsaegpb70/image/upload/v1794240615/moodest/categories/yjzxcj73fypiu5u4s3v1.jpg
 * => moodest/categories/yjzxcj73fypiu5u4s3v1
 */
function extractCloudinaryPublicId(url: string): string | null {
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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileData: string | Blob | null = null;
    let folder = "moodest/uploads";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const folderParam = formData.get("folder");
      if (folderParam && typeof folderParam === "string") {
        folder = folderParam;
      }

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      if (typeof file === "string") {
        fileData = file;
      } else if (file instanceof Blob) {
        fileData = file;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.file) {
        return NextResponse.json({ error: "No file provided in body" }, { status: 400 });
      }
      fileData = body.file;
      if (body.folder) {
        folder = body.folder;
      }
    }

    if (!fileData) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

    const uploadFormData = new FormData();
    uploadFormData.append("file", fileData);
    uploadFormData.append("api_key", API_KEY);
    uploadFormData.append("timestamp", String(timestamp));
    uploadFormData.append("folder", folder);
    uploadFormData.append("signature", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const cloudinaryRes = await fetch(uploadUrl, {
      method: "POST",
      body: uploadFormData,
    });

    const result = await cloudinaryRes.json();

    if (!cloudinaryRes.ok || result.error) {
      console.error("[Cloudinary Upload Error]", result.error);
      return NextResponse.json(
        { error: result.error?.message || "Failed to upload to Cloudinary" },
        { status: cloudinaryRes.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err: any) {
    console.error("[Upload Route Error]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let publicId = searchParams.get("public_id");
    let url = searchParams.get("url");

    if (!publicId && req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      publicId = body.public_id || publicId;
      url = body.url || url;
    }

    if (!publicId && url) {
      publicId = extractCloudinaryPublicId(url);
    }

    if (!publicId) {
      return NextResponse.json(
        { error: "Missing public_id or valid Cloudinary image URL" },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const strToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`;
    const cloudinaryRes = await fetch(destroyUrl, {
      method: "POST",
      body: formData,
    });

    const result = await cloudinaryRes.json();
    return NextResponse.json({
      success: result.result === "ok" || result.result === "not found",
      result: result.result,
      public_id: publicId,
    });
  } catch (err: any) {
    console.error("[Cloudinary Delete Route Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete image from Cloudinary" },
      { status: 500 }
    );
  }
}
