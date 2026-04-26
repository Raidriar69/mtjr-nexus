'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface AdminOrder {
  _id: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  productId?: {
    game?: string;
    title?: string;
    price?: number;
  };
}

function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'completed') return 'success';
  if (s === 'pending') return 'warning';
  if (s === 'failed') return 'danger';
  return 'default';
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const revenue = orders.filter((o) => o.status === 'completed').reduce((acc, o) => acc + o.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} total · Total revenue:{' '}
            <span className="text-emerald-400 font-semibold">${(revenue / 100).toFixed(2)}</span>
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'completed', 'pending', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No orders found.</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Order</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium hidden md:table-cell">Buyer</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium hidden sm:table-cell">Product</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-400 font-mono text-xs">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs truncate max-w-[160px] block">{order.buyerEmail}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div>
                        <p className="text-white text-xs font-medium truncate max-w-[160px]">
                          {order.productId?.title ?? '—'}
                        </p>
                        <p className="text-gray-600 text-xs">{order.productId?.game}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-semibold">${(order.amount / 100).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
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
