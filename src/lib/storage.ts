import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

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

export async function uploadFile(
  file: File,
  alt?: string,
  requestOrigin = "http://localhost:3000"
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const sizeBytes = buffer.length;
  const originalName = file.name || "image.webp";
  const ext = path.extname(originalName) || ".webp";
  const id = `m_${nanoid(16)}`;
  const mimeType = file.type || "image/webp";

  if (hasCloudinary) {
    // Production Cloudinary Upload
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "stackyup/media",
          public_id: id,
          resource_type: "image",
          format: "webp", // auto-convert to WebP
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Cloudinary upload failed"));
          }
          resolve({
            id,
            url: result.secure_url,
            alt: alt || originalName,
            width: result.width,
            height: result.height,
            sizeBytes: result.bytes || sizeBytes,
            filename: `${id}.webp`,
            mimeType: "image/webp",
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
    width: 1600, // standard default fallback width
    height: 900, // standard default fallback height
    sizeBytes,
    filename: cleanFilename,
    mimeType,
  };
}
