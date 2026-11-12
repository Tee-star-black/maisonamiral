import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { db, mutate, reply, failure, HttpError } from "@/lib/admin/server";
export const runtime = "nodejs";
export async function POST(r: Request) {
  try {
    const actor = await mutate(r);
    const reader = r.body?.getReader();
    if (!reader) throw new HttpError(400, "Choose an image.");
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8 * 1024 * 1024) {
        await reader.cancel();
        throw new HttpError(413, "Images must be under 8 MB.");
      }
      parts.push(value);
    }
    let output: Buffer;
    try {
      const input = sharp(Buffer.concat(parts), {
        limitInputPixels: 40000000,
        animated: false,
      });
      const meta = await input.metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format || "")) throw Error();
      output = await input
        .rotate()
        .resize({
          width: 2000,
          height: 2500,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new HttpError(
        400,
        "Upload a valid JPEG, PNG or WebP image under 40 megapixels.",
      );
    }
    const path = actor.id + "/" + randomUUID() + ".webp";
    const { error } = await db()
      .storage.from("maison-products")
      .upload(path, output, { contentType: "image/webp", upsert: false });
    if (error) throw error;
    return reply({
      url: db().storage.from("maison-products").getPublicUrl(path).data
        .publicUrl,
    });
  } catch (e) {
    return failure(e);
  }
}
