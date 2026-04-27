'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useCart } from '@/lib/cart';

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

  const [tab, setTab] = useState<Tab>('paypal');
  const [coin, setCoin] = useState<Coin>('BTC');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-gray-300 transition-colors">Products</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/cart" className="hover:text-gray-300 transition-colors">Cart</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white font-medium">Checkout</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* ── LEFT: Payment form ── */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-2xl font-bold text-white">Payment</h1>

            {/* Email */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                📧 Email for order receipt & credentials
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
                  { id: 'paypal' as const, label: 'PayPal', icon: '🅿️' },
                  { id: 'crypto' as const, label: 'Crypto', icon: '₿' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setLoading(false); }}
                    className={`py-4 px-2 text-sm font-semibold transition-all border-b-2 ${
                      tab === t.id
                        ? 'border-violet-500 text-white bg-violet-500/5'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base mr-1.5">{t.icon}</span>
                    {t.label}
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
                      🔒 Secured by PayPal · Buyer Protection included
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
                      {loading ? <Spinner dark /> : <>Pay ${total.toFixed(2)} with {coin}</>}
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
                Order Summary
                <span className="ml-2 text-gray-500 text-sm font-normal">({items.length} item{items.length !== 1 ? 's' : ''})</span>
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
                    <span className="text-white font-bold text-sm flex-shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-white">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery fee</span>
                  <span className="text-emerald-400">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline border-t border-gray-800 pt-4">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-black text-2xl">${total.toFixed(2)}</span>
              </div>

              <div className="mt-5 space-y-2 pt-4 border-t border-gray-800">
                {[
                  '⚡ Instant credential delivery after payment',
                  '📧 Account details sent to your email',
                  '🔒 Encrypted & secure transaction',
                ].map((txt) => (
                  <p key={txt} className="text-gray-600 text-xs">{txt}</p>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-medium mb-1">⚠️ Buyer Disclaimer</p>
              <p className="text-gray-600 text-xs leading-relaxed">
                Purchasing gaming accounts may violate game ToS. MTJR Nexus is not responsible for bans. All sales are final.
              </p>
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
