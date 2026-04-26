'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Order } from '@/types';

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'default';
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [showCreds, setShowCreds] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Orders</h1>
          <p className="text-gray-500 mt-1">
            {session?.user?.name ? `Signed in as ${session.user.name}` : 'Your purchase history'}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-500 text-lg mb-2">No orders yet</p>
            <p className="text-gray-600 text-sm mb-6">Browse our catalog to find your perfect account.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Browse Accounts →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const product = order.product || (order as any).productId;
              return (
                <div
                  key={order._id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    {product?.images?.[0] && (
                      <div className="w-full sm:w-24 h-16 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-violet-400 text-xs font-medium uppercase tracking-wider">
                            {product?.game ?? 'Unknown Game'}
                          </p>
                          <p className="text-white font-semibold mt-0.5 truncate">
                            {product?.title ?? `Order #${order._id.slice(-8).toUpperCase()}`}
                          </p>
                        </div>
                        <Badge variant={statusVariant(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        <span className="text-gray-500">
                          Amount:{' '}
                          <span className="text-white font-medium">
                            ${(order.amount / 100).toFixed(2)} {order.currency?.toUpperCase()}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Date:{' '}
                          <span className="text-gray-300">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>

                      {order.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelected(selected?._id === order._id ? null : order);
                            setShowCreds(false);
                          }}
                          className="mt-3 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
                        >
                          {selected?._id === order._id ? '▲ Hide Details' : '▼ View Delivery Details'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delivery details */}
                  {selected?._id === order._id && order.deliveryDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="bg-violet-900/15 border border-violet-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-violet-300 text-sm font-semibold">Account Credentials</p>
                          <button
                            onClick={() => setShowCreds(!showCreds)}
                            className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                          >
                            {showCreds ? '🔒 Hide' : '🔓 Reveal'}
                          </button>
                        </div>
                        {order.deliveryDetails.email && (
                          <div className="space-y-1.5">
                            <p className="text-sm">
                              <span className="text-gray-500">Email: </span>
                              <span className="text-gray-300 font-mono">
                                {showCreds ? order.deliveryDetails.email : '••••••••••@•••••.com'}
                              </span>
                            </p>
                            {order.deliveryDetails.password && (
                              <p className="text-sm">
                                <span className="text-gray-500">Password: </span>
                                <span className="text-gray-300 font-mono">
                                  {showCreds ? order.deliveryDetails.password : '••••••••••'}
                                </span>
                              </p>
                            )}
                            {order.deliveryDetails.instructions && (
                              <p className="text-gray-400 text-xs mt-2">{order.deliveryDetails.instructions}</p>
                            )}
                          </div>
                        )}
                        {!order.deliveryDetails.email && order.deliveryDetails.instructions && (
                          <p className="text-gray-400 text-sm">{order.deliveryDetails.instructions}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
