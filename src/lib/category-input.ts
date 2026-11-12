import { str } from "@/lib/api";

export function parseCategory(body: Record<string, unknown>) {
  const name = str(body.name, 80);
  const tagline = str(body.tagline, 140);
  const image = str(body.image, 600);
  if (name.length < 2) return { error: "اكتب اسم القسم، حرفين على الأقل." } as const;
  if (image && !/^(https:\/\/|\/(?!\/))\S+$/.test(image)) return { error: "تعذّر التحقق من صورة القسم." } as const;
  return { data: { name, tagline, image } } as const;
}
