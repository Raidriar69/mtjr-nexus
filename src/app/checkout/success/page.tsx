'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface OrderData {
  _id: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  quantity?: number;
  deliveryDetails?: { email?: string; password?: string; instructions?: string };
  deliveredAccounts?: { email: string; password: string }[];
  productId?: { game?: string; title?: string };
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const allIds = searchParams.get('all_ids');
  const { clearCart } = useCart();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  // Clear cart on landing
  useEffect(() => { clearCart(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const ids = allIds ? allIds.split(',').filter(Boolean) : [orderId];

    const poll = async (attempts = 0) => {
      try {
        const results = await Promise.all(
          ids.map((id) => fetch(`/api/orders/${id}`).then((r) => r.json()).then((d) => d.order))
        );
        const valid = results.filter(Boolean);
        setOrders(valid);
        const allComplete = valid.every((o: OrderData) => o.status === 'completed');
        if (allComplete || attempts >= 12) { setLoading(false); return; }
        setTimeout(() => poll(attempts + 1), 2000);
      } catch { setLoading(false); }
    };
    poll();
  }, [orderId, allIds]); // eslint-disable-line

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4 font-medium">Confirming your payment…</p>
          <p className="text-gray-600 text-sm mt-1">Hang tight — this takes just a few seconds</p>
        </div>
      </div>
    );
  }

  const primaryOrder = orders[0];
  const totalPaid = orders.reduce((s, o) => s + o.amount, 0);
  const allComplete = orders.every((o) => o.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            allComplete
              ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            {allComplete ? (
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            {allComplete ? 'Payment Confirmed!' : 'Payment Processing…'}
          </h1>
          {primaryOrder && (
            <p className="text-gray-500 text-sm">
              {allComplete ? 'Account details sent to ' : 'Finalising order for '}
              <span className="text-gray-300 font-medium">{primaryOrder.buyerEmail}</span>
            </p>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-bold">Order Details</h2>
            {orders.length > 1 && <span className="text-gray-500 text-sm">{orders.length} items</span>}
          </div>
          <div className="space-y-3 mb-4">
            {orders.map((order) => (
              <div key={order._id} className="flex justify-between text-sm">
                <div>
                  <span className="text-violet-400 text-xs block">{order.productId?.game}</span>
                  <span className="text-gray-300">{order.productId?.title ?? `Order #${order._id.slice(-8).toUpperCase()}`}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`text-xs block ${order.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {order.status === 'completed' ? '✓ Delivered' : '⏳ Processing'}
                  </span>
                  <span className="text-white font-medium">${(order.amount / 100).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-3 flex justify-between">
            <span className="text-gray-500 text-sm">Total paid</span>
            <span className="text-emerald-400 font-bold text-lg">${(totalPaid / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Credentials section — handles single/shared and bulk */}
        {orders.some((o) => o.deliveryDetails?.email || o.deliveredAccounts?.length) && (
          <div className="space-y-4 mb-6">
            <h2 className="text-white font-bold text-lg">🔑 Account Credentials</h2>

            {orders.filter((o) => o.deliveryDetails?.email || o.deliveredAccounts?.length).map((order) => {
              const show = revealed.has(order._id);
              const isBulk = Boolean(order.deliveredAccounts?.length);

              return (
                <div key={order._id} className="bg-gray-900 border border-violet-500/20 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
                      {order.productId?.game} — {order.productId?.title}
                      {isBulk && ` (×${order.deliveredAccounts!.length})`}
                    </p>
                    <button
                      onClick={() =>
                        setRevealed((prev) => {
                          const n = new Set(prev);
                          show ? n.delete(order._id) : n.add(order._id);
                          return n;
                        })
                      }
                      className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                    >
                      {show ? '🔒 Hide' : '🔓 Reveal'}
                    </button>
                  </div>

                  {show && (
                    <div className="space-y-3">
                      {/* ── Bulk: multiple credentials ── */}
                      {isBulk && order.deliveredAccounts!.map((acct, idx) => (
                        <div key={idx} className="bg-violet-900/20 rounded-xl p-4 space-y-2">
                          <p className="text-violet-400 text-xs font-bold">Account #{idx + 1}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Email</span>
                            <span className="text-gray-200 font-mono text-sm select-all">{acct.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Password</span>
                            <span className="text-gray-200 font-mono text-sm select-all">{acct.password}</span>
                          </div>
                        </div>
                      ))}

                      {/* ── Single / Shared: one set of credentials ── */}
                      {!isBulk && order.deliveryDetails && (
                        <div className="bg-violet-900/20 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Email</span>
                            <span className="text-gray-200 font-mono text-sm select-all">{order.deliveryDetails.email}</span>
                          </div>
                          {order.deliveryDetails.password && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-sm">Password</span>
                              <span className="text-gray-200 font-mono text-sm select-all">{order.deliveryDetails.password}</span>
                            </div>
                          )}
                          {order.deliveryDetails.instructions && (
                            <p className="text-gray-400 text-xs pt-2 border-t border-violet-500/20">
                              {order.deliveryDetails.instructions}
                            </p>
                          )}
                        </div>
                      )}

                      <p className="text-amber-500 text-xs">⚠️ Change passwords immediately. Never share these credentials.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link href="/orders" className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-all text-center hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            View My Orders
          </Link>
          <Link href="/products" className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3.5 rounded-xl text-sm transition-all text-center">
            Browse More
          </Link>
        </div>

      </div>
    </div>
  );
}
