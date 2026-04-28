'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';

const PayPalCartButtons = dynamic(() => import('@/components/checkout/PayPalCartButtons'), {
  ssr: false,
  loading: () => <div className="h-12 bg-gray-800 animate-pulse rounded-xl" />,
});

type Tab = 'paypal' | 'crypto';
type Coin = 'BTC' | 'ETH' | 'SOL' | 'LTC';

const COINS: { id: Coin; icon: string; color: string }[] = [
  { id: 'BTC', icon: '₿', color: 'border-orange-500/50 text-orange-400 bg-orange-500/10' },
  { id: 'ETH', icon: 'Ξ', color: 'border-blue-500/50 text-blue-400 bg-blue-500/10' },
  { id: 'SOL', icon: '◎', color: 'border-purple-500/50 text-purple-400 bg-purple-500/10' },
  { id: 'LTC', icon: 'Ł', color: 'border-gray-400/50 text-gray-300 bg-gray-400/10' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, total } = useCart();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<Tab>('paypal');
  const [coin, setCoin] = useState<Coin>('BTC');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [warningAcked, setWarningAcked] = useState(false);

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0) router.replace('/cart');
  }, [items, router]);

  const productIds = items.map((i) => i._id);
  const quantities = items.map((i) => i.quantity);

  if (items.length === 0) return null;

  function validateEmail(): boolean {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  }

  async function handleCrypto() {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/crypto/create-cart-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, quantities, buyerEmail: email.trim(), coin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Crypto payment failed');
      setLoading(false);
    }
  }

  function handlePayPalSuccess(orderIds: string[]) {
    clearCart();
    router.push(`/checkout/success?order_id=${orderIds[0]}&all_ids=${orderIds.join(',')}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Pre-payment warning modal ── */}
        {!warningDismissed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_60px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-white font-bold text-xl">{t('checkout.warningTitle')}</h2>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                {t('checkout.warningText')}
              </p>

              <label className="flex items-start gap-3 mb-6 cursor-pointer group">
                <div
                  onClick={() => setWarningAcked(!warningAcked)}
                  className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    warningAcked
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-gray-600 group-hover:border-violet-500'
                  }`}
                >
                  {warningAcked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-300 text-sm">{t('checkout.warningAck')}</span>
              </label>

              <button
                onClick={() => { if (warningAcked) setWarningDismissed(true); }}
                disabled={!warningAcked}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all text-base"
              >
                {t('checkout.warningProceed')}
              </button>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-gray-300 transition-colors">Products</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/cart" className="hover:text-gray-300 transition-colors">{t('checkout.breadcrumbCart')}</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white font-medium">{t('checkout.breadcrumbCheckout')}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* ── LEFT: Payment form ── */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl font-bold text-white">{t('checkout.title')}</h1>

            {/* Email */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                {t('checkout.emailLabel')}
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!session?.user?.email}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {session?.user?.email && (
                <p className="text-gray-600 text-xs mt-2">Using your account email.</p>
              )}
            </div>

            {/* Payment method tabs */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Tab bar */}
              <div className="grid grid-cols-2 border-b border-gray-800">
                {[
                  { id: 'paypal' as const, label: t('checkout.paypal'), icon: '🅿️' },
                  { id: 'crypto' as const, label: t('checkout.crypto'), icon: '₿' },
                ].map((tab_item) => (
                  <button
                    key={tab_item.id}
                    onClick={() => { setTab(tab_item.id); setLoading(false); }}
                    className={`py-4 px-2 text-sm font-semibold transition-all border-b-2 ${
                      tab === tab_item.id
                        ? 'border-violet-500 text-white bg-violet-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base mr-1.5">{tab_item.icon}</span>
                    {tab_item.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">

                {/* ── PAYPAL ── */}
                {tab === 'paypal' && (
                  <div className="space-y-4">
                    <p className="text-gray-400 text-sm">
                      Pay with your PayPal balance, bank account, or card. Full buyer protection included.
                    </p>
                    <PayPalCartButtons
                      items={items}
                      buyerEmail={email}
                      onSuccess={handlePayPalSuccess}
                    />
                    <p className="text-center text-gray-700 text-xs">
                      {t('checkout.paypalProtection')}
                    </p>
                  </div>
                )}

                {/* ── CRYPTO ── */}
                {tab === 'crypto' && (
                  <div className="space-y-5">
                    <p className="text-gray-400 text-sm">
                      Pay with cryptocurrency via NOWPayments. Confirmed on-chain before delivery.
                    </p>
                    <div>
                      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Select coin</p>
                      <div className="grid grid-cols-4 gap-3">
                        {COINS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCoin(c.id)}
                            className={`py-4 rounded-xl border text-center font-bold transition-all ${
                              coin === c.id ? c.color : 'border-gray-700 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                            }`}
                          >
                            <div className="text-2xl mb-1">{c.icon}</div>
                            <div className="text-xs">{c.id}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleCrypto}
                      disabled={loading}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                    >
                      {loading ? <Spinner dark /> : <>{t('checkout.proceedCrypto')} {formatPrice(total)} with {coin}</>}
                    </button>
                    <p className="text-center text-gray-600 text-xs">
                      Via NOWPayments · Hosted payment page · Confirmed on-chain
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="lg:col-span-2 sticky top-24">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5">
                {t('checkout.orderSummary')}
                <span className="ml-2 text-gray-500 text-sm font-normal">({items.length} {items.length !== 1 ? t('checkout.itemsPlural') : t('checkout.items')})</span>
              </h2>

              <div className="space-y-4 mb-5">
                {items.map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="w-14 h-10 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-violet-400 text-[10px] font-semibold uppercase tracking-wider">{item.game}</p>
                      <p className="text-white text-xs font-medium truncate">{item.title}</p>
                      {item.rank && <p className="text-amber-400 text-[10px]">🏆 {item.rank}</p>}
                      {item.productType === 'bulk' && item.quantity > 1 && (
                        <p className="text-gray-500 text-[10px]">×{item.quantity} accounts</p>
                      )}
                    </div>
                    <span className="text-white font-bold text-sm flex-shrink-0 price-ltr">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('checkout.subtotal')}</span>
                  <span className="text-white price-ltr">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('checkout.deliveryFee')}</span>
                  <span className="text-emerald-400">{t('checkout.free')}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline border-t border-gray-800 pt-4">
                <span className="text-white font-semibold">{t('checkout.totalLabel')}</span>
                <span className="text-white font-black text-2xl price-ltr">{formatPrice(total)}</span>
              </div>

              <div className="mt-5 space-y-2 pt-4 border-t border-gray-800">
                {[
                  t('checkout.instantDelivery'),
                  t('checkout.emailDelivery'),
                  t('checkout.encrypted'),
                ].map((txt) => (
                  <p key={txt} className="text-gray-600 text-xs">{txt}</p>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-medium mb-1">{t('product.buyerDisclaimer')}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{t('checkout.disclaimer')}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${dark ? 'text-gray-900' : 'text-white'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
