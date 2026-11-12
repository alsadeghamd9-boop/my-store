export const dynamic = "force-dynamic";

import { requireAdminPage } from "@/lib/admin-auth";
import ProductForm from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/queries";

export default async function NewProductPage() {
  await requireAdminPage();
  const cats = await getCategories();
  return (
    <section aria-labelledby="new-product">
      <h2 id="new-product" className="mb-4 text-lg font-bold text-ink-950">
        إضافة منتج جديد
      </h2>
      <ProductForm
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          title: "",
          brand: "",
          categoryId: "",
          price: "",
          listPrice: "",
          stock: "10",
          description: "",
          features: "",
          images: [],
          isDeal: false,
          express: false,
        }}
      />
    </section>
  );
}
