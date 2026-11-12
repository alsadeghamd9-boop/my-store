import CategoryManager from "@/components/admin/CategoryManager";
import { requireAdminPage } from "@/lib/admin-auth";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";
export default async function AdminCategoriesPage() {
  await requireAdminPage();
  const categories = await getCategories();
  return <CategoryManager categories={categories} />;
}
