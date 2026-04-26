'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Product, GAME_CATEGORIES } from '@/types';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get('category') ?? '';
  const featured = searchParams.get('featured') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showSold, setShowSold] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(category && { category }),
        ...(featured && { featured }),
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, featured, page]);

  useEffect(() => {
    setPage(1);
  }, [category, featured]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function setCategory(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set('category', val);
    else params.delete('category');
    params.delete('featured');
    router.push(`/products?${params.toString()}`);
  }

  const displayedProducts = showSold ? products : products.filter((p) => !p.isSold);
  const availableCount = products.filter((p) => !p.isSold).length;

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {featured
              ? '⭐ Featured Accounts'
              : category
              ? `${GAME_CATEGORIES.find((c) => c.value === category)?.label ?? category} Accounts`
              : 'All Gaming Accounts'}
          </h1>
          <p className="text-gray-500">
            {loading ? 'Loading...' : `${availableCount} available${total > availableCount ? ` of ${total} total` : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !category && !featured
                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            All
          </button>
          {GAME_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat.value
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Show sold toggle */}
        <div className="flex items-center gap-2 mb-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-400 select-none">
            <div
              onClick={() => setShowSold(!showSold)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                showSold ? 'bg-violet-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showSold ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            Show sold accounts
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <ProductGrid products={displayedProducts} />

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-gray-500 text-sm">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
