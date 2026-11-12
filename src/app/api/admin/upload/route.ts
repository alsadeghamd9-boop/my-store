import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { fail, isSameOrigin, ok } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_BYTES = 4 * 1024 * 1024; // Keep the entire request below Vercel's body limit.

function isImage(bytes: Buffer) {
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return jpeg || png || webp;
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return fail("الطلب غير مسموح.", 403);
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return fail("هذه العملية متاحة لمدير المتجر فقط.", 403);
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return fail("لم يتم إعداد خدمة رفع الصور. راجع متغيرات Cloudinary على الخادم.", 503);
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES + 64 * 1024) return fail("حجم الصورة يجب ألا يتجاوز 4 ميجابايت.", 413);
  let data: FormData;
  try { data = await req.formData(); } catch { return fail("تعذّر قراءة ملف الصورة.", 400); }
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    return fail("اختر صورة لا يتجاوز حجمها 4 ميجابايت.", 422);
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isImage(bytes)) return fail("الصيغ المدعومة هي JPG وPNG وWebP فقط.", 422);

  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  try {
    const uploaded = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "souq-sudan/products", resource_type: "image", allowed_formats: ["jpg", "jpeg", "png", "webp"] },
        (error, result) => error || !result ? reject(error ?? new Error("No upload result")) : resolve(result.secure_url),
      );
      stream.end(bytes);
    });
    return ok({ url: uploaded });
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return fail("تعذّر رفع الصورة. تحقق من إعدادات الخدمة وحاول مجدداً.", 502);
  }
}
