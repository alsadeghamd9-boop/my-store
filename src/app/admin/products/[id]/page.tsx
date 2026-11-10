import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import ProductForm from "@/components/admin/ProductForm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCategories } from "@/lib/queries";

const sar = (halalas: number) => String(halalas / 100);

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [[product], cats] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <section aria-labelledby="edit-product">
      <h2 id="edit-product" className="mb-4 text-lg font-bold text-ink-950">
        تعديل المنتج
        {!product.active && (
          <span className="ms-2 rounded-full bg-ink-100 px-2.5 py-1 font-sans text-xs font-semibold text-ink-900">
            مؤرشف
          </span>
        )}
      </h2>
      <ProductForm
        productId={product.id}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          title: product.title,
          brand: product.brand,
          categoryId: String(product.categoryId),
          price: sar(product.price),
          listPrice: product.listPrice ? sar(product.listPrice) : "",
          stock: String(product.stock),
          description: product.description,
          features: product.features.join("\n"),
          images: product.images.join("\n"),
          isDeal: product.isDeal,
          express: product.express,
        }}
      />
    </section>
  );
}
