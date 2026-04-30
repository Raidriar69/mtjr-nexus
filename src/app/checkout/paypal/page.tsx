'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';
import { useCart } from '@/lib/cart';

const PAYPAL_EMAIL = 'mkx399@gmail.com';

function PayPalEmailCopyButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <button
      onClick={copy}
      className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all border ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-[#009cde]/10 text-[#009cde] border-[#009cde]/25 hover:bg-[#009cde]/20'
      }`}
    >
      {copied ? (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
      ) : (
        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
      )}
    </button>
  );
}

interface ProductLine {
  id: string;
  title: string;
  game: string;
  price: number;
  qty: number;
  image?: string;
}

type Phase = 'loading' | 'instructions' | 'pending_review' | 'error';

export default function PayPalManualPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const { clearCart } = useCart();

  // Data from query params (set by checkout page after creating order)
  const orderIdsParam   = searchParams.get('order_ids') ?? '';
  const invoiceId       = searchParams.get('invoice_id') ?? '';
  const verifyCode      = searchParams.get('code') ?? '';
  const totalCents      = Number(searchParams.get('total') ?? '0');
  const productsParam   = searchParams.get('products') ?? '[]';

  const [phase, setPhase]         = useState<Phase>('loading');
  const [copied, setCopied]       = useState(false);
  const [marking, setMarking]     = useState(false);
  const [error, setError]         = useState('');

  const orderIds: string[] = orderIdsParam ? orderIdsParam.split(',') : [];

  useEffect(() => {
    if (!invoiceId || !verifyCode || orderIds.length === 0) {
      setError('Invalid payment link. Please return to checkout.');
      setPhase('error');
      return;
    }
    setPhase('instructions');
  }, [invoiceId, verifyCode, orderIds.length]);

  let products: ProductLine[] = [];
  try { products = JSON.parse(decodeURIComponent(productsParam)); } catch {}

  // ── Copy code to clipboard ────────────────────────────────────────────────
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verifyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
    }
  }, [verifyCode]);

  // ── Mark as Paid ──────────────────────────────────────────────────────────
  async function handleMarkPaid() {
    setMarking(true);
    try {
      const res = await fetch('/api/paypal/mark-paid', {
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
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Preparing your payment instructions…</p>
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

  // ── Pending admin review (after Mark as Paid) ─────────────────────────────
  if (phase === 'pending_review') {
    return (
      <div className="min-h-screen bg-gray-950 pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 text-center shadow-[0_0_40px_rgba(59,130,246,0.1)]">
            {/* Animated clock icon */}
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-white font-black text-2xl mb-2">Payment Submitted!</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We've received your payment notification. Our team will verify your PayPal payment and approve your order — usually within <span className="text-white font-semibold">a few minutes to 1 hour</span>.
            </p>

            {/* Invoice reminder */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 text-left">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-3">Your Reference</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Invoice ID</span>
                <span className="text-white font-mono text-sm font-semibold">{invoiceId}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400 text-sm">Code</span>
                <span className="text-blue-300 font-mono text-xs">{verifyCode}</span>
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

        {/* Back link */}
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
        <div className="flex items-center gap-4 mb-5">
          {/* PayPal logo */}
          <div className="w-14 h-14 bg-[#003087]/20 border border-[#009cde]/30 rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src="/icons/paypal-full.png" alt="PayPal" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-white font-black text-xl">PayPal Payment</h1>
            <p className="text-gray-500 text-sm">Manual verification · Usually approved within 1 hour</p>
          </div>
        </div>

        {/* PayPal email — prominent display */}
        <div className="bg-[#003087]/15 border border-[#009cde]/30 rounded-2xl px-5 py-4 mb-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#009cde]/15 border border-[#009cde]/25 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#009cde]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Send Payment To</p>
            <p className="text-white font-bold text-base select-all">mkx399@gmail.com</p>
          </div>
          <PayPalEmailCopyButton email="mkx399@gmail.com" />
        </div>

        {/* Invoice + total card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Invoice</p>
              <p className="text-white font-mono font-bold text-lg">{invoiceId}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-0.5">Total</p>
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

        {/* 4-word code — hero element */}
        <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border-2 border-blue-500/40 rounded-2xl p-6 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider">
              Your Verification Code — Include in PayPal Note
            </p>
          </div>

          <div className="bg-black/40 border border-blue-500/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-white font-mono font-bold text-lg sm:text-xl tracking-wide select-all break-all">
              {verifyCode}
            </p>
            <button
              onClick={copyCode}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-amber-400/90 text-xs leading-relaxed">
              <span className="font-bold">Important:</span> You must paste this exact code in the PayPal payment note. Without it, your payment cannot be verified.
            </p>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 text-xs font-bold">?</span>
            How to Pay
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: '1',
                title: 'Open PayPal',
                desc: 'Log in to your PayPal account at paypal.com or on the PayPal app.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                ),
              },
              {
                step: '2',
                title: 'Send Money',
                desc: `Send exactly ${formatPrice(totalCents / 100)} to mkx399@gmail.com on PayPal. Use "Send to a friend" (Friends & Family) to avoid extra fees.`,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '3',
                title: 'Add the Code in the Note',
                desc: 'In the "Add a note" field, paste your verification code exactly as shown above.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ),
              },
              {
                step: '4',
                title: 'Return Here & Click "Mark as Paid"',
                desc: 'After sending the payment, come back and click the button below. We\'ll verify and deliver your account.',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }) => (
              <li key={step} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400">
                  {icon}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-0.5">
                    <span className="text-gray-600 mr-1.5">Step {step}.</span>{title}
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
                <li>Make sure you have actually sent the payment</li>
                <li>The code in your PayPal note must match exactly (case-insensitive)</li>
                <li>Send the correct amount: <span className="text-white font-semibold price-ltr">{formatPrice(totalCents / 100)}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mark as Paid CTA */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3 text-red-400 text-xs">{error}</div>
        )}

        <button
          onClick={handleMarkPaid}
          disabled={marking}
          className="w-full bg-[#009cde] hover:bg-[#00b4f0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl text-base transition-all shadow-[0_0_25px_rgba(0,156,222,0.3)] hover:shadow-[0_0_35px_rgba(0,156,222,0.5)] flex items-center justify-center gap-2.5"
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
              ✅ I've Paid — Mark as Paid
            </>
          )}
        </button>

        <p className="text-gray-700 text-xs text-center mt-3">
          Don't click this until you've actually sent the PayPal payment
        </p>

      </div>
    </div>
  );
}
