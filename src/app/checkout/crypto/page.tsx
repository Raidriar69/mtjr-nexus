'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/lib/currency';
import { useCart } from '@/lib/cart';

interface ProductLine {
  id: string;
  title: string;
  game: string;
  price: number;
  qty: number;
  image?: string;
}

// ── Coin display metadata ──────────────────────────────────────────────────────
const COIN_META: Record<string, { label: string; color: string; bg: string; border: string; symbol: string; icon: string }> = {
  BTC: { label: 'Bitcoin',  color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', symbol: '₿', icon: '/icons/btc.png' },
  ETH: { label: 'Ethereum', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   symbol: 'Ξ', icon: '/icons/eth.png' },
  SOL: { label: 'Solana',   color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', symbol: '◎', icon: '/icons/sol.png' },
  LTC: { label: 'Litecoin', color: 'text-gray-300',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30',   symbol: 'Ł', icon: '/icons/ltc.png' },
};

type Phase = 'loading' | 'instructions' | 'pending_review' | 'error';

export default function CryptoPaymentPage() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { formatPrice } = useCurrency();
  const { clearCart } = useCart();

  // Data passed via query params from checkout page
  const orderIdsParam    = searchParams.get('order_ids') ?? '';
  const invoiceId        = searchParams.get('invoice_id') ?? '';
  const coin             = searchParams.get('coin') ?? '';
  const cryptoAmount     = searchParams.get('crypto_amount') ?? '';
  const walletAddress    = searchParams.get('wallet') ?? '';
  const totalCentsParam  = searchParams.get('total') ?? '0';
  const productsParam    = searchParams.get('products') ?? '[]';

  const [phase, setPhase]         = useState<Phase>('loading');
  const [copiedAddr, setCopiedAddr]   = useState(false);
  const [copiedAmt, setCopiedAmt]     = useState(false);
  const [marking, setMarking]     = useState(false);
  const [error, setError]         = useState('');

  const orderIds: string[] = orderIdsParam ? orderIdsParam.split(',') : [];
  const totalCents = Number(totalCentsParam);

  let products: ProductLine[] = [];
  try { products = JSON.parse(decodeURIComponent(productsParam)); } catch {}

  const meta = COIN_META[coin] ?? COIN_META['BTC'];

  useEffect(() => {
    if (!invoiceId || !coin || !cryptoAmount || !walletAddress || orderIds.length === 0) {
      setError('Invalid payment link. Please return to checkout.');
      setPhase('error');
      return;
    }
    setPhase('instructions');
  }, [invoiceId, coin, cryptoAmount, walletAddress, orderIds.length]);

  // ── Copy helpers ──────────────────────────────────────────────────────────
  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2500);
    } catch {}
  }, [walletAddress]);

  const copyAmount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cryptoAmount);
      setCopiedAmt(true);
      setTimeout(() => setCopiedAmt(false), 2500);
    } catch {}
  }, [cryptoAmount]);

  // ── Mark as Paid ──────────────────────────────────────────────────────────
  async function handleMarkPaid() {
    setMarking(true);
    try {
      const res = await fetch('/api/crypto/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      clearCart();
      setPhase('pending_review');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please contact support.');
    } finally {
      setMarking(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className={`w-12 h-12 border-2 border-t-orange-500 border-orange-500/20 rounded-full animate-spin`} />
          <p className="text-gray-400 text-sm">Preparing payment details…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/cart" className="text-violet-400 hover:text-violet-300 text-sm underline">
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  // ── Pending review ────────────────────────────────────────────────────────
  if (phase === 'pending_review') {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className={`bg-gray-900 border rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(249,115,22,0.08)]`}
               style={{ borderColor: 'rgba(249,115,22,0.25)' }}>
            {/* Icon */}
            <div className={`w-20 h-20 ${meta.bg} border ${meta.border} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <svg className={`w-10 h-10 ${meta.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-white font-black text-2xl mb-2">Payment Submitted!</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We'll verify your {meta.label} transaction and approve your order — usually within{' '}
              <span className="text-white font-semibold">a few minutes to 2 hours</span>.
            </p>

            {/* Reference card */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 text-left space-y-2">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Your Reference</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Invoice ID</span>
                <span className="text-white font-mono text-sm font-semibold">{invoiceId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className={`${meta.color} font-mono text-sm font-semibold`}>{cryptoAmount} {coin}</span>
              </div>
            </div>

            <p className="text-gray-500 text-xs mb-6">
              Once approved, your account credentials will be available in{' '}
              <Link href="/orders" className="text-violet-400 hover:text-violet-300 underline">
                My Orders
              </Link>.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/orders"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                View My Orders
              </Link>
              <Link
                href="/products"
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl text-sm transition-colors"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main instructions page ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 pt-20 pb-16">
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Back */}
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cart
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 ${meta.bg} border ${meta.border} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <img src={meta.icon} alt={meta.label} className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl">{meta.label} Payment</h1>
            <p className="text-gray-500 text-sm">Manual verification · Usually approved within 2 hours</p>
          </div>
        </div>

        {/* Invoice + total card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Invoice</p>
              <p className="text-white font-mono font-bold text-lg">{invoiceId}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Total (USD)</p>
              <p className="text-emerald-400 font-black text-2xl price-ltr">
                {formatPrice(totalCents / 100)}
              </p>
            </div>
          </div>

          {/* Product list */}
          {products.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
              {products.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-violet-400 text-[10px] font-semibold uppercase tracking-wider">{p.game}</p>
                    <p className="text-white text-xs font-medium truncate">{p.title}</p>
                    {p.qty > 1 && <p className="text-gray-600 text-[10px]">×{p.qty}</p>}
                  </div>
                  <span className="text-white text-sm font-semibold price-ltr flex-shrink-0">
                    {formatPrice(p.price * p.qty)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Exact amount — hero element ── */}
        <div className={`${meta.bg} border-2 ${meta.border} rounded-2xl p-6 mb-4`}
             style={{ boxShadow: '0 0 30px rgba(249,115,22,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 ${meta.bg} rounded-full flex items-center justify-center`}>
              <svg className={`w-3.5 h-3.5 ${meta.color}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className={`${meta.color} text-xs font-semibold uppercase tracking-wider`}>
              Send This Exact Amount
            </p>
          </div>

          {/* Amount row */}
          <div className="bg-black/40 border border-gray-700/60 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-3">
            <div className="min-w-0">
              <p className={`text-white font-mono font-black text-2xl sm:text-3xl tracking-wide select-all break-all`}>
                {cryptoAmount}
              </p>
              <p className={`${meta.color} font-bold text-sm mt-0.5`}>{coin}</p>
            </div>
            <button
              onClick={copyAmount}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                copiedAmt
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : `${meta.bg} ${meta.color} ${meta.border} border hover:opacity-80`
              }`}
            >
              {copiedAmt ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-amber-400/90 text-xs leading-relaxed">
              <span className="font-bold">Important:</span> Send <span className="text-white font-semibold">exactly this amount</span> — including all decimal places. The unique amount identifies your payment.
            </p>
          </div>
        </div>

        {/* ── Wallet address ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Send to This {meta.label} Address
          </p>

          <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3.5 flex items-center gap-3">
            <p className="text-white font-mono text-xs sm:text-sm flex-1 break-all select-all leading-relaxed">
              {walletAddress}
            </p>
            <button
              onClick={copyAddress}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                copiedAddr
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
              }`}
            >
              {copiedAddr ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
              )}
            </button>
          </div>
        </div>

        {/* ── Step-by-step instructions ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 text-xs font-bold">?</span>
            How to Pay
          </h2>
          <ol className="space-y-4">
            {[
              {
                title: `Open your ${meta.label} wallet`,
                desc: `Use any {meta.label} wallet app (Exodus, Trust Wallet, MetaMask for ETH, Phantom for SOL, etc.) or your exchange.`.replace(/{meta.label}/g, meta.label),
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
              },
              {
                title: `Send exactly ${cryptoAmount} ${coin}`,
                desc: `Copy the exact amount above and paste it into the "Amount" field. Every decimal place matters — it's how we identify your payment.`,
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
              {
                title: 'Paste the wallet address',
                desc: 'Copy the wallet address above and paste it as the recipient. Double-check the first and last few characters.',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
              },
              {
                title: 'Return here & click "Mark as Paid"',
                desc: "After broadcasting the transaction, click the button below. We'll verify the on-chain payment and deliver your account.",
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
            ].map(({ title, desc, icon }, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400">
                  {icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-0.5">
                    <span className="text-gray-600 mr-1.5">Step {idx + 1}.</span>{title}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-amber-400 text-xs font-bold mb-1">Before clicking "Mark as Paid"</p>
              <ul className="text-amber-400/70 text-xs space-y-0.5 list-disc list-inside leading-relaxed">
                <li>Make sure you have actually sent the transaction</li>
                <li>The amount must match exactly: <span className="text-white font-semibold">{cryptoAmount} {coin}</span></li>
                <li>Send to the correct address shown above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 text-red-400 text-xs">{error}</div>
        )}

        {/* CTA */}
        <button
          onClick={handleMarkPaid}
          disabled={marking}
          className={`w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2.5 ${
            coin === 'BTC' ? 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)] hover:shadow-[0_0_35px_rgba(249,115,22,0.5)]' :
            coin === 'ETH' ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:shadow-[0_0_35px_rgba(59,130,246,0.5)]' :
            coin === 'SOL' ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)]' :
            'bg-gray-600 hover:bg-gray-500 shadow-[0_0_25px_rgba(156,163,175,0.2)] hover:shadow-[0_0_35px_rgba(156,163,175,0.3)]'
          }`}
        >
          {marking ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ✅ I've Sent It — Mark as Paid
            </>
          )}
        </button>

        <p className="text-gray-700 text-xs text-center mt-3">
          Don't click this until you've actually sent the {coin} transaction
        </p>

      </div>
    </div>
  );
}
