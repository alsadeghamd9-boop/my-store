export const dynamic = "force-dynamic";

import { requireAdminPage } from "@/lib/admin-auth";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import ArchiveButton from "@/components/admin/ArchiveButton";
import DeleteButton from "@/components/admin/DeleteButton";
import { Money } from "@/components/Price";
import SmartImage from "@/components/SmartImage";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { formatCount } from "@/lib/format";

export default async function AdminProductsPage() {
  await requireAdminPage();
  const rows = await getDb().select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      brand: products.brand,
      images: products.images,
      price: products.price,
      stock: products.stock,
      active: products.active,
      isDeal: products.isDeal,
      category: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(desc(products.active), asc(categories.sort), desc(products.id));

  return (
    <section aria-labelledby="products-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="products-title" className="text-lg font-bold text-ink-950">
          المنتجات{" "}
          <span className="font-sans text-sm font-normal text-muted">
            ({formatCount(rows.length)})
          </span>
        </h2>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={17} aria-hidden="true" />
          إضافة منتج
        </Link>
      </div>

      <div className="card thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-start text-muted">
              <th scope="col" className="px-4 py-3 text-start font-medium">
                المنتج
              </th>
              <th scope="col" className="px-3 py-3 text-start font-medium">
                القسم
              </th>
              <th scope="col" className="px-3 py-3 text-start font-medium">
                السعر
              </th>
              <th scope="col" className="px-3 py-3 text-start font-medium">
                المخزون
              </th>
              <th scope="col" className="px-3 py-3 text-start font-medium">
                الحالة
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className={p.active ? "" : "bg-paper/40"}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SmartImage
                      src={p.images[0]}
                      alt=""
                      className={`h-12 w-12 shrink-0 rounded-lg bg-paper object-cover ${
                        p.active ? "" : "opacity-60 grayscale"
                      }`}
                    />
                    <div className="min-w-0">
                      {p.active ? (
                        <Link
                          href={`/product/${p.slug}`}
                          className="line-clamp-1 rounded font-medium text-body hover:text-ink-700 hover:underline"
                        >
                          {p.title}
                        </Link>
                      ) : (
                        <p className="line-clamp-1 font-medium text-muted">{p.title}</p>
                      )}
                      <p className="text-xs text-muted">{p.brand || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-body">{p.category}</td>
                <td className="px-3 py-3">
                  <Money value={p.price} className="font-semibold text-ink-950" />
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={
                      p.stock === 0
                        ? "font-semibold text-deal"
                        : p.stock <= 5
                          ? "font-semibold text-[#8a5a00]"
                          : "text-body"
                    }
                  >
                    {p.stock === 0 ? "نفد" : formatCount(p.stock)}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.active ? "bg-express/10 text-express" : "bg-ink-100 text-ink-900"
                    }`}
                  >
                    {p.active ? "معروض" : "مؤرشف"}
                  </span>
                  {p.active && p.isDeal && (
                    <span className="ms-1.5 inline-flex rounded-full bg-deal/10 px-2.5 py-1 text-xs font-semibold text-deal">
                      عرض
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-1 text-sm font-semibold text-ink-700 hover:underline"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      تعديل
                    </Link>
                    <ArchiveButton productId={p.id} active={p.active} />
                    <DeleteButton url={`/api/admin/products/${p.id}`} label="حذف" confirmation="حذف المنتج نهائياً؟ ستبقى بياناته في الطلبات السابقة." />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
