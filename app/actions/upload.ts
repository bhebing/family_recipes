"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { s3, S3_BUCKET, S3_BASE_URL } from "@/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function getPresignedUploadUrl(contentType: string, size: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!ALLOWED_TYPES.includes(contentType)) throw new Error("Unsupported file type");
  if (size > MAX_BYTES) throw new Error("File too large (max 10 MB)");

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `recipes/${randomUUID()}.${ext}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );

  return { url, publicUrl: `${S3_BASE_URL}/${key}` };
}

export async function deleteUploadedImage(publicUrl: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!publicUrl.startsWith(`${S3_BASE_URL}/`)) throw new Error("Invalid image URL");
  const key = publicUrl.slice(`${S3_BASE_URL}/`.length);
  if (!key.startsWith("recipes/")) return;

  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}
