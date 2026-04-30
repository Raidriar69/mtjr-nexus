'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';

interface OrderSummary {
  _id: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paypalManual?: boolean;
  paypalInvoiceId?: string;
  quantity: number;
  createdAt: string;
  productId?: { _id: string; game?: string; title?: string; images?: string[] };
}

function StatusBadge({ status, t }: { status: string; t: (k: any) => string }) {
  const map: Record<string, { label: string; classes: string }> = {
    completed:            { label: t('orders.statusCompleted'),            classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
    pending:              { label: t('orders.statusPending'),              classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
    waiting_confirmation: { label: t('orders.statusWaiting'),             classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
    failed:               { label: t('orders.statusFailed'),               classes: 'bg-red-500/15 text-red-400 border border-red-500/20' },
    rejected:             { label: t('orders.statusRejected'),             classes: 'bg-red-600/15 text-red-400 border border-red-500/20' },
    refunded:             { label: t('orders.statusRefunded'),             classes: 'bg-gray-500/15 text-gray-400 border border-gray-500/20' },
  };
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-gray-700 text-gray-300' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${classes}`}>
      {label}
    </span>
  );
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{t('orders.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">{t('orders.subtitle')}</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-400 font-semibold mb-1">{t('orders.noPurchases')}</p>
            <p className="text-gray-600 text-sm mb-6">{t('orders.noPurchasesSubtext')}</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm"
            >
              {t('common.browseAccounts')} →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const product = order.productId;
              const date = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              });
              const isWaiting = order.status === 'waiting_confirmation';

              return (
                <div
                  key={order._id}
                  className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${
                    isWaiting ? 'border-blue-500/30' : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* PayPal "waiting" banner */}
                  {isWaiting && (
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-4">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-blue-300 text-xs font-medium">
                        {t('orders.waitingForApproval')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700">
                      {product?.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          {product?.game && (
                            <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                              {product.game}
                            </p>
                          )}
                          <p className="text-white font-semibold text-sm truncate">
                            {product?.title ?? `Order #${order._id.slice(-8).toUpperCase()}`}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5">
                            {date}
                            {order.paypalInvoiceId && (
                              <span className="ml-2 text-[#009cde] font-mono">{order.paypalInvoiceId}</span>
                            )}
                          </p>
                        </div>
                        <StatusBadge status={order.status} t={t} />
                      </div>

                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        <span className="text-emerald-400 font-bold text-sm price-ltr">
                          {formatPrice(order.amount / 100)}
                        </span>
                        {order.status === 'completed' && (
                          <Link
                            href={`/orders/${order._id}`}
                            className="text-violet-400 hover:text-violet-300 text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all"
                          >
                            {t('orders.viewOrder')}
                          </Link>
                        )}
                        {isWaiting && (
                          <span className="text-blue-400 text-xs font-medium bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                            ⏳ {t('orders.pendingApproval')}
                          </span>
                        )}
                        {(order.status === 'pending' && order.paypalManual) && (
                          <Link
                            href={`/orders/${order._id}`}
                            className="text-gray-400 hover:text-gray-300 text-xs font-semibold bg-gray-700/50 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-all"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
