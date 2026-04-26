'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  }

  async function toggleSold(product: Product) {
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSold: !product.isSold }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isSold: data.product.isSold } : p)));
      toast.success(data.product.isSold ? 'Marked as sold' : 'Marked as available');
    } catch {
      toast.error('Failed to update product');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} total listings</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm">+ Add Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No products yet.</p>
          <Link href="/admin/products/new">
            <Button>Add Your First Product</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Product</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Price</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-10 h-7 rounded object-cover bg-gray-800 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[180px]">{product.title}</p>
                          <p className="text-gray-500 text-xs">{product.game}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-gray-400 capitalize">{product.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-semibold">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.isSold ? 'sold' : 'success'}>
                        {product.isSold ? 'Sold' : 'Available'}
                      </Badge>
                      {product.isFeatured && <Badge variant="warning" className="ml-1.5">Featured</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleSold(product)}
                          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700"
                        >
                          {product.isSold ? 'Relist' : 'Mark Sold'}
                        </button>
                        <Link href={`/admin/products/${product._id}`}>
                          <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded hover:bg-violet-500/10">
                            Edit
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.title)}
                          disabled={deleting === product._id}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deleting === product._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
