'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';

interface OrderDetail {
  _id: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  quantity: number;
  createdAt: string;
  deliveryDetails?: { email?: string; password?: string; instructions?: string };
  deliveredAccounts?: { email: string; password: string }[];
  productId?: { game?: string; title?: string; images?: string[] };
}

function StatusBadge({ status, t }: { status: string; t: (k: any) => string }) {
  const map: Record<string, { label: string; classes: string }> = {
    completed: { label: t('orders.statusCompleted'), classes: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
    pending:   { label: t('orders.statusPending'),   classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
    failed:    { label: t('orders.statusFailed'),     classes: 'bg-red-500/15 text-red-400 border border-red-500/20' },
    refunded:  { label: t('orders.statusRefunded'),   classes: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
  };
  const { label, classes } = map[status] ?? { label: status, classes: 'bg-gray-700 text-gray-300' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${classes}`}>
      {label}
    </span>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Warning gate state
  const [showWarning, setShowWarning] = useState(false);
  const [warningAcked, setWarningAcked] = useState(false);

  // Per-credential reveal toggles
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login');
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setOrder(d.order); }
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [authStatus, orderId]);

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <p className="text-red-400 mb-4">{error || 'Order not found'}</p>
          <Link href="/orders" className="text-violet-400 hover:text-violet-300 text-sm">
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const product = order.productId;
  const hasCredentials =
    order.deliveryDetails?.email || (order.deliveredAccounts?.length ?? 0) > 0;
  const isBulk = (order.deliveredAccounts?.length ?? 0) > 0;

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('orders.backToOrders')}
        </Link>

        {/* Order Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h1 className="text-white font-black text-xl mb-1">{t('orders.orderDetails')}</h1>
              <p className="text-gray-600 text-xs font-mono">#{order._id.slice(-12).toUpperCase()}</p>
            </div>
            <StatusBadge status={order.status} t={t} />
          </div>

          {/* Product info */}
          {product && (
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-800">
              {product.images?.[0] ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0 border border-gray-700">
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              )}
              <div>
                {product.game && (
                  <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                    {product.game}
                  </p>
                )}
                <p className="text-white font-semibold">{product.title}</p>
              </div>
            </div>
          )}

          {/* Order meta grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 text-xs mb-0.5">{t('orders.date')}</p>
              <p className="text-gray-300">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs mb-0.5">{t('orders.amount')}</p>
              <p className="text-emerald-400 font-bold price-ltr">{formatPrice(order.amount / 100)}</p>
            </div>
            {order.paymentMethod && (
              <div>
                <p className="text-gray-600 text-xs mb-0.5">{t('orders.paymentMethodLabel')}</p>
                <p className="text-gray-300 capitalize">{order.paymentMethod}</p>
              </div>
            )}
            {order.quantity > 1 && (
              <div>
                <p className="text-gray-600 text-xs mb-0.5">{t('orders.quantity')}</p>
                <p className="text-gray-300">×{order.quantity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credentials section */}
        {order.status === 'completed' && (
          <div className="mb-5">
            {!hasCredentials ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-center">
                <p className="text-gray-500 text-sm">{t('orders.noCredentials')}</p>
              </div>
            ) : !warningAcked ? (
              /* ── Warning gate ── */
              <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/25 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h2 className="text-amber-400 font-bold text-base">{t('orders.warningTitle')}</h2>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  {t('orders.warningText')}
                </p>
                <button
                  onClick={() => setWarningAcked(true)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  {t('orders.warningButton')}
                </button>
              </div>
            ) : (
              /* ── Credentials revealed ── */
              <div className="space-y-4">
                <h2 className="text-white font-bold text-lg">{t('orders.credentials')}</h2>

                {/* Bulk accounts */}
                {isBulk && order.deliveredAccounts!.map((acct, idx) => {
                  const key = `bulk-${idx}`;
                  const show = revealed.has(key);
                  return (
                    <div key={idx} className="bg-gray-900 border border-violet-500/20 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
                          {t('orders.accountNumber')} #{idx + 1}
                        </p>
                        <button
                          onClick={() => toggleReveal(key)}
                          className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                        >
                          {show ? t('orders.hide') : t('orders.reveal')}
                        </button>
                      </div>
                      {show && (
                        <div className="bg-violet-900/20 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 text-sm flex-shrink-0">Email</span>
                            <span className="text-gray-200 font-mono text-sm select-all break-all">{acct.email}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 text-sm flex-shrink-0">Password</span>
                            <span className="text-gray-200 font-mono text-sm select-all break-all">{acct.password}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Single / shared credentials */}
                {!isBulk && order.deliveryDetails && (
                  <div className="bg-gray-900 border border-violet-500/20 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider">
                        {t('orders.credentials')}
                      </p>
                      <button
                        onClick={() => toggleReveal('single')}
                        className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                      >
                        {revealed.has('single') ? t('orders.hide') : t('orders.reveal')}
                      </button>
                    </div>
                    {revealed.has('single') && (
                      <div className="bg-violet-900/20 rounded-xl p-4 space-y-2">
                        {order.deliveryDetails.email && (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 text-sm flex-shrink-0">Email</span>
                            <span className="text-gray-200 font-mono text-sm select-all break-all">{order.deliveryDetails.email}</span>
                          </div>
                        )}
                        {order.deliveryDetails.password && (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 text-sm flex-shrink-0">Password</span>
                            <span className="text-gray-200 font-mono text-sm select-all break-all">{order.deliveryDetails.password}</span>
                          </div>
                        )}
                        {order.deliveryDetails.instructions && (
                          <p className="text-gray-400 text-xs pt-2 border-t border-violet-500/20 leading-relaxed">
                            {order.deliveryDetails.instructions}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-amber-500 text-xs">⚠️ Change passwords immediately. Never share these credentials.</p>
              </div>
            )}
          </div>
        )}

        {/* Contact notice */}
        <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">
            {t('orders.contactNotice')}{' '}
            <a href="#" className="text-green-400 hover:text-green-300 font-medium transition-colors">
              {t('orders.whatsapp')}
            </a>
            {' '}{t('orders.or')}{' '}
            <a
              href="https://www.instagram.com/mtjr.nexus/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
            >
              {t('orders.instagram')}
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
