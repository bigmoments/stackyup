import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import sharp from "sharp";

// Configure Cloudinary if credentials exist in environment
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  filename: string;
  mimeType: string;
}

/**
 * Optimizes an existing Cloudinary image URL to automatically deliver
 * modern WebP/AVIF formats and responsive compression via `f_auto,q_auto`.
 * If it's already an optimized Cloudinary URL or a local URL, it returns safely.
 */
export function getOptimizedImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();

  // If it's a Cloudinary URL and doesn't already have f_auto,q_auto
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    if (trimmed.includes("/f_auto") || trimmed.includes("q_auto")) {
      return trimmed;
    }
    return trimmed.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }

  return trimmed;
}

/**
 * Pre-compress buffer before upload using Sharp.
 * Uses high-efficiency WebP with quality 85 and smart chroma subsampling
 * to preserve crisp visual details (text, UI, diagrams) while heavily reducing file size.
 */
async function precompressImageBuffer(
  inputBuffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; ext: string; width?: number; height?: number }> {
  // SVG doesn't need pixel compression
  if (mimeType === "image/svg+xml") {
    return { buffer: inputBuffer, mimeType, ext: ".svg" };
  }

  // GIF animations can be preserved or passed through if animated
  if (mimeType === "image/gif") {
    return { buffer: inputBuffer, mimeType, ext: ".gif" };
  }

  try {
    const pipeline = sharp(inputBuffer, { animated: false });
    const metadata = await pipeline.metadata();

    // Resize if unreasonably huge (e.g. raw camera > 2560px) while maintaining aspect ratio
    let processed = pipeline;
    if (metadata.width && metadata.width > 2560) {
      processed = processed.resize({ width: 2560, withoutEnlargement: true });
    }

    // High fidelity webp compression (85 quality, lossless color components preserved)
    const compressedBuffer = await processed
      .webp({
        quality: 85,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    const outputMeta = await sharp(compressedBuffer).metadata();

    return {
      buffer: compressedBuffer,
      mimeType: "image/webp",
      ext: ".webp",
      width: outputMeta.width || metadata.width,
      height: outputMeta.height || metadata.height,
    };
  } catch (err) {
    console.warn("[storage] Pre-compression skipped, fallback to original buffer:", err);
    return { buffer: inputBuffer, mimeType, ext: ".webp" };
  }
}

export async function uploadFile(
  file: File,
  alt?: string,
  requestOrigin = "http://localhost:3000"
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const rawBuffer = Buffer.from(bytes);
  const originalName = file.name || "image.webp";
  const id = `m_${nanoid(16)}`;
  const inputMime = file.type || "image/webp";

  // 1. Pre-compress image buffer before saving to disk or Cloudinary
  const { buffer, mimeType, ext, width, height } = await precompressImageBuffer(rawBuffer, inputMime);
  const sizeBytes = buffer.length;

  if (hasCloudinary) {
    // Production Cloudinary Upload with f_auto,q_auto delivery transformations
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || "stackyup",
          public_id: id,
          resource_type: "image",
          format: ext.replace(".", "") || "webp",
          // Cloudinary on-the-fly auto format (WebP / AVIF) and auto perceptual quality
          transformation: [{ fetch_format: "auto", quality: "auto" }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Cloudinary upload failed"));
          }

          // Ensure returned URL contains /f_auto,q_auto/ for dynamic client AVIF/WebP delivery
          const optimizedUrl = getOptimizedImageUrl(result.secure_url);

          resolve({
            id,
            url: optimizedUrl,
            alt: alt || originalName,
            width: result.width || width,
            height: result.height || height,
            sizeBytes: result.bytes || sizeBytes,
            filename: `${id}${ext}`,
            mimeType,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Fallback: Local disk storage in ./public/uploads
  const uploadDir = path.resolve(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cleanFilename = `${id}${ext}`;
  const filePath = path.join(uploadDir, cleanFilename);
  await fs.promises.writeFile(filePath, buffer);

  const localUrl = `${requestOrigin}/uploads/${cleanFilename}`;

  return {
    id,
    url: localUrl,
    alt: alt || originalName,
    width: width || 1600,
    height: height || 900,
    sizeBytes,
    filename: cleanFilename,
    mimeType,
  };
}

export async function deleteStoredFile(mediaItem: { id: string; filename: string }) {
  if (hasCloudinary) {
    try {
      const publicId = `${process.env.CLOUDINARY_FOLDER || "stackyup"}/${mediaItem.id}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.warn("Cloudinary delete error:", err);
    }
  }

  try {
    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, mediaItem.filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.warn("Local file delete error:", err);
  }
}
