'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';

type Method = 'paypal' | 'BTC' | 'ETH' | 'SOL' | 'LTC';

// ── Payment method definitions ────────────────────────────────────────────────
const METHODS: {
  id: Method;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  accent: string;        // Tailwind border/text/bg accent classes
  buttonColor: string;   // CTA button classes
}[] = [
  {
    id: 'paypal',
    label: 'PayPal',
    sublabel: 'Manual transfer · 1–60 min approval',
    icon: (
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/icons/paypal-p.png" alt="PayPal" className="w-8 h-8 object-contain" />
      </div>
    ),
    accent: 'border-[#009cde]/40 text-[#009cde] bg-[#009cde]/8',
    buttonColor: 'bg-[#009cde] hover:bg-[#00b4f0] shadow-[0_0_25px_rgba(0,156,222,0.35)]',
  },
  {
    id: 'BTC',
    label: 'Bitcoin',
    sublabel: 'On-chain · Manual verification',
    icon: (
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/icons/btc.png" alt="Bitcoin" className="w-8 h-8 object-contain" />
      </div>
    ),
    accent: 'border-orange-500/40 text-orange-400 bg-orange-500/8',
    buttonColor: 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)]',
  },
  {
    id: 'ETH',
    label: 'Ethereum',
    sublabel: 'ERC-20 · Manual verification',
    icon: (
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/icons/eth.png" alt="Ethereum" className="w-8 h-8 object-contain" />
      </div>
    ),
    accent: 'border-blue-500/40 text-blue-400 bg-blue-500/8',
    buttonColor: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35)]',
  },
  {
    id: 'SOL',
    label: 'Solana',
    sublabel: 'Fast & low fees · Manual verification',
    icon: (
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/icons/sol.png" alt="Solana" className="w-8 h-8 object-contain" />
      </div>
    ),
    accent: 'border-purple-500/40 text-purple-400 bg-purple-500/8',
    buttonColor: 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35)]',
  },
  {
    id: 'LTC',
    label: 'Litecoin',
    sublabel: 'Reliable & low cost · Manual verification',
    icon: (
      <div className="w-8 h-8 flex items-center justify-center">
        <img src="/icons/ltc.png" alt="Litecoin" className="w-8 h-8 object-contain" />
      </div>
    ),
    accent: 'border-gray-400/30 text-gray-300 bg-gray-400/8',
    buttonColor: 'bg-gray-600 hover:bg-gray-500 shadow-[0_0_25px_rgba(156,163,175,0.2)]',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, total } = useCart();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();

  const [method, setMethod]               = useState<Method>('paypal');
  const [email, setEmail]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [warningAcked, setWarningAcked]   = useState(false);

  // ── Admin free coupon ─────────────────────────────────���────────────────────
  const [couponInput, setCouponInput]     = useState('');
  const [couponState, setCouponState]     = useState<'idle' | 'applying' | 'valid' | 'invalid' | 'unauthorized'>('idle');
  const adminFreeActive = couponState === 'valid';

  useEffect(() => {
    if (session?.user?.email) setEmail(session.user.email);
  }, [session]);

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

  const selectedDef = METHODS.find((m) => m.id === method)!;

  // ── PayPal Manual ──────────────────────────────────────────────────────────
  async function handlePayPal() {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/paypal/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          quantities,
          buyerEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      // Build instruction page URL with all needed data
      const params = new URLSearchParams({
        order_ids:  data.orderIds.join(','),
        invoice_id: data.paypalInvoiceId,
        code:       data.paypalVerificationCode,
        total:      String(data.totalCents),
        products:   encodeURIComponent(JSON.stringify(data.products)),
      });
      router.push(`/checkout/paypal?${params.toString()}`);
    } catch (err: any) {
      toast.error(err.message || 'Could not create PayPal order');
      setLoading(false);
    }
  }

  // ── Crypto Manual ──────────────────────────────────────────────────────────
  async function handleCrypto() {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/crypto/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          quantities,
          buyerEmail: email.trim(),
          coin: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create crypto order');

      const params = new URLSearchParams({
        order_ids:    data.orderIds.join(','),
        invoice_id:   data.cryptoInvoiceId,
        coin:         data.coin,
        crypto_amount: String(data.cryptoManualAmount),
        wallet:       data.walletAddress,
        total:        String(data.totalCents),
        products:     encodeURIComponent(JSON.stringify(data.products)),
      });
      router.push(`/checkout/crypto?${params.toString()}`);
    } catch (err: any) {
      toast.error(err.message || 'Crypto payment failed');
      setLoading(false);
    }
  }

  async function handleProceed() {
    if (method === 'paypal') {
      await handlePayPal();
    } else {
      await handleCrypto();
    }
  }

  // ── Apply admin-free coupon ───────────────────────────────────────────────
  async function applyCoupon() {
    if (!couponInput.trim()) return;
    if (!validateEmail()) return;
    setCouponState('applying');
    try {
      // Probe the endpoint with a dry-run by checking auth status first
      // The actual coupon is validated on claim — here we just do a lightweight check
      const res = await fetch('/api/orders/admin-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send empty productIds to get a quick auth+coupon check
        body: JSON.stringify({
          coupon: couponInput.trim(),
          productIds: [],
          quantities: [],
          buyerEmail: email.trim(),
        }),
      });
      const data = await res.json();

      if (res.status === 401) { setCouponState('idle'); toast.error('Sign in to use this coupon'); return; }
      if (res.status === 403) { setCouponState('unauthorized'); return; }
      if (res.status === 400 && data.error === 'Invalid coupon code') { setCouponState('invalid'); return; }
      // 400 "No products specified" = auth + coupon both valid ✓
      if (res.status === 400 && data.error === 'No products specified') { setCouponState('valid'); return; }
      if (res.ok) { setCouponState('valid'); return; }
      setCouponState('invalid');
    } catch {
      setCouponState('idle');
      toast.error('Could not validate coupon');
    }
  }

  // ── Claim admin-free order ────────────────────────────────────────────────
  async function handleAdminFree() {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders/admin-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon: couponInput.trim(),
          productIds,
          quantities,
          buyerEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      clearCart();
      router.push(`/checkout/success?order_id=${data.orderIds[0]}&all_ids=${data.orderIds.join(',')}`);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
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

            {/* ── Coupon code ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                🎟️ Coupon Code <span className="text-gray-600 font-normal text-xs">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code…"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); if (couponState !== 'idle') setCouponState('idle'); }}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  disabled={adminFreeActive}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase tracking-widest"
                />
                {!adminFreeActive ? (
                  <button
                    onClick={applyCoupon}
                    disabled={couponState === 'applying' || !couponInput.trim()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0 flex items-center gap-1.5"
                  >
                    {couponState === 'applying' ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : 'Apply'}
                  </button>
                ) : (
                  <button
                    onClick={() => { setCouponState('idle'); setCouponInput(''); }}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Feedback */}
              {couponState === 'valid' && (
                <div className="mt-2.5 flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                  Coupon applied — Admin Test Mode activated. Total is FREE.
                </div>
              )}
              {couponState === 'invalid' && (
                <p className="mt-2 text-red-400 text-xs font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Invalid coupon code.
                </p>
              )}
              {couponState === 'unauthorized' && (
                <p className="mt-2 text-amber-400 text-xs font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Admin access required for this coupon.
                </p>
              )}
            </div>

            {/* ── Admin Free Panel (replaces payment selector when active) ── */}
            {adminFreeActive ? (
              <div className="bg-gray-900 border-2 border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                {/* Header stripe */}
                <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/20 border-b border-emerald-500/20 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-300 font-bold text-sm">Admin Test Mode</p>
                      <p className="text-emerald-600 text-xs">Coupon: ADMINFREE</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-3 py-1.5">
                    <p className="text-emerald-300 font-black text-lg leading-none">FREE</p>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    Orders will be created and credentials delivered <span className="text-white font-semibold">instantly</span> — no payment processor involved. Use this to test the full delivery flow.
                  </p>

                  {/* Checklist */}
                  <ul className="space-y-1.5 mb-5">
                    {[
                      'Order created in database',
                      'Credentials delivered immediately',
                      'Redirected to success page',
                      'Viewable in /orders',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleAdminFree}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-base transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2.5"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Claiming…
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        🎟️ Claim Free (Admin Test)
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
              {/* Payment method selector */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
                  {t('checkout.selectPayment')}
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {METHODS.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setMethod(m.id); setLoading(false); }}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          active
                            ? `${m.accent} border-opacity-100`
                            : 'border-gray-800 hover:border-gray-700 bg-gray-800/30'
                        }`}
                      >
                        <div className="flex-shrink-0">{m.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm ${active ? '' : 'text-gray-300'}`}>
                            {m.label}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">{m.sublabel}</p>
                        </div>
                        {/* Selection indicator */}
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          active ? 'border-current' : 'border-gray-600'
                        }`}>
                          {active && <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Method-specific info strip */}
              <div className="px-6 pb-5 pt-3 border-t border-gray-800 mt-3">
                {method === 'paypal' && (
                  <div className="flex items-start gap-2.5 bg-[#009cde]/5 border border-[#009cde]/15 rounded-xl p-3.5">
                    <svg className="w-4 h-4 text-[#009cde] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[#009cde]/80 text-xs leading-relaxed">
                      You'll receive a unique 4-word code. Send payment to <span className="text-white font-semibold">mkx399@gmail.com</span> on PayPal, include the code in the note, then click "Mark as Paid". Delivered after admin verification.
                    </p>
                  </div>
                )}
                {method !== 'paypal' && (
                  <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5">
                    <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-amber-400/80 text-xs leading-relaxed">
                      You'll get a unique wallet address and exact amount to send. After broadcasting the transaction, click "Mark as Paid". Delivered after admin verifies the on-chain payment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleProceed}
              disabled={loading}
              className={`w-full text-white font-black py-4 rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2.5 ${selectedDef.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {method === 'paypal' ? 'Creating order…' : 'Redirecting…'}
                </>
              ) : (
                <>
                  {method === 'paypal' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Continue with PayPal
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Continue with {method} · {formatPrice(total)}
                    </>
                  )}
                </>
              )}
            </button>
              </>
            )}
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="lg:col-span-2 sticky top-24">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-5">
                {t('checkout.orderSummary')}
                <span className="ml-2 text-gray-500 text-sm font-normal">
                  ({items.length} {items.length !== 1 ? t('checkout.itemsPlural') : t('checkout.items')})
                </span>
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
                {adminFreeActive ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 line-through text-sm price-ltr">{formatPrice(total)}</span>
                    <span className="text-emerald-400 font-black text-2xl">FREE</span>
                  </div>
                ) : (
                  <span className="text-white font-black text-2xl price-ltr">{formatPrice(total)}</span>
                )}
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
