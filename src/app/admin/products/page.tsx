import AdminProducts from "@/components/AdminProducts";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = Array.isArray(sp.filter) ? sp.filter[0] : sp.filter;
  return <AdminProducts initialLowStock={filter === "lowstock"} />;
}
