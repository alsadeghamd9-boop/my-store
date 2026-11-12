import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getCategories, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = (await getCategories()).find((item) => item.slug === slug);
  if (!category) notFound();
  const page = Math.max(1, Math.min(Math.floor(Number((await searchParams).page) || 1), 10000));
  const result = await listProducts({ categoryId: category.id, page, pageSize: 12, sort: "newest" });
  return <div className="container-page py-8 sm:py-10">
    <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink-900"><ChevronRight size={15} /> الرئيسية</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6"><div><p className="mb-2 text-xs font-semibold text-terracotta">تسوّق حسب القسم</p><h1 className="text-3xl font-bold text-ink-950">{category.name}</h1><p className="mt-2 text-sm text-muted">{category.tagline || "اختيارات مميزة لك من سوق السودان."}</p></div><p className="text-sm text-muted">{result.total} منتج</p></div>
    {result.items.length ? <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{result.items.map((product) => <li key={product.id}><ProductCard product={product} /></li>)}</ul> : <div className="card mt-6 p-10 text-center"><p className="font-semibold">لا توجد منتجات في هذا القسم حالياً.</p><Link href="/search" className="mt-3 inline-flex items-center gap-1 text-sm text-ink-700 underline">تصفح كل المنتجات <ArrowLeft size={14} /></Link></div>}
    {result.pages > 1 && <nav className="mt-8 flex justify-center gap-2" aria-label="صفحات المنتجات">{Array.from({length: Math.min(result.pages, 20)}, (_, i) => <Link key={i} href={`/categories/${slug}?page=${i+1}`} aria-current={page === i+1 ? "page" : undefined} className={`grid size-10 place-items-center rounded-full text-sm ${page === i+1 ? "bg-ink-900 text-white" : "border border-line bg-white"}`}>{i+1}</Link>)}</nav>}
  </div>;
}
