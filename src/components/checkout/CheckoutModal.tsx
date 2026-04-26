'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Product } from '@/types';

// Load PayPal buttons only client-side
const PayPalCheckoutPanel = dynamic(() => import('./PayPalCheckoutPanel'), {
  ssr: false,
  loading: () => (
    <div className="h-12 bg-gray-800 animate-pulse rounded-xl" />
  ),
});

type PaymentTab = 'stripe' | 'paypal' | 'crypto';
type CryptoCoin = 'BTC' | 'ETH' | 'SOL' | 'LTC';

const COIN_ICONS: Record<CryptoCoin, string> = { BTC: '₿', ETH: 'Ξ', SOL: '◎', LTC: 'Ł' };
const COIN_COLORS: Record<CryptoCoin, string> = {
  BTC: 'border-orange-500/60 text-orange-400 bg-orange-500/10',
  ETH: 'border-blue-500/60 text-blue-400 bg-blue-500/10',
  SOL: 'border-purple-500/60 text-purple-400 bg-purple-500/10',
  LTC: 'border-gray-400/60 text-gray-300 bg-gray-400/10',
};

interface Props {
  product: Product;
}

export function CheckoutModal({ product }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PaymentTab>('stripe');
  const [email, setEmail] = useState('');
  const [coin, setCoin] = useState<CryptoCoin>('BTC');
  const [loading, setLoading] = useState(false);

  // Populate email from session
  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (product.isSold) {
    return (
      <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-4 text-center text-gray-500 font-semibold text-lg tracking-wide">
        Account Sold
      </div>
    );
  }

  async function handleStripe() {
    const buyerEmail = email.trim();
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, buyerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Stripe checkout failed');
      setLoading(false);
    }
  }

  async function handleCrypto() {
    const buyerEmail = email.trim();
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/crypto/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, buyerEmail, coin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crypto payment failed');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Crypto payment failed');
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full relative overflow-hidden bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] active:scale-[0.98] group"
      >
        <span className="relative z-10">
          Buy Now — ${product.price.toFixed(2)}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient" />
      </button>

      {/* Modal Backdrop + Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!loading) setOpen(false); }}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-md bg-gray-900 border border-gray-700/80 rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-700 rounded-full" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="min-w-0 pr-4">
                  <h2 className="text-white text-xl font-bold">Checkout</h2>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{product.title}</p>
                </div>
                <button
                  onClick={() => { if (!loading) setOpen(false); }}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Price summary */}
              <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">{product.game}</p>
                  <p className="text-gray-300 text-sm mt-0.5 max-w-[180px] truncate">{product.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-black text-2xl">${product.price.toFixed(2)}</p>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <p className="text-gray-600 text-xs line-through">${product.originalPrice.toFixed(2)}</p>
                  )}
                </div>
              </div>

              {/* Payment method tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-gray-800/60 rounded-xl p-1 mb-5">
                {[
                  { id: 'stripe' as const, icon: '💳', label: 'Card', sub: 'Stripe' },
                  { id: 'paypal' as const, icon: '🅿️', label: 'PayPal', sub: 'PayPal' },
                  { id: 'crypto' as const, icon: '₿', label: 'Crypto', sub: 'BTC/ETH' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setLoading(false); }}
                    className={`py-2.5 px-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      tab === t.id
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <div className="text-base mb-0.5">{t.icon}</div>
                    <div>{t.label}</div>
                    <div className="opacity-60 text-[10px]">{t.sub}</div>
                  </button>
                ))}
              </div>

              {/* Email field (always shown — pre-filled if logged in) */}
              <div className="mb-4">
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">
                  Email for order receipt
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!session?.user?.email}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* ── STRIPE TAB ── */}
              {tab === 'stripe' && (
                <div className="space-y-3">
                  <button
                    onClick={handleStripe}
                    disabled={loading}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Spinner /> : <><CardIcon /> Pay with Card</>}
                  </button>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="h-px flex-1 bg-gray-800" />
                    <span className="text-gray-600 text-xs">Accepts</span>
                    <div className="h-px flex-1 bg-gray-800" />
                  </div>
                  <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                    <span>Visa</span>
                    <span>·</span>
                    <span>Mastercard</span>
                    <span>·</span>
                    <span>Apple Pay</span>
                    <span>·</span>
                    <span>Google Pay</span>
                  </div>
                  <p className="text-center text-gray-700 text-xs">
                    🔒 Secured by Stripe — PCI DSS Level 1
                  </p>
                </div>
              )}

              {/* ── PAYPAL TAB ── */}
              {tab === 'paypal' && (
                <div className="space-y-3">
                  <PayPalCheckoutPanel
                    product={product}
                    buyerEmail={email}
                    onSuccess={(orderId) => {
                      setOpen(false);
                      window.location.href = `/checkout/success?order_id=${orderId}`;
                    }}
                  />
                  <p className="text-center text-gray-700 text-xs mt-2">
                    🔒 Secured by PayPal — Buyer Protection included
                  </p>
                </div>
              )}

              {/* ── CRYPTO TAB ── */}
              {tab === 'crypto' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-xs font-medium mb-2">Select cryptocurrency</p>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(COIN_ICONS) as CryptoCoin[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setCoin(c)}
                          className={`py-3 rounded-xl text-sm font-bold border transition-all duration-150 ${
                            coin === c
                              ? COIN_COLORS[c]
                              : 'border-gray-700 text-gray-500 bg-transparent hover:border-gray-600 hover:text-gray-300'
                          }`}
                        >
                          <div className="text-xl mb-1">{COIN_ICONS[c]}</div>
                          <div className="text-xs">{c}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCrypto}
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Spinner dark /> : <><span className="text-lg">{COIN_ICONS[coin]}</span> Pay with {coin}</>}
                  </button>
                  <p className="text-center text-gray-600 text-xs">
                    Via NOWPayments · Payment confirmed on-chain
                  </p>
                </div>
              )}

              {/* Footer note */}
              <p className="text-gray-700 text-xs text-center mt-5 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                All transactions are encrypted and secure
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
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
