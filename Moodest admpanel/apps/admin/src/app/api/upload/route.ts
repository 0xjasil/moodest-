import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dsaegpb70";
const API_KEY = process.env.CLOUDINARY_API_KEY || "498614581613933";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "n2lMcS-svW5-mUh61vt8-4xIGPE";

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

